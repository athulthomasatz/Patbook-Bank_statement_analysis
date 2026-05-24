#!/usr/bin/env python3
"""Extract and show raw text from a KGB PDF to help debug parsing issues."""

import logging
import sys
from pathlib import Path

# Quiet down pdfminer spam
logging.getLogger("pdfminer").setLevel(logging.WARNING)
logging.basicConfig(
    level=logging.INFO,
    format='%(name)s - %(levelname)s - %(message)s'
)

sys.path.insert(0, str(Path(__file__).parent / "backend"))

import pdfplumber
from parsers.kgb import parse

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "kgb.pdf"

print("=" * 80)
print("KGB PDF DEBUG")
print(f"File: {pdf_path}")
print("=" * 80)

try:
    pdf = pdfplumber.open(pdf_path)
except FileNotFoundError:
    print(f"\nERROR: File not found: {pdf_path}")
    print("Usage: python debug_kgb_pdf.py <path-to-kgb-pdf>")
    sys.exit(1)

print(f"Pages: {len(pdf.pages)}\n")

for page_idx, page in enumerate(pdf.pages):
    print(f"--- PAGE {page_idx + 1} ---")
    text = page.extract_text()
    if text:
        lines = text.split("\n")
        print(f"Text lines ({len(lines)}):")
        for line in lines:
            print(f"  | {line}")
    else:
        print("No text extracted")
    print()

pdf.close()

print("=" * 80)
print("PARSING")
print("=" * 80)

pdf = pdfplumber.open(pdf_path)
df = parse(pdf)
pdf.close()

print(f"\nRESULT: {len(df)} transactions extracted\n")

if not df.empty:
    for idx, row in df.head(20).iterrows():
        print(f"[{idx+1}] {row['Date']} | {row['Payee']} | {row['Type']} | ₹{row['Amount']:.2f} | bal ₹{row['Balance']:.2f}")
        print(f"    Narration: {row['Narration'][:100]}")
