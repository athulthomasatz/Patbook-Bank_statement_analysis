import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple

log = logging.getLogger("pnb_parser")


def _amt(val: str) -> float:
    """Parse amount string to float, handling commas and empty values."""
    if not val:
        return 0.0
    val = str(val).replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _is_valid_date(date_str: str) -> bool:
    """Check if string matches DD/MM/YYYY format."""
    if not date_str:
        return False
    if not re.match(r'^\d{2}/\d{2}/\d{4}$', date_str.strip()):
        return False
    try:
        datetime.strptime(date_str.strip(), "%d/%m/%Y")
        return True
    except ValueError:
        return False


def _parse_date(date_str: str) -> str:
    """Parse PNB date (DD/MM/YYYY) to YYYY-MM-DD."""
    return datetime.strptime(date_str.strip(), "%d/%m/%Y").strftime("%Y-%m-%d")


def _extract_pnb_payee_category(remarks: str, txn_type: str) -> tuple[str, str]:
    """Extract payee and category specific to PNB Bank remark formats.

    Formats handled:
    - UPI/DR/<id>/<name>/<bank>/<vpa>/<flag>
    - UPI/CR/<id>/<name>/<bank>/<vpa>/<flag>
    - IMPS-IN/<ref>/<mobile>/<name>
    - IMPS-OUT/<ref>/<mobile>/<name>
    - NEFT-IN/... / NEFT-OUT/...
    - RTGS-IN/... / RTGS-OUT/...
    """
    if not remarks:
        return "Unknown", "Other"

    text = remarks.upper().strip()

    # --- UPI ---
    upi_match = re.match(
        r'UPI/(DR|CR)/(\d{12})/([^/]+)/([A-Z]{3,5})/([^/]+)/?(U|P)?',
        text
    )
    if upi_match:
        dr_cr = upi_match.group(1)
        payee_name = upi_match.group(3).strip()
        bank_code = upi_match.group(4).strip()
        vpa = upi_match.group(5).strip()

        # Clean truncated names (common in PNB)
        payee_name = _clean_truncated_name(payee_name)

        # Detect merchant/app from VPA
        category = _detect_upi_category(vpa, dr_cr)

        log.debug("    UPI payee: %s (bank: %s, vpa: %s)", payee_name, bank_code, vpa)
        return payee_name, category

    # --- IMPS ---
    imps_match = re.match(r'IMPS-(IN|OUT)/(\d{12})/(\d{10})/(.+)', text)
    if imps_match:
        direction = imps_match.group(1)
        sender_name = imps_match.group(4).strip()
        sender_name = _clean_truncated_name(sender_name)

        if direction == "IN":
            return sender_name, "IMPS Received"
        else:
            return sender_name, "IMPS Transfer"

    # --- NEFT ---
    if text.startswith("NEFT-"):
        neft_match = re.match(r'NEFT-(IN|OUT)/(.*)', text)
        if neft_match:
            direction = neft_match.group(1)
            rest = neft_match.group(2).strip()
            # Try to extract name from remaining text
            name = _extract_name_from_neft_rtgs(rest)
            if direction == "IN":
                return name, "NEFT Received"
            else:
                return name, "NEFT Transfer"
        return "NEFT Transaction", "NEFT"

    # --- RTGS ---
    if text.startswith("RTGS-"):
        rtgs_match = re.match(r'RTGS-(IN|OUT)/(.*)', text)
        if rtgs_match:
            direction = rtgs_match.group(1)
            rest = rtgs_match.group(2).strip()
            name = _extract_name_from_neft_rtgs(rest)
            if direction == "IN":
                return name, "RTGS Received"
            else:
                return name, "RTGS Transfer"
        return "RTGS Transaction", "RTGS"

    # --- Cash Deposit / Withdrawal ---
    if "CASH DEPOSIT" in text or "CASH_DEPOSIT" in text:
        return "Cash Deposit", "Cash"
    if "CASH WITHDRAWAL" in text or "CASH_WITHDRAWAL" in text:
        return "Cash Withdrawal", "Cash"

    # --- Interest ---
    if "INTEREST" in text:
        return "Interest Credit", "Interest"

    # --- Charges / Fees ---
    if any(k in text for k in ("CHARGE", "FEE", "GST", "TAX", "COMMISSION")):
        return "Bank Charges", "Charges"

    # Fallback to generic extractor
    return extract_payee(remarks)


def _clean_truncated_name(name: str) -> str:
    """Clean up truncated names from PNB remarks."""
    name = name.strip()
    # Remove trailing single letters that are likely truncation artifacts
    name = re.sub(r'\s+[A-Z]$', '', name)
    # Title case
    return name.title() if name else "Unknown"


def _detect_upi_category(vpa: str, dr_cr: str) -> str:
    """Detect category from UPI VPA handle."""
    vpa_lower = vpa.lower()

    if dr_cr == "CR":
        return "UPI Received"

    # Merchant/app detection
    if any(x in vpa_lower for x in ("paytm", "@p")):
        return "UPI Paytm"
    if "amazon" in vpa_lower or "amzn" in vpa_lower:
        return "UPI Amazon Pay"
    if "phonepe" in vpa_lower or "@ybl" in vpa_lower:
        return "UPI PhonePe"
    if "googlepay" in vpa_lower or "@ok" in vpa_lower:
        return "UPI Google Pay"
    if "bharatpe" in vpa_lower or "vyapar" in vpa_lower:
        return "UPI BharatPe"
    if "@axis" in vpa_lower or "@pthd" in vpa_lower:
        return "UPI Payment"
    if "@icici" in vpa_lower:
        return "UPI Payment"
    if "@sbi" in vpa_lower:
        return "UPI Payment"

    return "UPI Payment"


def _extract_name_from_neft_rtgs(text: str) -> str:
    """Extract beneficiary name from NEFT/RTGS remark remainder."""
    if not text:
        return "Unknown"
    # Remove reference numbers (long digit sequences)
    cleaned = re.sub(r'/\d{6,}/?', ' ', text)
    cleaned = re.sub(r'\d{6,}', ' ', cleaned)
    cleaned = cleaned.strip()
    # Take first meaningful segment
    parts = [p.strip() for p in cleaned.split('/') if p.strip() and not p.strip().isdigit()]
    if parts:
        name = parts[0]
        # Limit length
        if len(name) > 40:
            name = name[:40]
        return _clean_truncated_name(name)
    return "Unknown"


def parse(pdf) -> pd.DataFrame:
    """Parse Punjab National Bank (PNB) statement PDF.

    Expected table columns:
    Date | Instrument ID | Amount (INR) | Type (DR/CR) | Balance | Remarks
    """
    transactions = []
    skipped = 0

    log.info("PNB Parser: Starting — %d page(s)", len(pdf.pages))

    # Collect all rows from all pages
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    log.info("Table extraction: %d total rows", len(all_rows))

    # Process rows with multi-line narration handling
    running_remarks = ""
    running_row_data = None

    for row in all_rows:
        if not row or len(row) < 6:
            skipped += 1
            continue

        date_str = str(row[0] or "").strip()
        instrument_id = str(row[1] or "").strip() if len(row) > 1 else ""
        amount_str = str(row[2] or "").strip() if len(row) > 2 else ""
        txn_type_code = str(row[3] or "").strip() if len(row) > 3 else ""
        balance_str = str(row[4] or "").strip() if len(row) > 4 else ""
        remarks = str(row[5] or "").strip() if len(row) > 5 else ""

        # Skip header rows
        if date_str.upper() in ("DATE", "") and not remarks:
            skipped += 1
            continue

        # Skip opening/closing balance rows
        if "OPENING BALANCE" in remarks.upper() or "OPENING BALANCE" in date_str.upper():
            skipped += 1
            continue
        if "CLOSING BALANCE" in remarks.upper() or "CLOSING BALANCE" in date_str.upper():
            skipped += 1
            continue

        # Check if this is a continuation row (no valid date but has remarks)
        if not _is_valid_date(date_str):
            if remarks and running_row_data:
                running_remarks += " " + remarks
                running_row_data["remarks"] = running_remarks
                log.debug("    Continuation: %s", remarks[:60])
            continue

        # If we have a pending transaction, process it before starting new one
        if running_row_data:
            txn = _process_row_data(running_row_data)
            if txn:
                transactions.append(txn)
            else:
                skipped += 1

        # Start new transaction
        running_remarks = remarks
        running_row_data = {
            "date": date_str,
            "instrument_id": instrument_id,
            "amount": amount_str,
            "txn_type_code": txn_type_code,
            "balance": balance_str,
            "remarks": remarks,
        }

    # Don't forget the last transaction
    if running_row_data:
        txn = _process_row_data(running_row_data)
        if txn:
            transactions.append(txn)
        else:
            skipped += 1

    log.info("PNB Parser: Done — %d transactions, %d skipped", len(transactions), skipped)

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


def _process_row_data(data: dict) -> dict | None:
    """Process row data into a transaction dict."""
    date_str = data["date"]
    amount_str = data["amount"]
    txn_type_code = data["txn_type_code"]
    balance_str = data["balance"]
    remarks = data["remarks"]
    instrument_id = data.get("instrument_id", "")

    # Validate date
    if not _is_valid_date(date_str):
        return None

    try:
        date = _parse_date(date_str)
    except ValueError:
        log.warning("  Invalid date format: %s", date_str)
        return None

    # Parse amount
    amount = _amt(amount_str)
    if amount == 0:
        log.debug("  No amount found for date %s, skipping", date_str)
        return None

    # Determine type from DR/CR column
    txn_type = ""
    if txn_type_code.upper() == "DR":
        txn_type = "Debit"
    elif txn_type_code.upper() == "CR":
        txn_type = "Credit"
    else:
        log.debug("  Unknown type code '%s' for date %s, skipping", txn_type_code, date_str)
        return None

    # Parse balance
    balance_amt = _amt(balance_str)

    # Extract payee and category using PNB-specific extraction
    payee, category = _extract_pnb_payee_category(remarks, txn_type)

    # If generic extractor returned Unknown or plain Cheque, try to use instrument_id for cheques
    if instrument_id and re.match(r'^\d+$', instrument_id):
        if payee in ("Unknown", "Cheque") or "CHEQUE" in remarks.upper():
            payee = f"Cheque {instrument_id}"
            category = "Cheque"

    # Extract time from remarks if available
    _, time_obj = extract_datetime_tuple(remarks)
    time = str(time_obj) if time_obj else ""

    log.debug("  OK: %s | %s | %s | Rs.%.2f | bal Rs.%.2f", date, payee, txn_type, amount, balance_amt)

    return {
        "Date": date,
        "Time": time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": balance_amt if balance_amt > 0 else None,
        "Bank": "PNB",
        "Narration": remarks,
    }
