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
- **Components**: Upload, Summary, Filters, Table, DebugLogs, ExportDialog, Analytics
- **State Management**: Uses React useState for transactions, filters, and editable transaction fields
- **Chart Library**: Uses Recharts for visual analytics (pie charts, bar charts)
- **Navigation**: Tab-based navigation to switch between Transactions and Analytics views

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
npm install recharts  # Required for analytics charts
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

## Analytics Dashboard

The application includes an analytics dashboard (`frontend/src/components/Analytics.jsx`) that provides visual insights into transaction data:

### Charts and Visualizations

1. **Financial Overview Cards**
   - Total Debit (red) - sum of all debit transactions
   - Total Credit (green) - sum of all credit transactions
   - Net Balance (blue/red) - credits minus debits

2. **Spending by Category** (Pie Chart)
   - Groups debit transactions by Category
   - Shows top 10 categories with percentages
   - Hover displays exact amounts

3. **Debit vs Credit** (Donut Chart)
   - Visual comparison of money flowing in vs out
   - Color-coded: red for debit, green for credit

4. **Transactions by Date** (Bar Chart)
   - Shows transaction count per day
   - Displays last 14 days of activity
   - Helps identify spending patterns over time

5. **Spending by Payment Method** (Pie Chart)
   - Groups transactions by payment method extracted from narration
   - Methods: UPI, IMPS, IFN, ATM, NEFT, RTGS, Cheque, Other
   - Helps understand preferred payment channels

### Transaction Method Detection

Payment methods are detected from narration text using keyword matching:
- `UPI` → UPI
- `IMPS` → IMPS
- `IFN` → IFN
- `ATM` → ATM
- `NEFT` → NEFT
- `RTGS` → RTGS
- `CHEQUE` → Cheque
- Default → Other

### Dependencies

The analytics feature uses the Recharts library:
```bash
cd frontend
npm install recharts
```

### Adding New Analytics

To add new charts or analytics:
1. Add the chart logic in `frontend/src/components/Analytics.jsx`
2. Use Recharts components (PieChart, BarChart, LineChart, etc.)
3. Process data using `useMemo` for performance
4. Follow existing color palette and styling patterns
