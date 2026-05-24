import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple

log = logging.getLogger("kgb_parser")

DATE_RE = re.compile(r"^(\d{2}-\d{2}-\d{4})\b")
AMOUNT_RE = re.compile(r"([\d,]+\.\d{2})")


def _dedupe_doubled_chars(text: str) -> str:
    """KGB PDFs sometimes emit every character twice (e.g. '1133--0055--22002266').
    This normalises such lines back to readable text ('13-05-2026')."""
    if not text:
        return text
    # Replace any pair of identical consecutive characters with a single one.
    # One pass is sufficient because KGB doubles EVERY character, so all pairs
    # are non-overlapping in the doubled text.
    return re.sub(r"(.)\1", lambda m: m.group(1), text)


def _amt(val: str) -> float:
    """Parse amount string to float, handling commas and empty values."""
    if not val:
        return 0.0
    val = str(val).replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def _is_kgb_date(text: str) -> bool:
    """Check if string matches DD-MM-YYYY format."""
    if not text:
        return False
    if not re.match(r"^\d{2}-\d{2}-\d{4}$", text.strip()):
        return False
    try:
        datetime.strptime(text.strip(), "%d-%m-%Y")
        return True
    except ValueError:
        return False


def _parse_kgb_date(date_str: str) -> str:
    """Convert DD-MM-YYYY to YYYY-MM-DD."""
    return datetime.strptime(date_str.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")


def _extract_kgb_payee_category(narration: str, txn_type: str) -> tuple[str, str]:
    """Extract payee and category specific to Kerala Gramin Bank narration formats.

    KGB formats:
    - UPI/REFNO/Dr/NAME/...          -> Debit, name after Dr
    - UPI/REFNO/Cr/NAME/...          -> Credit, name after Cr
    - Cr.for UTR:REFNO NAME          -> Credit, name after UTR reference
    - MOB/REFNO/NAME                 -> Mobile banking
    - Int.Pd:...                     -> Interest paid by bank
    """
    if not narration:
        return ("Unknown", "Other")

    text = narration.upper()

    # Interest
    if "INT.PD" in text or "INTEREST" in text:
        return ("Bank Interest", "Interest")

    # UPI with Dr or Cr
    upi_match = re.search(r'UPI/[^/]+/(DR|CR)/([^/]+)', narration, re.IGNORECASE)
    if upi_match:
        name = upi_match.group(2).strip()
        # Clean up name - remove trailing UPI handles like @ybl, @oksbi, @okici, @upi
        name = re.sub(r'[@\s]+(?:YBL|OKSBI|OKICI|UPI|OKHDFC|OKAXIS|OKICICI|SBIN|PNB|CNRB|YESB|KMB|IDB|UBIN|BKID|BARB|UTIB|RATN|IBKL|HDFC|ICIC|AXIS|IDFC|FED|KGB|KERALAGRAMIN)\b.*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\bU\b', '', name)
        name = name.strip()
        if name:
            cleaned = _clean_name(name)
            return (cleaned, "UPI")
        return ("UPI Transaction", "UPI")

    # Cr.for UTR / Cr.for NEFT / Cr.for RTGS / Cr.for IMPS
    if text.startswith("CR.FOR"):
        cr_for_match = re.search(r'Cr\.for\s+(?:UTR|NEFT|RTGS|IMPS)[:\s]*[A-Z]+\d+\s+(.+)', narration, re.IGNORECASE)
        if cr_for_match:
            name = cr_for_match.group(1).strip()
            if name:
                cleaned = _clean_name(name)
                return (cleaned, "NEFT/RTGS")
        return ("NEFT/RTGS Credit", "NEFT/RTGS")

    # MOB (Mobile Banking)
    mob_match = re.search(r'MOB/[^/]+/(.+)', narration, re.IGNORECASE)
    if mob_match:
        name = mob_match.group(1).strip()
        # Remove trailing UPI handles or status codes
        name = re.sub(r'[@\s]+(?:YBL|OKSBI|OKICI|UPI|OKHDFC|OKAXIS|OKICICI|SBIN|PNB|CNRB|YESB|KMB|IDB|UBIN|BKID|BARB|UTIB|RATN|IBKL|HDFC|ICIC|AXIS|IDFC|FED|KGB|KERALAGRAMIN)\b.*', '', name, flags=re.IGNORECASE)
        name = re.sub(r'\bU\b', '', name)
        name = name.strip()
        if name:
            cleaned = _clean_name(name)
            return (cleaned, "Mobile Banking")
        return ("Mobile Banking", "Mobile Banking")

    # Fallback to generic extractor
    payee, category = extract_payee(narration)
    return (payee, category)


def _clean_name(name: str) -> str:
    """Clean and title-case a name extracted from KGB narration."""
    # Remove special characters but keep spaces and basic letters
    name = re.sub(r'[^A-Za-z0-9\s]', '', name)
    # Collapse multiple spaces
    name = re.sub(r'\s+', ' ', name)
    name = name.strip()
    return name.title() if name else "Unknown"


def _detect_type_from_narration(narration: str) -> str | None:
    """Detect Debit/Credit from KGB narration text.

    Returns 'Debit', 'Credit', or None if ambiguous.
    """
    if not narration:
        return None

    text = narration.upper()

    # Cr.for at start is always Credit
    if text.startswith("CR.FOR"):
        return "Credit"

    # Interest paid is always Credit
    if "INT.PD" in text or "INTEREST" in text:
        return "Credit"

    # UPI with explicit Dr or Cr
    if re.search(r'UPI/[^/]+/DR/', text):
        return "Debit"
    if re.search(r'UPI/[^/]+/CR/', text):
        return "Credit"

    # MOB (Mobile Banking) — in KGB these are usually credits unless marked Dr
    if text.startswith("MOB/"):
        if "/DR/" in text:
            return "Debit"
        return "Credit"

    return None


# ---------------------------------------------------------------------------
# Public parse entry-point
# ---------------------------------------------------------------------------

def parse(pdf) -> pd.DataFrame:
    """Parse Kerala Gramin Bank statement PDF.

    Tries table extraction first, then falls back to text-based parsing
    for scanned/borderless PDFs.
    """
    transactions = []
    skipped = 0

    log.info("KGB Parser: Starting — %d page(s)", len(pdf.pages))

    # --- Strategy 1: Table extraction ---
    all_rows = []
    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                all_rows.append(row)

    data_rows = [r for r in all_rows if r and len(r) >= 4
                 and str(r[0] or "").strip().lower() != "date"
                 and str(r[0] or "").strip() != ""]
    log.info("Table extraction: %d total rows, %d potential data rows", len(all_rows), len(data_rows))

    # Use tables only if we have at least 3 data rows and 50% have valid dates
    dated_rows = [r for r in data_rows if _is_kgb_date(str(r[0] or "").strip())]
    use_tables = len(data_rows) >= 3 and len(dated_rows) >= len(data_rows) * 0.5

    if use_tables:
        log.info("Using table-based parsing (%d dated / %d total)", len(dated_rows), len(data_rows))
        transactions, skipped = _parse_from_tables(all_rows)
    else:
        log.info("Too few valid data rows from tables — using text-based parsing")
        transactions, skipped = _parse_from_text(pdf)

    log.info("KGB Parser: Done — %d transactions, %d skipped", len(transactions), skipped)

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


# ---------------------------------------------------------------------------
# Table-based parsing
# ---------------------------------------------------------------------------

def _parse_from_tables(all_rows) -> tuple[list, int]:
    """Parse using pdfplumber table extraction."""
    transactions = []
    skipped = 0
    running_row_data = None
    running_narration = ""

    for row in all_rows:
        if not row or len(row) < 4:
            skipped += 1
            continue

        date_str = _dedupe_doubled_chars(str(row[0] or "").strip())
        particulars = _dedupe_doubled_chars(str(row[1] or "").strip()) if len(row) > 1 else ""

        if len(row) >= 5:
            debit_str = _dedupe_doubled_chars(str(row[2] or "").strip())
            credit_str = _dedupe_doubled_chars(str(row[3] or "").strip())
            balance_str = _dedupe_doubled_chars(str(row[4] or "").strip())
            amount_str = debit_str if debit_str else credit_str
            has_separate_cols = True
        else:
            amount_str = _dedupe_doubled_chars(str(row[2] or "").strip()) if len(row) > 2 else ""
            balance_str = _dedupe_doubled_chars(str(row[3] or "").strip()) if len(row) > 3 else ""
            debit_str = ""
            credit_str = ""
            has_separate_cols = False

        if date_str.upper() in ("DATE", ""):
            skipped += 1
            continue
        if "OPENING BALANCE" in particulars.upper():
            skipped += 1
            continue
        if "CLOSING BALANCE" in particulars.upper():
            skipped += 1
            continue

        if not _is_kgb_date(date_str):
            if particulars and running_row_data:
                running_narration += " " + particulars
                running_row_data["narration"] = running_narration
                if amount_str:
                    running_row_data["amount"] += " " + amount_str
                if balance_str:
                    running_row_data["balance"] += " " + balance_str
                log.debug("    Continuation: %s", particulars[:60])
            continue

        if running_row_data:
            txn = _process_row_data(running_row_data)
            if txn:
                transactions.append(txn)
            else:
                skipped += 1

        running_narration = particulars
        running_row_data = {
            "date": date_str,
            "narration": particulars,
            "amount": amount_str,
            "debit": debit_str,
            "credit": credit_str,
            "balance": balance_str,
            "has_separate_cols": has_separate_cols,
        }

    if running_row_data:
        txn = _process_row_data(running_row_data)
        if txn:
            transactions.append(txn)
        else:
            skipped += 1

    return transactions, skipped


# ---------------------------------------------------------------------------
# Text-based parsing (fallback)
# ---------------------------------------------------------------------------

def _parse_from_text(pdf) -> tuple[list, int]:
    """Parse using raw text extraction (fallback for borderless/scanned tables)."""
    transactions = []
    skipped = 0

    # Collect all text lines across pages
    all_lines = []
    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            log.info("  Page %d: no text", page_idx + 1)
            continue
        lines = [_dedupe_doubled_chars(line) for line in text.split("\n")]
        log.info("  Page %d: %d text lines", page_idx + 1, len(lines))
        all_lines.extend(lines)

    # Try to find opening balance for direction inference
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

        # Skip headers and non-transaction lines
        if line.upper().startswith("DATE") or "PARTICULARS" in line.upper():
            i += 1
            continue
        if "opening balance" in line.lower():
            i += 1
            continue
        if "closing balance" in line.lower():
            i += 1
            continue

        # Match date at start of line
        date_match = DATE_RE.match(line)
        if not date_match:
            i += 1
            continue

        date_str = date_match.group(1)
        rest = line[date_match.end():].strip()

        # Extract amounts from current line
        amounts = AMOUNT_RE.findall(rest)

        # If we don't have enough amounts, try the next non-empty line
        next_line_idx = i + 1
        while len(amounts) < 2 and next_line_idx < len(all_lines):
            next_line = all_lines[next_line_idx].strip()
            if next_line:
                amounts.extend(AMOUNT_RE.findall(next_line))
                next_line_idx += 1
                break
            next_line_idx += 1

        if len(amounts) < 2:
            skipped += 1
            i += 1
            continue

        # Last amount is always the closing balance
        closing = _amt(amounts[-1])

        # Transaction amount is the first non-zero amount before the last
        txn_amount = 0.0
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
        narration = rest[:first_amt_pos].strip() if first_amt_pos >= 0 else rest

        # Merge continuation lines (forward only)
        while i + 1 < len(all_lines):
            next_line = all_lines[i + 1].strip()
            if not next_line:
                break
            if DATE_RE.match(next_line):
                break
            if AMOUNT_RE.search(next_line):
                break
            if next_line.lower().startswith(("date", "opening", "closing", "statement", "page")):
                break
            narration += " " + next_line
            i += 1

        # Parse date
        try:
            date = _parse_kgb_date(date_str)
        except ValueError:
            log.debug("    Line %d: date parse failed for '%s'", i, date_str)
            skipped += 1
            i += 1
            continue

        # Determine Debit/Credit
        txn_type = _detect_type_from_narration(narration)

        if txn_type not in ("Debit", "Credit"):
            # Fallback: use balance comparison
            if prev_balance is not None and closing != prev_balance:
                txn_type = "Debit" if closing < prev_balance else "Credit"
            else:
                # Keyword fallback
                norm = narration.upper()
                credit_keywords = ("SALARY", "CASHBACK", "REFUND", "REVERSAL", "CREDIT")
                debit_keywords = ("CHARGE", "FEE", "TAX", "COMMISSION")
                if any(k in norm for k in credit_keywords):
                    txn_type = "Credit"
                elif any(k in norm for k in debit_keywords):
                    txn_type = "Debit"
                else:
                    txn_type = "Debit"  # safest default

        # Update running balance
        if prev_balance is None:
            prev_balance = closing
        else:
            prev_balance = closing

        # Extract time if present
        _, time_obj = extract_datetime_tuple(narration)
        time = str(time_obj) if time_obj else ""

        # KGB-specific payee/category
        payee, category = _extract_kgb_payee_category(narration, txn_type)

        log.debug(
            "    OK — %s | %s | %s | Rs.%.2f | bal Rs.%.2f",
            date, payee[:20], txn_type, txn_amount, closing
        )

        transactions.append({
            "Date": date,
            "Time": time,
            "Payee": payee,
            "Category": category,
            "Type": txn_type,
            "Amount": txn_amount,
            "Balance": closing,
            "Bank": "Kerala Gramin Bank",
            "Narration": narration.strip(),
        })

        i += 1

    return transactions, skipped


# ---------------------------------------------------------------------------
# Row processing (shared by both strategies)
# ---------------------------------------------------------------------------

def _process_row_data(data: dict) -> dict | None:
    """Process accumulated row data into a transaction dict."""
    date_str = data["date"]
    narration = data["narration"]
    amount_str = data["amount"]
    debit_str = data["debit"]
    credit_str = data["credit"]
    balance_str = data["balance"]
    has_separate_cols = data["has_separate_cols"]

    if not _is_kgb_date(date_str):
        return None

    try:
        date = _parse_kgb_date(date_str)
    except ValueError:
        log.debug("  Invalid date format: %s", date_str)
        return None

    amount = 0.0
    txn_type = ""

    if has_separate_cols:
        debit_amt = _amt(debit_str)
        credit_amt = _amt(credit_str)
        if debit_amt > 0:
            txn_type = "Debit"
            amount = debit_amt
        elif credit_amt > 0:
            txn_type = "Credit"
            amount = credit_amt
    else:
        amount = _amt(amount_str)
        if amount > 0:
            detected = _detect_type_from_narration(narration)
            txn_type = detected if detected else "Unknown"
        else:
            return None

    if amount == 0:
        return None

    if txn_type == "Unknown":
        detected = _detect_type_from_narration(narration)
        if detected:
            txn_type = detected
        else:
            log.warning("  Could not determine txn type for: %s", narration[:80])
            txn_type = "Debit"

    balance = _amt(balance_str)

    _, time_obj = extract_datetime_tuple(narration)
    time = str(time_obj) if time_obj else ""

    payee, category = _extract_kgb_payee_category(narration, txn_type)

    log.debug(
        "  OK: %s | %s | %s | Rs.%.2f | bal Rs.%.2f",
        date, payee[:20], txn_type, amount, balance
    )

    return {
        "Date": date,
        "Time": time,
        "Payee": payee,
        "Category": category,
        "Type": txn_type,
        "Amount": amount,
        "Balance": balance if balance > 0 else None,
        "Bank": "Kerala Gramin Bank",
        "Narration": narration,
    }
