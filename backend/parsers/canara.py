import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple, get_type

log = logging.getLogger("canara_parser")


def parse(pdf) -> pd.DataFrame:
    """Parse Canara Bank statement PDF. Tries table extraction first,
    then falls back to text-based line parsing."""
    transactions = []
    skipped = 0

    log.info("Canara Parser: Starting — %d page(s)", len(pdf.pages))

    # --- Strategy 1: Table extraction ---
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    data_rows = [r for r in all_rows if r and len(r) >= 5
                 and str(r[0] or "").strip().lower() != "date"
                 and str(r[0] or "").strip() != ""]
    log.info("Table extraction: %d total rows, %d potential data rows", len(all_rows), len(data_rows))

    # Stricter table strategy: need at least 3 rows AND 50% must have valid dates
    dated_rows = [r for r in data_rows if _is_canara_date(str(r[0] or "").strip())]
    use_tables = len(data_rows) >= 3 and len(dated_rows) >= len(data_rows) * 0.5

    if use_tables:
        log.info("Using table-based parsing (%d dated / %d total)", len(dated_rows), len(data_rows))
        transactions, skipped = _parse_from_tables(pdf)
    else:
        log.info("Too few valid data rows from tables — using text-based parsing")
        transactions, skipped = _parse_from_text(pdf)

    log.info("Canara Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

    df = pd.DataFrame(transactions)
    if not df.empty:
        # Convert empty Time strings to '00:00:00' for proper datetime parsing
        df["Time"] = df["Time"].replace("", "00:00:00").fillna("00:00:00")

        # Sort by Date and Time
        df["DateTime"] = pd.to_datetime(
            df["Date"] + " " + df["Time"],
            format="%Y-%m-%d %H:%M:%S",
            errors="coerce"
        )
        df = df.sort_values("DateTime").reset_index(drop=True).drop(columns=["DateTime"])

        # Drop Time column after sorting
        if "Time" in df.columns:
            df = df.drop(columns=["Time"])

    return df


def _parse_from_tables(pdf) -> tuple[list, int]:
    """Parse using pdfplumber table extraction."""
    transactions = []
    skipped = 0

    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table_idx, table in enumerate(tables):
            for row_idx, row in enumerate(table):
                if not row or len(row) < 5:
                    skipped += 1
                    continue

                date_str = str(row[0] or "").strip()
                particulars = str(row[1] or "").strip()
                deposits = str(row[2] or "").strip()
                withdrawals = str(row[3] or "").strip()
                balance = str(row[4] or "").strip()

                result = _process_row(date_str, particulars, deposits, withdrawals, balance)
                if result:
                    transactions.append(result)
                else:
                    skipped += 1

    return transactions, skipped


def _parse_from_text(pdf) -> tuple[list, int]:
    """Parse using raw text extraction (fallback for borderless tables)."""
    transactions = []
    skipped = 0

    amount_re = re.compile(r"([\d,]+\.\d{2})")
    date_re = re.compile(r"^(\d{2}-\d{2}-\d{4})\b\s*(.*)")

    # Collect all text across pages to track running balance
    all_lines = []
    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            log.info("  Page %d: no text", page_idx + 1)
            continue
        lines = text.split("\n")
        log.info("  Page %d: %d text lines", page_idx + 1, len(lines))
        all_lines.extend(lines)

    # Try to find opening balance
    prev_balance = None
    for line in all_lines:
        ob = re.search(r"(?:Opening|opening)\s*[Bb]alance\s*[:\-]?\s*([\d,]+\.\d{2})", line)
        if ob:
            prev_balance = _amt(ob.group(1))
            log.info("  Found opening balance: %.2f", prev_balance)
            break

    i = 0
    while i < len(all_lines):
        line = all_lines[i].strip()
        if not line:
            i += 1
            continue

        # Skip opening balance line
        if "opening balance" in line.lower():
            i += 1
            continue

        # Skip header / non-transaction lines
        if line.startswith("Date") or "Particulars" in line:
            i += 1
            continue

        date_match = date_re.match(line)
        if not date_match:
            i += 1
            continue

        date_str = date_match.group(1)
        rest = date_match.group(2).strip()

        # Extract amounts from current line
        amounts = amount_re.findall(rest)

        # Handle multiline amounts
        next_line_idx = i + 1
        while len(amounts) < 2 and next_line_idx < len(all_lines):
            next_line = all_lines[next_line_idx]
            # Only absorb amounts from the very next non-empty line
            if next_line.strip():
                amounts.extend(amount_re.findall(next_line))
                next_line_idx += 1
                break
            next_line_idx += 1

        if len(amounts) < 2:
            skipped += 1
            i += 1
            continue

        # Smart amount extraction:
        # - Last amount is always the closing balance.
        # - Transaction amount is the first non-zero amount before the last.
        closing = _amt(amounts[-1])

        txn_amount = 0.0
        # Work backwards from balance-1 to find the first non-zero amount
        for amt_str in reversed(amounts[:-1]):
            candidate = _amt(amt_str)
            if candidate > 0:
                txn_amount = candidate
                break

        if txn_amount == 0:
            skipped += 1
            i += 1
            continue

        # Extract narration (everything before the first amount)
        first_amt_pos = rest.find(amounts[0])
        narration = rest[:first_amt_pos].strip() if first_amt_pos >= 0 else ""

        # Forward-only narration merging
        while i + 1 < len(all_lines):
            next_line = all_lines[i + 1].strip()

            if not next_line:
                break

            # STOP if new transaction
            if re.match(r"^\d{2}-\d{2}-\d{4}", next_line):
                break

            # STOP if amount present → new txn
            if re.search(r"\d{1,3}(,\d{3})*\.\d{2}", next_line):
                break

            # STOP unwanted lines
            if next_line.lower().startswith(("date", "opening", "closing", "statement", "page")):
                break

            narration += " " + next_line
            i += 1

        # Parse date
        try:
            date = _parse_canara_date(date_str)
        except ValueError:
            log.debug("    Line %d: date parse failed for '%s'", i, date_str)
            skipped += 1
            i += 1
            continue

        # Extract time if present
        txn_date_obj, txn_time_obj = extract_datetime_tuple(narration)
        txn_time = str(txn_time_obj) if txn_time_obj else ""

        # Determine debit/credit using get_type() from payee_extractor
        txn_type = get_type(narration)

        # Fallback to balance comparison when type is unknown
        if txn_type not in ["Credit", "Debit"]:
            if prev_balance is not None and closing != prev_balance:
                txn_type = "Debit" if closing < prev_balance else "Credit"
            else:
                # No balance info yet or no change — check if this looks like a credit
                # Common credit keywords in narration
                credit_keywords = ("SALARY", "INTEREST", "CASHBACK", "REFUND", "CREDIT", "REVERSAL")
                debit_keywords = ("UPI/DR", "NEFT DR", "IMPS DR", "CHARGE", "FEE", "TAX")
                norm = narration.upper()
                if any(k in norm for k in credit_keywords):
                    txn_type = "Credit"
                elif any(k in norm for k in debit_keywords):
                    txn_type = "Debit"
                else:
                    txn_type = "Debit"  # safest default when we truly can't tell

        # Update prev_balance: if we didn't have an opening balance, seed it from this txn
        if prev_balance is None:
            prev_balance = closing
        else:
            prev_balance = closing

        payee, category = extract_payee(narration)

        log.debug("    OK — %s | %s | %s ₹%.2f | bal ₹%.2f", date, payee, txn_type, txn_amount, closing)

        transactions.append({
            "Date": date,
            "Time": txn_time,
            "Payee": payee,
            "Category": category,
            "Type": txn_type,
            "Amount": txn_amount,
            "Balance": closing,
            "Bank": "Canara",
            "Narration": narration.strip(),
        })

        i += 1

    return transactions, skipped


def _process_row(date_str, particulars, deposits, withdrawals, balance):
    """Process a single table row. Returns transaction dict or None."""
    skip_reason = None
    if date_str.lower() in ("date", ""):
        skip_reason = "header or empty date"
    elif "opening" in date_str.lower() or "closing" in date_str.lower():
        skip_reason = "opening/closing balance"
    elif "balance" in particulars.lower() and not date_str:
        skip_reason = "balance summary"
    elif not date_str and re.match(r"Chq:\s*\d+", particulars, re.IGNORECASE):
        skip_reason = "Chq continuation row"
    elif not _is_canara_date(date_str):
        skip_reason = f"no valid date '{date_str}'"

    if skip_reason:
        log.debug("SKIPPED — %s | raw: [%s, %s]", skip_reason, date_str, particulars[:40])
        return None

    try:
        date = _parse_canara_date(date_str)
    except ValueError:
        return None

    if not particulars or re.match(r"Chq:\s*\d+", particulars, re.IGNORECASE):
        return None

    if withdrawals and withdrawals not in ("", "None", "0.00", "-"):
        txn_type = "Debit"
        amount = _amt(withdrawals)
    elif deposits and deposits not in ("", "None", "0.00", "-"):
        txn_type = "Credit"
        amount = _amt(deposits)
    else:
        return None

    if amount == 0:
        return None

    closing = _amt(balance) if balance and balance not in ("", "None") else None

    # Extract time
    txn_date_obj, txn_time_obj = extract_datetime_tuple(particulars)
    txn_time = str(txn_time_obj) if txn_time_obj else ""

    payee, category = extract_payee(particulars)

    return {
        "Date": date,
        "Time": txn_time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": closing,
        "Bank": "Canara",
        "Narration": particulars,
    }


def _is_canara_date(text: str) -> bool:
    """Check if text matches Canara date format: DD-MM-YYYY."""
    if not text:
        return False
    if not re.match(r"^\d{2}-\d{2}-\d{4}$", text.strip()):
        return False
    try:
        datetime.strptime(text.strip(), "%d-%m-%Y")
        return True
    except ValueError:
        return False


def _parse_canara_date(date_str: str) -> str:
    """Parse Canara date (DD-MM-YYYY) to YYYY-MM-DD."""
    date_str = date_str.strip()
    return datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")


def _amt(val: str) -> float:
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
