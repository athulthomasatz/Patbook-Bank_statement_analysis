import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import (
    extract_payee as generic_extract_payee,
    normalize,
    extract_datetime_tuple,
    get_type,
    clean_name,
)

log = logging.getLogger("kotak_parser")


def _extract_payee(narration: str) -> tuple[str, str]:
    """Kotak-specific payee extraction.

    Kotak narration formats:
    - UPI/NAME/REFNO/UPI          → name is at index 1 (2nd segment)
    - CASHBACK EARNED             → "Cashback", category "Cashback"
    - Int.Pd.ACCNO:DD-MM-YYYY... → "Interest", category "Interest"
    - NEFT/...                    → generic fallback
    - IMPS/...                    → generic fallback
    """
    if not narration:
        return ("Unknown", "Other")

    text = normalize(narration)

    # --- CASHBACK EARNED ---
    if "CASHBACK" in text:
        return ("Cashback", "Cashback")

    # --- Interest / Service Tax (Int.Pd.) ---
    if "INT.PD" in text or "INT PD" in text:
        return ("Interest", "Interest")

    # --- UPI (Kotak format: UPI/NAME/REFNO/UPI) ---
    if "UPI/" in text:
        parts = [p.strip() for p in text.split("/")]
        # Kotak: parts[0]="UPI", parts[1]="NAME", parts[2]="REFNO", parts[3]="UPI"
        if len(parts) >= 2 and parts[1]:
            name = clean_name(parts[1])
            if name and name != "Unknown" and not name.isdigit():
                # Detect type from narration to set category
                if "UPI/CR" in text:
                    return (name, "UPI")
                return (name, "UPI")
        # Fallback to generic UPI extractor
        return generic_extract_payee(narration)

    # --- NEFT / IMPS / ATM / other — delegate to generic extractor ---
    return generic_extract_payee(narration)


def parse(pdf) -> pd.DataFrame:
    """Parse Kotak Bank statement PDF. Tries table extraction first,
    then falls back to text-based line parsing."""
    transactions = []
    skipped = 0

    log.info("Kotak Parser: Starting — %d page(s)", len(pdf.pages))

    # --- Strategy 1: Table extraction ---
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    data_rows = [r for r in all_rows if r and len(r) >= 5
                 and str(r[0] or "").strip().lower() not in ("date", "#", "")
                 and not re.match(r"^\d+$", str(r[0] or "").strip() or "x")]
    log.info("Table extraction: %d total rows, %d potential data rows", len(all_rows), len(data_rows))

    if len(data_rows) > 1:
        log.info("Using table-based parsing")
        transactions, skipped = _parse_from_tables(pdf)
    else:
        log.info("Too few data rows from tables — using text-based parsing")
        transactions, skipped = _parse_from_text(pdf)

    log.info("Kotak Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

    df = pd.DataFrame(transactions)
    if not df.empty:
        df["Time"] = df["Time"].replace("", "00:00:00").fillna("00:00:00")

        df["DateTime"] = pd.to_datetime(
            df["Date"] + " " + df["Time"],
            format="%Y-%m-%d %H:%M:%S",
            errors="coerce"
        )
        df = df.sort_values("DateTime").reset_index(drop=True).drop(columns=["DateTime"])

        if "Time" in df.columns:
            df = df.drop(columns=["Time"])

    return df


def _parse_from_tables(pdf) -> tuple[list, int]:
    """Parse using pdfplumber table extraction.

    Kotak table columns:
    # | Date | Description | Chq/Ref. No. | Withdrawal (Dr.) | Deposit (Cr.) | Balance
    """
    transactions = []
    skipped = 0

    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table_idx, table in enumerate(tables):
            for row_idx, row in enumerate(table):
                if not row or len(row) < 5:
                    skipped += 1
                    continue

                # Kotak has 7 columns: #, Date, Description, Chq/Ref, Withdrawal, Deposit, Balance
                # Some table extractions may miss the # column, so detect by checking
                # if first field looks like a date
                if len(row) >= 7:
                    # Full row with all 7 columns
                    serial = str(row[0] or "").strip()
                    date_str = str(row[1] or "").strip()
                    description = str(row[2] or "").strip()
                    ref_no = str(row[3] or "").strip()
                    withdrawal = str(row[4] or "").strip()
                    deposit = str(row[5] or "").strip()
                    balance = str(row[6] or "").strip()
                elif len(row) >= 6:
                    # Might be missing # column — check if row[0] is a date
                    first = str(row[0] or "").strip()
                    if _is_kotak_date(first):
                        date_str = first
                        description = str(row[1] or "").strip()
                        ref_no = str(row[2] or "").strip()
                        withdrawal = str(row[3] or "").strip()
                        deposit = str(row[4] or "").strip()
                        balance = str(row[5] or "").strip()
                    else:
                        # row[0] is serial #, shift everything
                        date_str = str(row[1] or "").strip()
                        description = str(row[2] or "").strip()
                        ref_no = str(row[3] or "").strip()
                        withdrawal = str(row[4] or "").strip()
                        deposit = str(row[5] or "").strip()
                        balance = ""
                else:
                    # 5 columns — probably Date, Description, Withdrawal, Deposit, Balance
                    date_str = str(row[0] or "").strip()
                    description = str(row[1] or "").strip()
                    withdrawal = str(row[2] or "").strip()
                    deposit = str(row[3] or "").strip()
                    balance = str(row[4] or "").strip()
                    ref_no = ""

                result = _process_row(date_str, description, withdrawal, deposit, balance)
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
    # Kotak date format: DD Month YYYY (e.g., 07 May 2025)
    date_re = re.compile(r"^(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\b\s*(.*)")

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
        ob = re.search(
            r"(?:Opening|opening|OPENING)\s*[Bb]alance\s*[:\-]?\s*([\d,]+\.\d{2})",
            line,
        )
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

        # Skip header lines
        if line.lower().startswith(("date", "#", "opening", "closing", "statement", "page", "savings")):
            i += 1
            continue

        date_match = date_re.match(line)
        if not date_match:
            i += 1
            continue

        date_str = date_match.group(1)
        rest = date_match.group(2).strip()

        # Extract amounts from the rest of the line
        amounts = amount_re.findall(rest)

        # Handle multiline — amounts might be on the next line
        if len(amounts) < 2:
            if i + 1 < len(all_lines):
                next_line = all_lines[i + 1]
                amounts.extend(amount_re.findall(next_line))

            if len(amounts) < 2:
                skipped += 1
                i += 1
                continue

        # Last amount is balance, second-to-last is the transaction amount
        closing = _amt(amounts[-1])
        txn_amount = _amt(amounts[-2])

        if txn_amount == 0:
            skipped += 1
            i += 1
            continue

        # Extract narration (everything before the first amount)
        first_amt_pos = rest.find(amounts[0])
        narration = rest[:first_amt_pos].strip() if first_amt_pos > 0 else rest.strip()

        # Merge continuation lines into narration
        while i + 1 < len(all_lines):
            next_line = all_lines[i + 1].strip()
            if not next_line:
                break
            if date_re.match(next_line):
                break
            if re.search(r"\d{1,3}(,\d{3})*\.\d{2}", next_line):
                break
            if next_line.lower().startswith(("date", "opening", "closing", "statement", "page", "#")):
                break
            narration += " " + next_line
            i += 1

        # Parse date: DD Month YYYY -> YYYY-MM-DD
        try:
            date = datetime.strptime(date_str, "%d %b %Y").strftime("%Y-%m-%d")
        except ValueError:
            # Try full month name (e.g., "07 May 2025" works with %b, but "07 May" might need %B)
            try:
                date = datetime.strptime(date_str, "%d %B %Y").strftime("%Y-%m-%d")
            except ValueError:
                log.debug("    Line %d: date parse failed for '%s'", i, date_str)
                skipped += 1
                i += 1
                continue

        # Extract time if present in narration
        txn_date_obj, txn_time_obj = extract_datetime_tuple(narration)
        txn_time = str(txn_time_obj) if txn_time_obj else ""

        # Determine type: check narration first, fallback to balance comparison
        txn_type = get_type(narration)
        if txn_type not in ["Credit", "Debit"]:
            txn_type = "Debit" if closing < prev_balance else "Credit"

        prev_balance = closing

        payee, category = _extract_payee(narration)

        transactions.append({
            "Date": date,
            "Time": txn_time,
            "Payee": payee,
            "Category": category,
            "Type": txn_type,
            "Amount": txn_amount,
            "Balance": closing,
            "Bank": "Kotak",
            "Narration": narration.strip(),
        })

        i += 1

    return transactions, skipped


def _process_row(date_str, description, withdrawal, deposit, balance):
    """Process a single table row. Returns transaction dict or None."""
    # Skip headers and empty rows
    if date_str.lower() in ("date", "", "#"):
        return None

    # Skip serial number rows (just a number)
    if re.match(r"^\d+$", date_str.strip()):
        return None

    # Skip opening/closing balance rows
    if "opening" in date_str.lower() or "closing" in date_str.lower():
        return None
    if "opening" in description.lower() or "closing" in description.lower():
        return None

    # Validate date format — Kotak uses DD Month YYYY
    if not _is_kotak_date(date_str):
        log.debug("SKIPPED — no valid date '%s'", date_str)
        return None

    # Parse date
    try:
        date = _parse_kotak_date(date_str)
    except ValueError:
        log.debug("SKIPPED — date parse failed for '%s'", date_str)
        return None

    if not description:
        return None

    # Determine type and amount from withdrawal/deposit columns
    if withdrawal and withdrawal not in ("", "None", "0.00", "-", "—"):
        txn_type = "Debit"
        amount = _amt(withdrawal)
    elif deposit and deposit not in ("", "None", "0.00", "-", "—"):
        txn_type = "Credit"
        amount = _amt(deposit)
    else:
        return None

    if amount == 0:
        return None

    closing = _amt(balance) if balance and balance not in ("", "None", "-") else None

    # Extract time from narration
    txn_date_obj, txn_time_obj = extract_datetime_tuple(description)
    txn_time = str(txn_time_obj) if txn_time_obj else ""

    payee, category = _extract_payee(description)

    return {
        "Date": date,
        "Time": txn_time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": closing,
        "Bank": "Kotak",
        "Narration": description,
    }


def _is_kotak_date(text: str) -> bool:
    """Check if text matches Kotak date format: DD Month YYYY."""
    return bool(re.match(r"^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}$", text.strip()))


def _parse_kotak_date(date_str: str) -> str:
    """Parse Kotak date (DD Month YYYY) to YYYY-MM-DD."""
    date_str = date_str.strip()
    try:
        return datetime.strptime(date_str, "%d %b %Y").strftime("%Y-%m-%d")
    except ValueError:
        return datetime.strptime(date_str, "%d %B %Y").strftime("%Y-%m-%d")


def _amt(val: str) -> float:
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
