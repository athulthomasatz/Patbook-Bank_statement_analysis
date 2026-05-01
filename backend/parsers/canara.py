import logging
import re
from datetime import datetime

import pdfplumber
import pandas as pd

from utils.payee_extractor import extract_payee, normalize, extract_datetime

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

    if len(data_rows) > 1:
        log.info("Using table-based parsing")
        transactions, skipped = _parse_from_tables(pdf)
    else:
        log.info("Too few data rows from tables — using text-based parsing")
        transactions, skipped = _parse_from_text(pdf)

    log.info("Canara Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

    df = pd.DataFrame(transactions)
    if not df.empty:
        # Add Time column if not present, then sort by DateTime
        if "Time" not in df.columns:
            df["Time"] = "00:00:00"
        df["DateTime"] = pd.to_datetime(df["Date"] + " " + df["Time"], errors="coerce")
        df = df.sort_values("DateTime").reset_index(drop=True).drop(columns=["DateTime"])
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
    """Parse using raw text extraction (fallback for borderless tables).
    Uses balance comparison to determine debit vs credit reliably."""
    transactions = []
    skipped = 0

    amount_re = re.compile(r"([\d,]+\.\d{2})")
    date_re = re.compile(r"^(\d{2}-\d{2}-\d{4})\s+(.*)")

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
    prev_balance = 0.0
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

        # Extract all amounts (X,XXX.XX) from the line
        amounts = amount_re.findall(rest)

        if len(amounts) < 2:
            log.debug("    Line %d: need >=2 amounts, got %d — '%s'", i, len(amounts), line[:80])
            skipped += 1
            i += 1
            continue

        # Last amount = closing balance, second-to-last = transaction amount
        closing = _amt(amounts[-1])
        txn_amount = _amt(amounts[-2])

        if txn_amount == 0:
            skipped += 1
            i += 1
            continue

        # Narration = everything before first amount in the line
        first_amt_pos = rest.find(amounts[0])
        narration = rest[:first_amt_pos].strip()

        # Collect continuation lines — but STOP if it looks like a new transaction
        while i + 1 < len(all_lines):
            next_line = all_lines[i + 1].strip()
            if not next_line or date_re.match(next_line):
                break
            if next_line.lower().startswith(("date", "opening", "closing", "statement", "generated", "page")):
                break
            # Stop if this looks like a new transaction (starts with transaction type keywords)
            if re.match(r"(UPI|NEFT|IMPS|ATM|Chq:)\s*[/\-:]", next_line, re.IGNORECASE):
                break
            if re.match(r"Chq:\s*\d+", next_line, re.IGNORECASE):
                i += 1
                continue  # skip Chq continuation lines
            narration += " " + next_line
            i += 1

        # Parse date
        try:
            date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
        except ValueError:
            log.debug("    Line %d: date parse failed for '%s'", i, date_str)
            skipped += 1
            i += 1
            continue

        # Determine debit/credit — priority: UPI/DR > UPI/CR > ATM > balance comparison
        narration_upper = normalize(narration)
        if "UPI/DR" in narration_upper:
            txn_type = "Debit"
        elif "UPI/CR" in narration_upper:
            txn_type = "Credit"
        elif "ATM" in narration_upper:
            txn_type = "Debit"
        elif closing < prev_balance:
            txn_type = "Debit"
        elif closing > prev_balance:
            txn_type = "Credit"
        else:
            txn_type = "Credit"

        prev_balance = closing

        payee, category = extract_payee(narration)
        txn_time = extract_datetime(narration)

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
    elif not re.match(r"\d{2}-\d{2}-\d{4}", date_str):
        skip_reason = f"no valid date '{date_str}'"

    if skip_reason:
        log.debug("SKIPPED — %s | raw: [%s, %s]", skip_reason, date_str, particulars[:40])
        return None

    try:
        date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
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
    payee, category = extract_payee(particulars)
    txn_time = extract_datetime(particulars)

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


def _amt(val: str) -> float:
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
