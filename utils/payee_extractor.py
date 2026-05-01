import re


def extract_payee(narration: str) -> tuple[str, str]:
    """Extract payee name and transaction category from narration.
    Returns (payee, category).
    """
    if not narration:
        return ("Unknown", "Other")

    text = narration.strip()

    # UPI: UPI/CR|DR/refno/NAME/BANK/...
    upi = re.match(r"UPI/(CR|DR)/\d+/([^/]+)", text)
    if upi:
        name = upi.group(2).strip()
        name = re.sub(r"\s+", " ", name)
        return (name.title(), "UPI")

    # NEFT (HDFC): NEFT DR-IFSC-NAME-NETBANK
    neft_hdfc = re.match(r"NEFT\s+(DR|CR)-\w+-(.+?)-(?:NETBANK|NEFT)", text)
    if neft_hdfc:
        return (neft_hdfc.group(2).strip().title(), "NEFT")

    # NEFT (generic): NEFT/refno/NAME/...
    neft_gen = re.match(r"NEFT[\s/-]+\d+[/-]([^/-]+)", text)
    if neft_gen:
        return (neft_gen.group(1).strip().title(), "NEFT")

    # IMPS: IMPS-refno-NAME or IMPSAB-refno-NAME
    imps = re.match(r"IMPS\w*[-\s]\d+[-\s](.+?)(?:[-/]|\s*$)", text)
    if imps:
        return (imps.group(1).strip().title(), "IMPS")

    # Salary: A2AINT##-COMPANY-SALARY
    salary = re.match(r"A2AINT\d+-(.+?)-SALARY", text, re.IGNORECASE)
    if salary:
        return (salary.group(1).strip().title(), "Salary")

    # ATM: ATM CASH-code-LOCATION
    if re.match(r"ATM\s+CASH", text, re.IGNORECASE):
        loc = re.match(r"ATM\s+CASH-[^-]+-(.+)", text, re.IGNORECASE)
        location = loc.group(1).strip() if loc else ""
        label = f"ATM Withdrawal" + (f" — {location}" if location else "")
        return (label, "ATM")

    # Cheque: Chq: number
    if re.match(r"Chq:\s*\d+", text, re.IGNORECASE):
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
    upiar = re.match(r"UPIAR[-/](.+)", text)
    if upiar:
        details = upiar.group(1)
        handle = re.search(r"(\d+@[\w]+)", details)
        if handle:
            return (handle.group(1), "UPI")
        return (details[:30].strip(), "UPI")

    # Fallback: try to grab the first human-looking segment
    cleaned = re.sub(r"^[\w]+[-/\s]+", "", text, count=1)
    if cleaned and len(cleaned) > 2:
        for part in re.split(r"[-/@]", cleaned):
            part = part.strip()
            if part and len(part) > 2 and not part.isdigit():
                return (part.title(), "Other")

    return (text[:40].strip(), "Other")
