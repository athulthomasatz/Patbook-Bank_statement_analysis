import re


def extract_payee(narration: str) -> tuple[str, str]:
    """Extract payee name and transaction category from narration.
    Uses re.search so patterns match anywhere in the text (not just at start).
    Returns (payee, category).
    """
    if not narration:
        return ("Unknown", "Other")

    text = narration.strip()

    # UPI: UPI/CR|DR/refno/NAME/BANK/...
    # Capture name as everything between refno/ and next / (full segment including spaces)
    upi = re.search(r"UPI/(CR|DR)/(\d+)/([^/]+)", text)
    if upi:
        name = upi.group(3).strip()
        # Clean truncated trailing junk
        name = re.sub(r"\s+$", "", name)
        if name:
            return (name.title(), "UPI")

    # NEFT (HDFC): NEFT DR-IFSC-NAME-NETBANK
    neft_hdfc = re.search(r"NEFT\s+(DR|CR)-\w+-(.+?)-(?:NETBANK|NEFT)", text)
    if neft_hdfc:
        return (neft_hdfc.group(2).strip().title(), "NEFT")

    # NEFT (generic): NEFT/refno/NAME/...
    neft_gen = re.search(r"NEFT[\s/-]+\d+[/-]([^/-]+)", text)
    if neft_gen:
        return (neft_gen.group(1).strip().title(), "NEFT")

    # IMPS: IMPS-refno-NAME or IMPSAB-refno-NAME
    imps = re.search(r"IMPS\w*[-\s]\d+[-\s](.+?)(?:[-/]|\s*$)", text)
    if imps:
        return (imps.group(1).strip().title(), "IMPS")

    # Salary: A2AINT##-COMPANY-SALARY
    salary = re.search(r"A2AINT\d+-(.+?)-SALARY", text, re.IGNORECASE)
    if salary:
        return (salary.group(1).strip().title(), "Salary")

    # ATM: ATM CASH-code-LOCATION
    if re.search(r"ATM\s+CASH", text, re.IGNORECASE):
        loc = re.search(r"ATM\s+CASH-[^-]+-(.+)", text, re.IGNORECASE)
        location = loc.group(1).strip() if loc else ""
        location = re.sub(r"\s*\d{2}/\d{2}/\d{2,4}\s*\d{0,2}:?\d{0,2}:?\d{0,2}.*", "", location).strip()
        location = re.sub(r"/\d+$", "", location).strip()
        label = "ATM Withdrawal"
        if location:
            label += f" — {location}"
        return (label, "ATM")

    # Cheque: Chq: number
    if re.search(r"Chq:\s*\d+", text, re.IGNORECASE):
        return ("Cheque", "Cheque")

    # Interest
    if re.search(r"interest", text, re.IGNORECASE):
        if re.search(r"credit|cr|earned", text, re.IGNORECASE):
            return ("Interest Credit", "Interest")
        return ("Interest", "Interest")

    # Charges / Fee
    if re.search(r"charge|fee|gst|tax|commission", text, re.IGNORECASE):
        return ("Bank Charges", "Charges")

    # UPIAR (Union Bank UPI Auto Request)
    upiar = re.search(r"UPIAR[-/](.+)", text)
    if upiar:
        details = upiar.group(1)
        handle = re.search(r"(\d+@[\w]+)", details)
        if handle:
            return (handle.group(1), "UPI")
        return (details[:30].strip(), "UPI")

    # Fallback: try to grab the first human-looking segment
    cleaned = re.sub(r"\d{2}/\d{2}/\d{2,4}\s+\d{0,2}:\d{0,2}:\d{0,2}", "", text)
    cleaned = re.sub(r"\d{10,}", "", cleaned)  # remove long reference numbers
    cleaned = re.sub(r"^[\W]+", "", cleaned).strip()
    if cleaned and len(cleaned) > 2:
        for part in re.split(r"[-/@\s]+", cleaned):
            part = part.strip()
            if part and len(part) > 2 and not part.isdigit() and not re.match(r"^\d{2,}$", part):
                return (part.title(), "Other")

    # Last resort
    cleaned = re.sub(r"\d{2}/\d{2}/\d{2,4}\s+\d{0,2}:\d{0,2}:\d{0,2}", "", text[:60])
    cleaned = re.sub(r"\d{10,}", "", cleaned).strip()
    return (cleaned.strip() if cleaned.strip() else text[:30].strip(), "Other")
