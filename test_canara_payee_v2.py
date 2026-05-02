#!/usr/bin/env python3
"""Test user's cleaner payee extraction implementation."""

import re
from datetime import datetime

NOISE = {
    "UPI","CR","DR","PAID","VIA","TO","FROM","UPIINTENT",
    "IMPS","NEFT","REF","ID"
}

DATE_TIME_REGEX = r'\d{2}/\d{2}/\d{2,4}\s+\d{2}:\d{2}:\d{2}'


# ---------- NORMALIZATION ----------

def normalize_text(text):
    text = text.upper()

    # Fix broken words like FLIPKAR\nT
    text = re.sub(r'-\s*\n\s*', '', text)
    text = re.sub(r'\s*\n\s*', ' ', text)

    # Normalize spaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


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

def extract_payee(text):
    text = normalize_text(text)

    # ATM
    if "ATM CASH" in text:
        return "ATM Withdrawal"

    # UPI
    if "UPI" in text:
        parts = [p.strip() for p in text.split("/") if p.strip()]

        for part in parts:
            if part in NOISE:
                continue
            if part.isdigit():
                continue
            if len(part) < 3:
                continue
            if part.startswith("**"):
                continue

            # Masked (XXX...)
            if part.startswith("XXX"):
                return "Payment Gateway"

            return clean_name(part)

    # Merchant fallback
    return extract_merchant(text)


# ---------- MERCHANT ----------

def extract_merchant(text):
    split_text = re.split(r'\d{2}/\d{2}/\d{2,4}', text)
    name = split_text[0] if split_text else text
    return clean_name(name[:60])


# ---------- CLEAN NAME ----------

def clean_name(name):
    name = re.sub(r'[^A-Z ]', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name.strip().title()


# ---------- DATE & TIME ----------

def extract_datetime(text):
    match = re.search(DATE_TIME_REGEX, text)
    if not match:
        return None, None

    dt_str = match.group()

    try:
        dt = datetime.strptime(dt_str, "%d/%m/%Y %H:%M:%S")
    except:
        try:
            dt = datetime.strptime(dt_str, "%d/%m/%y %H:%M:%S")
        except:
            return None, None

    return dt.date(), dt.time()


# ---------- FLAGS ----------

def detect_flags(text, payee, user_name=None):
    flags = []

    if "MANDATE" in text:
        flags.append("Subscription")

    if user_name and user_name.upper() in payee.upper():
        flags.append("Self Transfer")

    return flags


# ---------- MAIN PARSER ----------

def parse_canara_rows(rows, user_name=None):
    """
    rows = list of raw narration strings extracted from PDF
    """

    transactions = []

    for raw in rows:
        text = normalize_text(raw)

        txn_type = get_type(text)
        channel = get_channel(text)
        payee = extract_payee(text)
        date, time = extract_datetime(text)
        flags = detect_flags(text, payee, user_name)

        transactions.append({
            "date": str(date) if date else "",
            "time": str(time) if time else "",
            "type": txn_type,
            "channel": channel,
            "payee": payee,
            "notes": ", ".join(flags)
        })

    return transactions


# ---------- TEST ----------
canara_samples = [
    "UPI/CR/609294596200/XXXPGN KO/KKBK/*OHR 4@OKAXISUPI/AXI44E406534 39B40B0B24C6394C2C61BB5/0 2/04/2026 21:19:21",
    "UPI/CR/001517613178/ATHUL THO/UBIN/*58399@NYES/PAID VIA/YBN2026040411582247166 7697324032000/04/04/2026 11:58:27",
    "UPI/DR/212035692724/FLIPKAR T /HDFC/*/*PAYU@HDFCBANK/U PIINTENT/PPPL2799387168202 042621202569CE9041/02/04/20 26 21:20:36",
    "UPI/DR/609469531329/RINSHA SH/SBIN",
    "ATM CASH-HKOZ4003-UBINELIKODEKOZHIKODEKLI N-04/04/26 12:34:43/1008",
    "UPIAR-789123456789-merchant@paytm",
]

print("=" * 80)
print("USER'S IMPLEMENTATION TEST")
print("=" * 80)

for i, sample in enumerate(canara_samples, 1):
    text = normalize_text(sample)
    payee = extract_payee(text)
    txn_type = get_type(text)
    channel = get_channel(text)
    date, time = extract_datetime(text)

    print(f"\n[{i}] Payee: {payee}")
    print(f"     Type: {txn_type} | Channel: {channel}")
    print(f"     Date: {date} | Time: {time}")
    print(f"     Input: {sample[:70]}...")
