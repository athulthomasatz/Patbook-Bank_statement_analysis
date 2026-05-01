import logging
import re
from datetime import datetime

import pdfplumber
import pandas as pd

from utils.payee_extractor import extract_payee

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
        df = df.sort_values("Date").reset_index(drop=True)
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

    # Pattern: DD-MM-YYYY at start of line, followed by narration and amounts
    date_pattern = re.compile(r"^(\d{2}-\d{2}-\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s*$")
    # More flexible: date + narration + optional deposit + optional withdrawal + balance
    # The amounts are at the end of the line, right-aligned in columns
    amount_pattern = re.compile(r"([\d,]+\.\d{2})")

    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            log.info("  Page %d: no text", page_idx + 1)
            continue

        lines = text.split("\n")
        log.info("  Page %d: %d text lines", page_idx + 1, len(lines))

        for line_idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue

            # Skip header lines
            if stripped.startswith("Date") or "Particulars" in stripped:
                continue

            # Try to match a transaction line (starts with a date)
            date_match = re.match(r"^(\d{2}-\d{2}-\d{4})\s+(.*)", stripped)
            if not date_match:
                log.debug("    Line %d: no date match — '%s'", line_idx, stripped[:80])
                skipped += 1
                continue

            date_str = date_match.group(1)
            rest = date_match.group(2).strip()

            # Extract all amounts from the line (right side)
            amounts = amount_pattern.findall(rest)

            # The narration is everything before the first amount
            if amounts:
                # Find where the first amount starts in the rest string
                first_amount_pos = rest.find(amounts[0])
                narration = rest[:first_amount_pos].strip()
            else:
                narration = rest
                amounts = []

            # Determine debit/credit based on number of amounts and positions
            # Canara format: Date | Particulars | Deposits | Withdrawals | Balance
            # So we expect 1-3 amounts: deposit/withdrawal + balance
            if len(amounts) == 3:
                # Deposits, Withdrawals, Balance — one of first two should be meaningful
                dep_val = _amt(amounts[0])
                wd_val = _amt(amounts[1])
                bal_val = _amt(amounts[2])
                if wd_val > 0:
                    txn_type = "Debit"
                    amount = wd_val
                else:
                    txn_type = "Credit"
                    amount = dep_val
                closing = bal_val
            elif len(amounts) == 2:
                # One of deposit/withdrawal + balance
                first_val = _amt(amounts[0])
                second_val = _amt(amounts[1])
                # The balance should be the larger context number, but we can't be sure
                # Heuristic: the last amount is the balance
                closing = second_val
                amount = first_val
                txn_type = "Credit"  # Default, will be refined
                # Check if narration or context suggests debit
                if "UPI/DR" in narration or "ATM" in narration.upper() or "WITHDRAWAL" in narration.upper():
                    txn_type = "Debit"
            elif len(amounts) == 1:
                amount = _amt(amounts[0])
                closing = None
                txn_type = "Credit"
                if "UPI/DR" in narration or "ATM" in narration.upper():
                    txn_type = "Debit"
            else:
                log.debug("    Line %d: no amounts found — '%s'", line_idx, stripped[:80])
                skipped += 1
                continue

            if amount == 0:
                skipped += 1
                continue

            # Parse date
            try:
                date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
            except ValueError:
                log.debug("    Line %d: date parse failed for '%s'", line_idx, date_str)
                skipped += 1
                continue

            # For UPI transactions, determine type from narration
            upi_match = re.match(r"UPI/(CR|DR)/", narration)
            if upi_match:
                txn_type = "Credit" if upi_match.group(1) == "CR" else "Debit"

            payee, category = extract_payee(narration)

            log.debug("    Line %d: OK — %s | %s | %s ₹%.2f", line_idx, date, payee, txn_type, amount)

            transactions.append({
                "Date": date,
                "Payee": payee,
                "Category": category,
                "Type": txn_type,
                "Amount": amount,
                "Balance": closing,
                "Bank": "Canara",
                "Narration": narration,
            })

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

    return {
        "Date": date,
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
