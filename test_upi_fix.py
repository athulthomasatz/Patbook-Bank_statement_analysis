#!/usr/bin/env python3
"""Test the fixed UPI payee extraction."""

from utils.payee_extractor import _extract_upi, normalize

# Test cases showing the format
test_cases = [
    # Standard UPI format: UPI/CR|DR/REFNO/NAME/BANK/...
    "UPI/CR/609294596200/FLIPKART/HDFC/*PAYU",
    "UPI/DR/212035692724/SWIGGY/ICICI/OKICICI",
    "UPI/CR/001517613178/AMAZON/SBIN/OKSBIN",
    "UPI/DR/609469531329/RINSHA SH/KKBK/OKYBL",
    "UPI/CR/789456123/PHONE PE/PAYU/OKPAYTM",
    # Edge cases
    "UPI/CR/123456/XXX123@AXIS/AXISUPI",  # Masked
    "UPI/DR/987654/RAZORPAYPAYMENTS/HDFC/*PAYU",
]

print("=" * 80)
print("TESTING FIXED UPI PAYEE EXTRACTION (POSITION-BASED)")
print("=" * 80)

for i, test in enumerate(test_cases, 1):
    normalized = normalize(test)
    payee = _extract_upi(test)

    print(f"\n[{i}] Input: {test}")
    print(f"    Normalized: {normalized}")
    print(f"    Payee: {payee}")

    # Show parts for debugging
    parts = [p.strip() for p in test.split("/") if p.strip()]
    print(f"    Parts: {parts}")
    if len(parts) >= 4:
        print(f"    parts[3] (name field): {parts[3]}")
