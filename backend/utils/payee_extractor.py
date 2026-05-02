import logging
import re
from datetime import datetime

log = logging.getLogger("payee_extractor")

NOISE = {
    "UPI", "CR", "DR", "PAID", "VIA", "TO", "FROM", "UPIINTENT",
    "IMPS", "NEFT", "REF", "ID", "UPIAR", "IMPSAB",
}

# Support both slash (DD/MM/YYYY) and hyphen (DD-MM-YYYY) date formats
DATE_TIME_REGEX = r'\d{2}[/\-]\d{2}[/\-]\d{2,4}\s+\d{2}:\d{2}:\d{2}'

STATE_CODES = {
    "MHIN", "KLIN", "TNIN", "KAIN", "DLHI", "UPIN", "HRIN", "PJIN",
    "RJIN", "GJIN", "MPIN", "CHIN", "JHIN", "ODIN", "WBIN", "ASIN",
    "BRIN", "SKIN", "TRIN", "UKIN", "TGIN", "APIN", "KAIF",
}

# Merchant name mappings (key -> (mapped_name, category))
MERCHANT_MAPPINGS = {
    "INDIAN": ("Zerodha", "MF Mutual Funds"),
}


# ---------- NORMALIZATION ----------

def normalize(text):
    """Normalize broken PDF text — join broken words, collapse whitespace."""
    text = text.upper()

    # Fix broken words like FLIPKAR\nT
    text = re.sub(r'-\s*\n\s*', '', text)
    text = re.sub(r'\s*\n\s*', ' ', text)

    # Join single-letter fragments at end of word (FLIPKAR T → FLIPKART)
    # SAFER: Only join if left side is 3+ chars and right side is exactly 1 letter
    # text = re.sub(r'([A-Z]{3,})\s+([A-Z])\b(?!\s*-\s*\d)(?!-\d)', r'\1\2', text)
    # FIX: join broken words (HOSTIN GER → HOSTINGER)
    text = re.sub(r'([A-Z]{3,})\s+([A-Z]{2,})', r'\1\2', text)

    # Normalize spaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


def normalize_text(text):
    """Alias for compatibility."""
    return normalize(text)


# ---------- TYPE DETECTION ----------

def get_type(text):
    if "UPI/CR" in text:
        return "Credit"
    if "UPI/DR" in text:
        return "Debit"
    if "ATM CASH" in text:
        return "Debit"
    return "Debit"


# ---------- CHANNEL ----------

def get_channel(text):
    if "UPI" in text:
        return "UPI"
    if "ATM CASH" in text:
        return "ATM"
    return "Merchant"


# ---------- PAYEE EXTRACTION ----------

def extract_payee(narration: str) -> tuple[str, str]:
    """Extract payee name and transaction category from narration.
    Returns (payee, category).
    """
    if not narration:
        log.debug("    extract_payee: EMPTY narration, returning Unknown/Other")
        return ("Unknown", "Other")

    text = normalize(narration)
    log.debug(f"    extract_payee input: {narration[:80]}{'...' if len(narration) > 80 else ''}")
    log.debug(f"    extract_payee normalized: {text[:80]}{'...' if len(text) > 80 else ''}")

    # Extract UPI portion if present (UPI/CR|DR/REFNO/NAME/BANK/...)
    # This handles cases where date/time is before the UPI string
    # Match from UPI to the end of the string (or next date pattern)
    upi_match = re.search(r'UPI\s*/\s*(?:CR|DR)\s*/.*$', text)
    if upi_match:
        # Use only the UPI portion for parsing
        text = upi_match.group(0)
        log.debug(f"    Extracted UPI portion: {text}")

    # ATM
    if "ATM CASH" in text:
        log.debug("    Path: ATM CASH")
        loc_match = re.search(r"ATM\s+CASH-[^-]+-(.+?)(?:-\d{2}/|$)", text)
        location = ""
        if loc_match:
            location = loc_match.group(1).strip()
            location = re.sub(r"\s*-\s*\d{2}/\d{2}/\d{2,4}.*", "", location)
            location = re.sub(r"\s*/\s*\d+$", "", location)
            location = re.sub(r"N-\d{2}/\d{2}/\d{2,4}.*", "", location)
            location = re.sub(r"\s+[A-Z]$", "", location)
            location = re.sub(r"\bH[KQ]Z\d+\b", "", location)
            city_match = re.search(r"([A-Z]{4,}(?:\s+[A-Z]+)*)", location)
            if city_match:
                location = city_match.group(1)
            location = clean_name(location)
        label = "ATM Withdrawal"
        if location and len(location) > 3:
            label += f" — {location}"
        return (label, "ATM")

    # UPIAR (Union Bank) - check before generic UPI
    if "UPIAR" in text:
        log.debug("    Path: UPIAR")
        return _extract_upiar(text)

    # UPI
    if "UPI" in text:
        log.debug("    Path: UPI")
        return _extract_upi(text)

    # NEFT
    if "NEFT" in text:
        log.debug("    Path: NEFT")
        return _extract_neft(text)

    # IMPS
    if "IMPS" in text:
        log.debug("    Path: IMPS")
        return _extract_imps(text)

    # Cheque
    if "CHQ:" in text:
        log.debug("    Path: Cheque")
        return ("Cheque", "Cheque")

    # Salary
    salary = re.search(r"A2AINT\d+-(.+?)-SALARY", text, re.IGNORECASE)
    if salary:
        name = clean_name(salary.group(1))
        log.debug(f"    Path: Salary → '{name}'")
        return (name, "Salary")

    # Interest
    if "INTEREST" in text:
        log.debug("    Path: Interest")
        if "CREDIT" in text or "CR" in text or "EARNED" in text:
            return ("Interest Credit", "Interest")
        return ("Interest", "Interest")

    # Charges
    if "CHARGE" in text or "FEE" in text or "GST" in text or "TAX" in text or "COMMISSION" in text:
        log.debug("    Path: Bank Charges")
        return ("Bank Charges", "Charges")

    # Merchant fallback
    log.debug("    Path: Merchant fallback")
    return _extract_merchant(text)


def _extract_upi(text):
    """
    Extract payee from UPI transaction text using POSITION-BASED logic.
    Standard UPI format: UPI/CR|DR/REFNO/NAME/BANK/UPI_ID/STATUS//TXN_ID/DATE TIME
    Index 3 = NAME field in most formats.
    """
    parts = [p.strip() for p in text.split("/") if p.strip()]
    log.debug(f"      _extract_upi parts ({len(parts)}): {parts[:6]}{'...' if len(parts) > 6 else ''}")

    # Try multiple possible positions
    possible_indexes = [3, 2, 4]

    for idx in possible_indexes:
        if len(parts) > idx:
            candidate = parts[idx]

            if candidate in NOISE:
                continue
            if candidate.isdigit():
                continue

            name = clean_name(candidate)

            if is_self_transfer(name):
                return (name + " (Self)", "Self Transfer")

            if "MANDATE" in name:
                clean = clean_name(name.replace("Mandate", "").strip())
                return (clean if clean else "Mandate", "Subscription")

            return (name, "UPI")

    return ("UPI Transaction", "UPI")


def _extract_upiar(text):
    log.debug(f"      _extract_upiar input: {text[:80]}{'...' if len(text) > 80 else ''}")

    # Check for "Indian C" mapping first (Union Bank specific)
    if "INDIAN C" in text.upper():
        name = "Zerodha"
        log.debug(f"      Found 'Indian C' mapping → '{name}'")
        return (name, "MF Mutual Funds")

    handle = re.search(r'@([A-Z0-9.-]+)', text, re.IGNORECASE)
    if handle:
        log.debug(f"      Found @ handle: {handle.group(1)}")
        at_pos = text.rfind('@')
        if at_pos > 0:
            before_at = text[:at_pos]
            match = re.search(r'([A-Z][A-Z0-9._%+-]*)$', before_at, re.IGNORECASE)
            if match:
                merchant = match.group(1)
                log.debug(f"      Extracted merchant before @: '{merchant}'")
                if not merchant.isdigit() and len(merchant) > 2:
                    name = clean_name(merchant)
                    # Apply merchant mapping if exists
                    mapped_name, mapped_category = MERCHANT_MAPPINGS.get(name.upper(), (name, "UPI"))
                    log.debug(f"      Using UPIAR merchant: '{mapped_name}'")
                    return (mapped_name, mapped_category)
                else:
                    log.debug(f"      Merchant skipped: is_digit={merchant.isdigit()}, len={len(merchant)}")
    else:
        log.debug("      No @ handle found")

    parts = re.split(r'[\s/-]+', text)
    log.debug(f"      UPIAR split parts: {parts[:5]}{'...' if len(parts) > 5 else ''}")
    for part in parts:
        if part in ("UPIAR", ""):
            continue
        if part.isdigit() and len(part) > 5:
            continue
        if "@" in part:
            merchant = part.split("@")[0]
            if merchant and len(merchant) > 2 and not merchant.isdigit():
                name = clean_name(merchant)
                mapped_name, mapped_category = MERCHANT_MAPPINGS.get(name.upper(), (name, "UPI"))
                log.debug(f"      Using @-split merchant: '{mapped_name}'")
                return (mapped_name, mapped_category)
        if part and len(part) > 2 and not part.isdigit():
            name = clean_name(part)
            mapped_name, mapped_category = MERCHANT_MAPPINGS.get(name.upper(), (name, "UPI"))
            log.debug(f"      Using UPIAR part: '{mapped_name}'")
            return (mapped_name, mapped_category)

    log.debug("      No valid UPIAR payee found")
    return ("UPI Transaction", "UPI")


def _extract_neft(text):
    log.debug(f"      _extract_neft input: {text[:80]}{'...' if len(text) > 80 else ''}")
    match = re.search(r'NEFT[\s/-]+(?:DR|CR)?[\s/-]*[A-Z]+\d+[\s/-]+(.+)$', text, re.IGNORECASE)
    if match:
        name = clean_name(match.group(1))
        log.debug(f"      Regex match: '{name}'")
        return (name, "NEFT")

    parts = re.split(r'[\s/-]+', text)
    log.debug(f"      NEFT split parts: {parts[:5]}{'...' if len(parts) > 5 else ''}")
    name_parts = []
    capturing = False
    for part in parts:
        if part.upper().startswith('NEFT'):
            continue
        if capturing:
            name_parts.append(part)
        elif re.match(r'^[A-Z]+\d+$', part, re.IGNORECASE):
            capturing = True
            log.debug(f"      Found IFSC pattern, started capturing: {part}")

    if name_parts:
        name = clean_name(' '.join(name_parts))
        log.debug(f"      Captured name parts: '{name}'")
        return (name, "NEFT")

    log.debug("      No valid NEFT payee found")
    return ("NEFT Transaction", "NEFT")


def _extract_imps(text):
    log.debug(f"      _extract_imps input: {text[:80]}{'...' if len(text) > 80 else ''}")
    match = re.search(r'IMPS\w*[\s/-]+\d+[\s/-]+(.+)$', text, re.IGNORECASE)
    if match:
        name = clean_name(match.group(1))
        log.debug(f"      Regex match: '{name}'")
        return (name, "IMPS")

    parts = re.split(r'[\s/-]+', text)
    log.debug(f"      IMPS split parts: {parts[:5]}{'...' if len(parts) > 5 else ''}")
    name_parts = []
    capturing = False
    for part in parts:
        if part.upper().startswith('IMPS'):
            continue
        if capturing:
            name_parts.append(part)
        elif part.isdigit() and len(part) > 3:
            capturing = True
            log.debug(f"      Found account number, started capturing after: {part}")

    if name_parts:
        name = clean_name(' '.join(name_parts))
        log.debug(f"      Captured name parts: '{name}'")
        return (name, "IMPS")

    log.debug("      No valid IMPS payee found")
    return ("IMPS Transaction", "IMPS")


def _extract_merchant(text):
    log.debug(f"      _extract_merchant input: {text[:80]}{'...' if len(text) > 80 else ''}")

    # Format: TRANSACTION_ID/DATE TIME MERCHANT_NAME
    # Extract everything after the time (HH:MM:SS format)
    time_match = re.search(r'\d{2}:\d{2}:\d{2}\s+(.*)$', text)
    if time_match:
        name = time_match.group(1)
        # Remove trailing date if present (e.g., -06/04/26)
        name = re.sub(r'\s*-\s*\d{2}/\d{2}/\d{2,4}.*', '', name)
        # Remove state codes
        name = re.sub(r'\s*[A-Z]{2}IN\s*$', '', name)
    else:
        # Fallback: split by date
        match = re.split(r'\d{2}/\d{2}/\d{2,4}', text)
        name = match[0] if match else text
        name = re.sub(r'\s*[A-Z]{2}IN\s*$', '', name)
        name = re.sub(r'\s*-\s*$', '', name)

    cleaned = clean_name(name[:50])
    if len(cleaned) < 3:
        cleaned = clean_name(text[:40])
    log.debug(f"      Merchant fallback → '{cleaned}'")
    return (cleaned, "Other")


# ---------- CLEAN NAME ----------

def clean_name(name):
    name = re.sub(r'[^A-Z0-9 ]', '', name.upper())
    name = name.strip()
    for code in STATE_CODES:
        if name.endswith(code):
            name = name[:-len(code)].strip()
            break
    name = re.sub(r'\s+', ' ', name)
    return name.strip().title() if name else "Unknown"


# ---------- DATE & TIME ----------

def extract_datetime(text):
    m = re.search(DATE_TIME_REGEX, text)
    return m.group() if m else ""


def extract_datetime_tuple(text):
    """Return (date, time) as tuple for compatibility. Supports both / and - separators."""
    m = re.search(DATE_TIME_REGEX, text)
    if not m:
        return None, None
    dt_str = m.group()

    # Try different date format combinations
    formats = [
        "%d/%m/%Y %H:%M:%S",  # Slash with 4-digit year
        "%d/%m/%y %H:%M:%S",  # Slash with 2-digit year
        "%d-%m-%Y %H:%M:%S",  # Hyphen with 4-digit year
        "%d-%m-%y %H:%M:%S",  # Hyphen with 2-digit year
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(dt_str, fmt)
            return dt.date(), dt.time()
        except ValueError:
            continue

    return None, None


# ---------- FLAGS ----------

def detect_flags(text, payee, user_name=None):
    flags = []
    if "MANDATE" in text:
        flags.append("Subscription")
    if user_name and user_name.upper() in payee.upper():
        flags.append("Self Transfer")
    return flags


def is_self_transfer(payee, account_holder="ATHUL"):
    return account_holder in payee.upper()


def is_mandate(text):
    return "MANDATE" in text.upper()
