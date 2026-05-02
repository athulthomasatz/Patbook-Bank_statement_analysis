#!/usr/bin/env python3
"""Extract and show raw narration text from Canara PDF."""

import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    format='%(name)s - %(levelname)s - %(message)s'
)

sys.path.insert(0, 'backend')

import pdfplumber
from parsers.canara import parse

pdf_path = "/home/athul-thomas/Desktop/SSD Projects/BankStatement/canara_epassbook_2026-05-01 134619.721227.pdf"

print("=" * 100)
print("EXTRACTING RAW NARRATION FROM CANARA PDF")
print("=" * 100)

pdf = pdfplumber.open(pdf_path)
print(f"\nPDF has {len(pdf.pages)} pages\n")

for page_idx, page in enumerate(pdf.pages):
    print(f"--- PAGE {page_idx + 1} ---")
    text = page.extract_text()
    if text:
        print(text[:500])
        if len(text) > 500:
            print("... (truncated)")
    else:
        print("No text extracted")
    print()

pdf.close()

print("\n" + "=" * 100)
print("NOW PARSING WITH FULL DEBUG OUTPUT")
print("=" * 100)

# Re-open for parsing
pdf = pdfplumber.open(pdf_path)
df = parse(pdf)
pdf.close()

print("\n" + "=" * 100)
print(f"RESULT: {len(df)} transactions extracted")
print("=" * 100)
print("\nTransaction details:")
for idx, row in df.head(10).iterrows():
    print(f"\n[{idx+1}] {row['Date']} | {row['Payee']} | {row['Type']} | ₹{row['Amount']:.2f}")
    print(f"    Narration: {row['Narration'][:100]}")
