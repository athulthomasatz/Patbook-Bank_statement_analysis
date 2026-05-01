import re

# Tokens that are never payee names
NOISE = {
    "UPI", "CR", "DR", "PAID", "VIA", "TO", "FROM",
    "UPIINTENT", "AXI", "HDFC", "SBIN", "UBIN", "KKBK",
    "ICIC", "SIBL", "CNRB", "PUNB", "BARB", "IOBA",
    "OK", "NYES", "YBL", "PAYU", "UPIAR", "IMPSAB",
}


def normalize(text):
    """Normalize broken PDF text — join broken words, collapse whitespace.

    Fixes issues like:
    - FLIPKAR\nT → FLIPKART
    - Hyphen-broken: WORD-\nWORD → WORDWORD
    - Multiple spaces collapsed to single
    """
    text = text.upper()

    # Join hyphen-broken words at line breaks
    text = re.sub(r"-\s*\n\s*", "", text)

    # Join broken words where a letter, newline, then another letter
    # Example: FLIPKAR\nT → FLIPKART
    text = re.sub(r"([A-Z])\s*\n\s*([A-Z])", r"\1\2", text)

    # Replace remaining newlines with single space
    text = re.sub(r"\n+", " ", text)

    # Collapse multiple spaces to single
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def clean_name(name):
    """Remove non-alpha characters, collapse whitespace, title-case."""
    name = re.sub(r"[^A-Z ]", "", name.upper())
    name = re.sub(r"\s+", " ", name).strip()
    return name.title() if name else "Unknown"


def extract_datetime(text):
    """Extract DD/MM/YYYY HH:MM:SS from narration."""
    m = re.search(r"\d{2}/\d{2}/\d{2,4}\s+\d{2}:\d{2}:\d{2}", text)
    return m.group() if m else ""


def is_self_transfer(payee, account_holder="ATHUL"):
    """Check if payee matches account holder (self-transfer)."""
    return account_holder in payee.upper()


def is_mandate(text):
    """Check if this is an autopay/mandate transaction."""
    return "MANDATE" in text.upper()


def extract_payee(narration: str) -> tuple[str, str]:
    """Extract payee name and transaction category from narration.
    Returns (payee, category).
    """
    if not narration:
        return ("Unknown", "Other")

    text = normalize(narration)

    # --- ATM ---
    if "ATM CASH" in text:
        loc_match = re.search(r"ATM\s+CASH-[^-]+-(.+?)(?:-\d{2}/|$)", text)
        location = ""
        if loc_match:
            location = loc_match.group(1).strip()
            # Extract city from garbled location (first recognizable chunk)
            city_match = re.search(r"([A-Z]{4,}(?:\s+[A-Z]+)*)", location)
            if city_match:
                location = city_match.group(1)
            location = clean_name(location)
        label = "ATM Withdrawal"
        if location and len(location) > 3:
            label += f" — {location}"
        return (label, "ATM")

    # --- UPI (must start with UPI) ---
    if text.startswith("UPI/"):
        return _extract_upi(text)

    # --- NEFT (HDFC format): NEFT DR-IFSC-NAME-NETBANK ---
    neft_hdfc = re.search(r"NEFT\s+(DR|CR)-\w+-(.+?)-(?:NETBANK|NEFT)", text)
    if neft_hdfc:
        return (clean_name(neft_hdfc.group(2)), "NEFT")

    # --- NEFT generic ---
    neft_gen = re.search(r"NEFT[\s/-]+\d+[/-]([^/-]+)", text)
    if neft_gen:
        return (clean_name(neft_gen.group(1)), "NEFT")

    # --- IMPS ---
    imps = re.search(r"IMPS\w*[-\s]\d+[-\s](.+?)(?:[-/]|\s*$)", text)
    if imps:
        return (clean_name(imps.group(1)), "IMPS")

    # --- Salary: A2AINT##-COMPANY-SALARY ---
    salary = re.search(r"A2AINT\d+-(.+?)-SALARY", text, re.IGNORECASE)
    if salary:
        return (clean_name(salary.group(1)), "Salary")

    # --- Cheque ---
    if re.search(r"CHQ:\s*\d+", text):
        return ("Cheque", "Cheque")

    # --- Interest ---
    if re.search(r"INTEREST", text):
        if re.search(r"CREDIT|CR|EARNED", text):
            return ("Interest Credit", "Interest")
        return ("Interest", "Interest")

    # --- Charges ---
    if re.search(r"CHARGE|FEE|GST|TAX|COMMISSION", text):
        return ("Bank Charges", "Charges")

    # --- UPIAR (Union Bank) ---
    upiar = re.search(r"UPIAR[-/](.+)", text)
    if upiar:
        details = upiar.group(1)
        handle = re.search(r"(\d+@[\w]+)", details)
        if handle:
            return (handle.group(1), "UPI")
        return (details[:30].strip(), "UPI")

    # --- Merchant / POS fallback ---
    return _extract_merchant(text)


def _extract_upi(text):
    """Extract payee from UPI transaction text.
    Format: UPI/CR|DR/REFNO/NAME/BANK/UPI_ID/STATUS//TXN_ID/DATE TIME
    """
    parts = [p.strip() for p in text.split("/") if p.strip()]

    # Walk through parts, skip noise tokens, find the name
    for part in parts:
        # Skip known noise
        if part in NOISE:
            continue
        # Skip pure numbers (ref IDs, transaction IDs)
        if part.isdigit():
            continue
        # Skip very short tokens
        if len(part) < 3:
            continue
        # Skip masked VPA (**XXX@BANK)
        if part.startswith("**"):
            continue
        # Skip date-like tokens
        if re.match(r"^\d{2}$", part):
            continue
        # Skip long hex/alphanumeric transaction IDs (15+ chars, mostly digits)
        if len(part) >= 15 and sum(c.isdigit() for c in part) > 10:
            continue

        # Masked payee (XXX...) → Payment Gateway
        if part.startswith("XXX"):
            return ("Payment Gateway", "UPI")

        # Self-transfer check
        name = clean_name(part)
        if is_self_transfer(name):
            return (name + " (Self)", "Self Transfer")

        # Mandate / autopay
        if "MANDATE" in part:
            return (clean_name(part.replace("MANDATE", "").strip()), "Subscription")

        return (name, "UPI")

    # If nothing found, return generic
    return ("UPI Transaction", "UPI")


def _extract_merchant(text):
    """Fallback for merchant/POS transactions.
    Pattern: MERCHANT_NAME LOCATION-DATE TIME/CODE
    """
    # Stop at date
    match = re.split(r"\d{2}/\d{2}/\d{2,4}", text)
    name = match[0] if match else text

    # Remove common trailing garbage
    name = re.sub(r"\s*[A-Z]{2}IN\s*$", "", name)  # state codes like MHIN, KLIN
    name = re.sub(r"\s*-\s*$", "", name)

    cleaned = clean_name(name[:50])
    if len(cleaned) < 3:
        cleaned = clean_name(text[:40])

    return (cleaned, "Other")
