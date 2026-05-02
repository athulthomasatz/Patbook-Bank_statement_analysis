import logging
import re
from datetime import datetime

import pdfplumber
import pandas as pd

from utils.payee_extractor import extract_payee, normalize, extract_datetime_tuple, get_type

log = logging.getLogger("federal_parser")


def _extract_federal_payee_category(narration: str, tran_type: str) -> tuple[str, str]:
    """Extract payee and category specific to Federal Bank formats.

    UPI Format: UPIOUT/<id>/<vpa>/... -> extract VPA as payee
    IFN Format: IFN/<id> <description> -> extract category from description
    """
    narration_upper = narration.upper()

    # Handle UPI transactions - format: UPIOUT/<id>/<vpa>/...
    if "UPIOUT" in narration_upper or "UPI IN" in narration_upper:
        # Try to extract VPA (Virtual Payment Address)
        # Pattern: UPIOUT/123456789012/user@bank/...
        parts = narration.split("/")
        if len(parts) >= 3:
            # The VPA is typically the 3rd part (index 2)
            vpa = parts[2].strip()
            if vpa:
                # Clean up VPA - remove any trailing non-alphanumeric chars
                vpa = re.sub(r'[^a-zA-Z0-9@._-]', '', vpa)
                log.debug(f"    Extracted UPI VPA: {vpa}")
                # For UPI, category is handled by generic extractor
                # But let's try to get a cleaner payee from VPA
                # Extract just the username part before @
                if '@' in vpa:
                    username = vpa.split('@')[0]
                    return username, "UPI Payment"
                return vpa, "UPI Payment"

    # Handle IFN transactions - format: IFN/<id> <description> or <description> IFN/<id>
    if tran_type == "IFN" or "IFN/" in narration_upper:
        payee = "Federal Bank Wallet"
        category = "Internal Transfer"

        # Extract category from description patterns
        # Pattern: "Withdraw from Food max 5000"
        food_match = re.search(r'FOOD|max\s*\d+\s*P|MO', narration_upper)
        if food_match:
            category = "Food"

        # Pattern: "Withdraw from Outing max 7000", "Withdraw from Fuel max 5000"
        fuel_match = re.search(r'FUEL|FUE|OUTING|FU', narration_upper)
        if fuel_match and not food_match:
            category = "Fuel"

        # Pattern: "Withdraw from Shopping max 5000"
        shopping_match = re.search(r'SHOPPING|SHOP', narration_upper)
        if shopping_match:
            category = "Shopping"

        # Pattern: "Withdraw from Medical max 5000"
        medical_match = re.search(r'MEDICAL|MED', narration_upper)
        if medical_match:
            category = "Medical"

        # Pattern: "Withdraw from Transfer max 5000"
        transfer_match = re.search(r'TRANSFER|TF', narration_upper)
        if transfer_match:
            category = "Transfer"

        log.debug(f"    IFN transaction - Category: {category}")
        return payee, category

    # Handle IMPS transactions
    if "IMPS" in narration_upper:
        # Try to extract recipient name
        # Pattern: FT IMPS/IFI/<id>/-NAME/IMPS
        imps_match = re.search(r'IMPS/[^/]+/[^/]+/-([^/]+)/', narration_upper)
        if imps_match:
            recipient = imps_match.group(1).strip()
            log.debug(f"    Extracted IMPS recipient: {recipient}")
            return recipient, "Transfer"

    # Fall back to generic extractor
    return None, None


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
    pattern = r'^\d{2}/\d{2}/\d{4}$'
    if not re.match(pattern, date_str.strip()):
        return False
    try:
        datetime.strptime(date_str.strip(), "%d/%m/%Y")
        return True
    except ValueError:
        return False


def parse(pdf) -> pd.DataFrame:
    """Parse Federal Bank statement PDF. Uses table extraction with multi-line narration handling."""
    transactions = []
    skipped = 0

    log.info("Federal Bank Parser: Starting — %d page(s)", len(pdf.pages))

    # Collect all rows from all pages
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    log.info("Table extraction: %d total rows", len(all_rows))

    # Process rows with multi-line narration handling
    running_narration = ""
    running_row_data = None

    for row in all_rows:
        if not row or len(row) < 9:
            skipped += 1
            continue

        date_str = str(row[0] or "").strip()
        value_date_str = str(row[1] or "").strip() if len(row) > 1 else ""
        particulars = str(row[2] or "").strip() if len(row) > 2 else ""
        tran_type = str(row[3] or "").strip() if len(row) > 3 else ""
        tran_id = str(row[4] or "").strip() if len(row) > 4 else ""
        withdrawal = str(row[6] or "").strip() if len(row) > 6 else ""
        deposits = str(row[7] or "").strip() if len(row) > 7 else ""
        balance = str(row[8] or "").strip() if len(row) > 8 else ""
        dr_cr = str(row[9] or "").strip() if len(row) > 9 else ""

        # Skip header rows (check if first cell contains "DATE" or is empty)
        if date_str.upper() in ("DATE", ""):
            skipped += 1
            continue

        # Skip opening balance rows - "Opening Balance" appears in Particulars column
        if "OPENING BALANCE" in particulars.upper():
            skipped += 1
            log.debug(f"  Skipped opening balance row: {particulars}")
            continue

        # Skip closing balance rows
        if "CLOSING BALANCE" in particulars.upper():
            skipped += 1
            log.debug(f"  Skipped closing balance row: {particulars}")
            continue

        # Check if this is a continuation row (no date but has particulars)
        if not _is_valid_date(date_str):
            if particulars and running_row_data:
                # This is a continuation line, append to running narration
                running_narration += " " + particulars
                running_row_data["narration"] = running_narration
                log.debug(f"    Continuation: {particulars[:60]}")
            continue

        # If we have a pending transaction, process it before starting new one
        if running_row_data:
            txn = _process_row_data(running_row_data)
            if txn:
                transactions.append(txn)
            else:
                skipped += 1

        # Start new transaction
        running_narration = particulars
        running_row_data = {
            "date": date_str,
            "narration": particulars,
            "tran_type": tran_type,
            "tran_id": tran_id,
            "withdrawal": withdrawal,
            "deposits": deposits,
            "balance": balance,
            "dr_cr": dr_cr,
        }

    # Don't forget the last transaction
    if running_row_data:
        txn = _process_row_data(running_row_data)
        if txn:
            transactions.append(txn)
        else:
            skipped += 1

    log.info("Federal Bank Parser: Done — %d transactions, %d skipped", len(transactions), skipped)

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


def _process_row_data(data: dict) -> dict | None:
    """Process row data into a transaction dict."""
    date_str = data["date"]
    narration = data["narration"]
    tran_type = data["tran_type"]
    tran_id = data["tran_id"]
    withdrawal = data["withdrawal"]
    deposits = data["deposits"]
    balance = data["balance"]
    dr_cr = data["dr_cr"]

    # Validate date
    if not _is_valid_date(date_str):
        return None

    # Parse date from DD/MM/YYYY to YYYY-MM-DD
    try:
        date_obj = datetime.strptime(date_str, "%d/%m/%Y")
        date = date_obj.strftime("%Y-%m-%d")
    except ValueError:
        log.warning(f"  Invalid date format: {date_str}")
        return None

    # Determine transaction type and amount from Withdrawal/Deposits columns
    amount = 0.0
    txn_type = ""

    withdrawal_amt = _amt(withdrawal)
    deposits_amt = _amt(deposits)

    if withdrawal_amt > 0:
        txn_type = "Debit"
        amount = withdrawal_amt
    elif deposits_amt > 0:
        txn_type = "Credit"
        amount = deposits_amt
    else:
        # No amount in either column - skip
        log.debug(f"  No amount found for date {date_str}, skipping")
        return None

    # Parse balance
    balance_amt = _amt(balance)

    # First try Federal Bank-specific extraction
    payee, category = _extract_federal_payee_category(narration, tran_type)

    # Fall back to generic extractor if not found
    if payee is None or category is None:
        payee, category = extract_payee(narration)

    # Extract time from narration if available
    _, time_obj = extract_datetime_tuple(narration)
    time = str(time_obj) if time_obj else ""

    log.debug(f"  OK: {date} | {payee[:20]} | {txn_type} | Rs.{amount:.2f} | bal Rs.{balance_amt:.2f}")

    return {
        "Date": date,
        "Time": time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": balance_amt if balance_amt > 0 else None,
        "Bank": "Federal Bank",
        "Narration": narration,
    }
