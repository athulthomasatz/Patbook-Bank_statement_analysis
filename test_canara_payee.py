#!/usr/bin/env python3
"""Test payee extraction for Canara Bank samples."""

import logging
from backend.utils.payee_extractor import extract_payee, normalize, get_type, get_channel, extract_datetime_tuple

# Enable debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(name)s - %(levelname)s - %(message)s'
)

# Actual text samples from Canara e-passbook (based on the screenshots you provided)
canara_samples = [
    # UPI Credit
    "UPI/CR/609294596200/XXXPGN KO/KKBK/*OHR 4@OKAXISUPI/AXI44E406534 39B40B0B24C6394C2C61BB5/0 2/04/2026 21:19:21",
    "UPI/CR/001517613178/ATHUL THO/UBIN/*58399@NYES/PAID VIA/YBN2026040411582247166 7697324032000/04/04/2026 11:58:27",
    "UPI/CR/609469389830/ATHUL THO/UBIN/*58399@NAVIAIXIS/ PAID VIA/AXB2026040411582247166 7697324034000/04/04/2026 12:33:50",

    # UPI Debit
    "UPI/DR/212035692724/FLIPKAR T /HDFC/*/*PAYU@HDFCBANK/U PIINTENT/PPPL2799387168202 042621202569CE9041/02/04/20 26 21:20:36",
    "UPI/DR/609469531329/RINSHA SH/SBIN",

    # ATM
    "ATM CASH-HKOZ4003-UBINELIKODEKOZHIKODEKLI N-04/04/26 12:34:43/1008",

    # Cheque
    "Chq: 609294596200",
    "Chq: 212035692724",

    # Other patterns
    "UPIAR-789123456789-merchant@paytm",
    "IMPSAB-123456-RECIPIENT NAME",
    "NEFT-SBIN123456-PAYEE NAME",
]

print("=" * 80)
print("PAYEE EXTRACTION TEST - CANARA BANK SAMPLES")
print("=" * 80)

for i, sample in enumerate(canara_samples, 1):
    normalized = normalize(sample)
    payee = extract_payee(sample)
    txn_type = get_type(sample)
    channel = get_channel(sample)
    date, time = extract_datetime_tuple(sample)

    print(f"\n[{i}] ORIGINAL TEXT:")
    print(f"    {sample[:90]}{'...' if len(sample) > 90 else ''}")

    print(f"    NORMALIZED:")
    print(f"    {normalized[:90]}{'...' if len(normalized) > 90 else ''}")

    print(f"    RESULT:")
    print(f"    Payee = '{payee}' | Type = '{txn_type}' | Channel = '{channel}'")
    print(f"    Date = {date} | Time = {time}")

print("\n" + "=" * 80)
