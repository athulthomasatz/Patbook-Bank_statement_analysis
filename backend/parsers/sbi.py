import logging
import re
from datetime import datetime

import pdfplumber
import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple, normalize, get_type

log = logging.getLogger("sbi_parser")

# SBI table header patterns
DATE_RE = re.compile(r'^(\d{2}/\d{2}/\d{4})$')
AMOUNT_RE = re.compile(r'([\d,]+\.\d{2})')


def parse(pdf) -> pd.DataFrame:
    """Parse SBI Bank statement PDF. Tries table extraction first,
    then falls back to text-based line parsing."""
    transactions = []
    skipped = 0

    log.info("SBI Parser: Starting — %d page(s)", len(pdf.pages))

    # --- Strategy 1: Table extraction ---
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    # Filter for data rows (have at least 4 columns, first column looks like date)
    data_rows = []
    for row in all_rows:
        if not row or len(row) < 4:
            continue
        # Check if first column looks like a date (DD/MM/YYYY)
        first_col = str(row[0] or "").strip()
        if DATE_RE.match(first_col):
            # Skip header rows
            if "value" in first_col.lower() or "date" in first_col.lower():
                continue
            data_rows.append(row)

    log.info("Table extraction: %d total rows, %d potential data rows", len(all_rows), len(data_rows))

    if len(data_rows) > 1:
        log.info("Using table-based parsing")
        transactions, skipped = _parse_from_tables(pdf, data_rows)
    else:
        log.info("Too few data rows from tables — using text-based parsing")
        transactions, skipped = _parse_from_text(pdf)

    log.info("SBI Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

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


def _parse_from_tables(pdf, data_rows) -> tuple[list, int]:
    """Parse using pdfplumber table extraction."""
    transactions = []
    skipped = 0

    for row in data_rows:
        if len(row) < 5:
            skipped += 1
            continue

        # SBI table structure: Value Date | Post Date | Details | Ref No | Debit | Credit | Balance
        # Sometimes columns might shift, so we need to be flexible
        date_str = str(row[0] or "").strip()
        post_date_str = str(row[1] or "").strip() if len(row) > 1 else ""
        details = str(row[2] or "").strip() if len(row) > 2 else ""
        ref_no = str(row[3] or "").strip() if len(row) > 3 else ""

        # Look for debit/credit/balance columns
        # They could be in columns 4, 5, 6 or different positions
        debit_col = ""
        credit_col = ""
        balance_col = ""

        # Try to find which columns have amounts
        for i in range(min(len(row), 7)):
            col_val = str(row[i] or "").strip()
            if AMOUNT_RE.match(col_val):
                # Last amount is usually balance
                if i == len(row) - 1 or i == 6:
                    balance_col = col_val
                # Check if it's debit or credit based on position
                elif not debit_col and not credit_col:
                    # First amount could be debit or credit
                    debit_col = col_val
                elif not credit_col:
                    credit_col = col_val

        # Alternative: if we have 7 columns, use fixed positions
        if len(row) >= 7:
            debit_col = str(row[4] or "").strip()
            credit_col = str(row[5] or "").strip()
            balance_col = str(row[6] or "").strip()

        result = _process_row(date_str, details, debit_col, credit_col, balance_col, ref_no)
        if result:
            transactions.append(result)
        else:
            skipped += 1

    return transactions, skipped


def _parse_from_text(pdf) -> tuple[list, int]:
    """Parse using raw text extraction (fallback for borderless tables)."""
    transactions = []
    skipped = 0

    # Collect all text across pages
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

        # Skip header and non-transaction lines
        if any(kw in line.lower() for kw in ["value date", "post date", "details", "ref no", "opening", "closing", "statement"]):
            i += 1
            continue

        # Match date at start of line
        date_match = DATE_RE.match(line)
        if not date_match:
            i += 1
            continue

        date_str = date_match.group(1)
        rest = line[date_str.end():].strip()

        # Extract amounts
        amounts = AMOUNT_RE.findall(rest)

        # Try next line if we don't have enough amounts
        if len(amounts) < 2:
            if i + 1 < len(all_lines):
                next_line = all_lines[i + 1]
                amounts.extend(AMOUNT_RE.findall(next_line))

        if len(amounts) < 2:
            skipped += 1
            i += 1
            continue

        # Last amount is balance, previous is transaction amount
        balance = _amt(amounts[-1])
        txn_amount = _amt(amounts[-2])

        if txn_amount == 0:
            skipped += 1
            i += 1
            continue

        # Extract narration (everything before first amount)
        first_amt_pos = rest.find(amounts[0])
        narration = rest[:first_amt_pos].strip()

        # Merge continuation lines
        while i + 1 < len(all_lines):
            next_line = all_lines[i + 1].strip()
            if not next_line:
                break
            if DATE_RE.match(next_line):
                break
            if any(kw in next_line.lower() for kw in ["value date", "opening", "closing", "statement"]):
                break
            narration += " " + next_line
            i += 1

        # Parse date
        try:
            date = datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
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

        # Fallback to balance comparison if unclear
        if txn_type not in ["Credit", "Debit"]:
            txn_type = "Debit" if balance < prev_balance else "Credit"

        prev_balance = balance

        payee, category = extract_payee(narration)

        log.debug("    OK — %s | %s | %s ₹%.2f | bal ₹%.2f", date, payee, txn_type, txn_amount, balance)

        transactions.append({
            "Date": date,
            "Time": txn_time,
            "Payee": payee,
            "Category": category,
            "Type": txn_type,
            "Amount": txn_amount,
            "Balance": balance,
            "Bank": "SBI",
            "Narration": narration.strip(),
        })

        i += 1

    return transactions, skipped


def _process_row(date_str, details, debit_col, credit_col, balance_col, ref_no="") -> dict:
    """Process a single table row. Returns transaction dict or None."""
    skip_reason = None

    # Skip header or empty rows
    if not date_str or date_str.lower() in ("date", "value date", ""):
        skip_reason = "header or empty date"
    elif not DATE_RE.match(date_str):
        skip_reason = f"no valid date '{date_str}'"
    elif "opening" in details.lower() or "closing" in details.lower():
        skip_reason = "opening/closing balance"
    elif not details or not details.strip():
        skip_reason = "empty details"

    if skip_reason:
        log.debug("SKIPPED — %s | raw: [%s, %s]", skip_reason, date_str, details[:40] if details else "")
        return None

    # Parse date
    try:
        date = datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
    except ValueError:
        log.debug("SKIPPED — date parse failed for '%s'", date_str)
        return None

    # Determine transaction type and amount
    txn_type = None
    amount = 0.0

    debit_amt = _amt(debit_col) if debit_col and debit_col not in ("", "-", "None") else 0.0
    credit_amt = _amt(credit_col) if credit_col and credit_col not in ("", "-", "None") else 0.0

    if debit_amt > 0:
        txn_type = "Debit"
        amount = debit_amt
    elif credit_amt > 0:
        txn_type = "Credit"
        amount = credit_amt
    else:
        # Fallback: try to determine from narration
        if details:
            txn_type = get_type(details)
            # If still unclear, check UPI format
            if "UPI/CR" in details:
                txn_type = "Credit"
            elif "UPI/DR" in details:
                txn_type = "Debit"
            else:
                txn_type = "Debit"  # Default
        else:
            skip_reason = "no amount found"
            log.debug("SKIPPED — %s | debit: %s, credit: %s", skip_reason, debit_col, credit_col)
            return None

    if amount == 0:
        skip_reason = "zero amount"
        log.debug("SKIPPED — %s", skip_reason)
        return None

    # Parse balance
    balance = _amt(balance_col) if balance_col and balance_col not in ("", "-", "None") else None

    # Extract time
    txn_date_obj, txn_time_obj = extract_datetime_tuple(details)
    txn_time = str(txn_time_obj) if txn_time_obj else ""

    # Extract payee and category
    payee, category = extract_payee(details)

    return {
        "Date": date,
        "Time": txn_time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": balance,
        "Bank": "SBI",
        "Narration": details,
    }


def _amt(val: str) -> float:
    """Convert string amount to float."""
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
