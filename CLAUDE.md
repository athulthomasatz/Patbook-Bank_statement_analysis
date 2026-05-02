# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank Statement Analyzer - A web application for parsing, analyzing, and exporting transactions from bank statement PDFs. The project uses a React + FastAPI architecture (migrated from Streamlit in v0.2.0).

## Architecture

### Backend (Python/FastAPI)
- **Entry point**: `backend/main.py` - FastAPI app with CORS enabled for localhost:5173 and localhost:3000
- **PDF Loading**: `backend/utils/pdf_loader.py` - Handles PDF decryption using pikepdf, returns pdfplumber object
- **Parser Registry**: `backend/parsers/__init__.py` - Maps bank names to parser functions (PARSERS dict)
- **Parser Functions**: Each bank parser (`canara.py`, `hdfc.py`, `union.py`) returns a pandas DataFrame with columns: Date, Payee, Category, Type, Amount, Balance, Bank, Narration
- **Payee Extraction**: `backend/utils/payee_extractor.py` - Extracts payee names and transaction categories from narration text using regex patterns and merchant mappings

### Frontend (React/Vite)
- **Entry point**: `frontend/src/main.jsx` - React app entry
- **API Client**: `frontend/src/api.js` - Functions: getBanks(), parseStatement(), downloadCSV()
- **Components**: Upload, Summary, Filters, Table, DebugLogs, ExportDialog
- **State Management**: Uses React useState for transactions, filters, and editable transaction fields

## Common Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000 by default (uvicorn default).

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173.

## Adding a New Bank Parser

1. Create a new file in `backend/parsers/` (e.g., `sbi.py`)
2. Implement a `parse(pdf)` function that accepts a pdfplumber PDF object and returns a pandas DataFrame with columns: Date, Payee, Category, Type, Amount, Balance, Bank, Narration
3. Add the parser to `backend/parsers/__init__.py` in the PARSERS dict:

```python
from parsers.sbi import parse as parse_sbi

PARSERS = {
    "HDFC": parse_hdfc,
    "Canara": parse_canara,
    "Union Bank": parse_union,
    "SBI": parse_sbi,  # Add your bank here
}
```

4. The bank name will automatically appear in the frontend bank dropdown via the `/api/banks` endpoint

## Parser Implementation Notes

- Use `_process_row()` helper pattern for consistent row processing (see `canara.py`)
- Each parser should handle both table extraction and text-based parsing as fallback
- Use `payee_extractor.extract_payee(narration)` for payee/category extraction
- Use `payee_extractor.normalize()` to fix broken PDF text (hyphenated line breaks, word fragments)
- Sort transactions by date/time before returning the DataFrame

## PDF Decryption

The backend supports password-protected PDFs through `pdf_loader.py`. The decryption process:
1. Save uploaded PDF to temp file
2. If password provided, use pikepdf to decrypt and save to `_decrypted.pdf`
3. Load decrypted file with pdfplumber for parsing

## Payee Extraction

The `payee_extractor.py` module handles:
- Normalizing broken PDF text (joining hyphenated words, word fragments)
- Detecting transaction type (Credit/Debit) from UPI strings
- Extracting payee name and category from narration
- Merchant name mappings for known merchants (see MERCHANT_MAPPINGS dict)
- UPI transaction parsing (format: `UPI/CR|DR/REFNO/NAME/BANK/...`)

Add new merchant mappings to `MERCHANT_MAPPINGS` to improve categorization.
