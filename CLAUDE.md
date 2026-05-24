# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank Statement Analyzer - A web application for parsing, analyzing, and exporting transactions from bank statement PDFs. The project uses a React + FastAPI architecture (migrated from Streamlit in v0.2.0).

## Architecture

### Backend (Python/FastAPI)
- **Entry point**: `backend/main.py` - FastAPI app with CORS enabled for localhost:5173 and localhost:3000
  - Endpoints: `GET /api/health`, `GET /api/banks`, `POST /api/parse`, `POST /api/export`
- **PDF Loading**: `backend/utils/pdf_loader.py` - Handles PDF decryption using pikepdf, returns pdfplumber object
- **Parser Registry**: `backend/parsers/__init__.py` - Maps bank names to parser functions (PARSERS dict)
- **Parser Functions**: Each bank parser (`canara.py`, `hdfc.py`, `union.py`, `federal.py`, `sbi.py`, `kotak.py`, `pnb.py`) returns a pandas DataFrame with columns: Date, Payee, Category, Type, Amount, Balance, Bank, Narration
- **Payee Extraction**: `backend/utils/payee_extractor.py` - Extracts payee names and transaction categories from narration text using regex patterns and merchant mappings

### Frontend (React/Vite)
- **Entry point**: `frontend/src/main.jsx` - React app entry
- **API Client**: `frontend/src/api.js` - Functions: getBanks(), parseStatement(), downloadCSV()
- **Components**: Upload, Summary, Filters, Table, DebugLogs, ExportDialog, Analytics
- **Pages**: Home (upload, transaction view), About (application info), Analytics (dedicated analytics page)
- **State Management**: Uses React useState for transactions, filters, and editable transaction fields
- **Chart Library**: Uses Recharts for visual analytics (pie charts, bar charts)
- **Routing**: React Router for client-side navigation with `/`, `/about`, `/analytics` routes
- **Dynamic Bank Selection**: Bank dropdown fetches available banks from `/api/banks` API endpoint
- **Analytics Integration**: Google Analytics (gtag) and Microsoft Clarity for user behavior tracking (`frontend/src/analytics.js`)
- **Environment Variables**: Vite env vars (`VITE_*` prefix) in `frontend/.env` for tracking IDs and API URLs

## Deployment

### Frontend → Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables set in Cloudflare dashboard (e.g., `VITE_GA_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID`)

### Backend → Render
- Render config: `render.yaml` at project root
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables set in Render dashboard (e.g., `ALLOWED_ORIGINS`)
- **Keepalive ping**: GitHub Actions workflow `.github/workflows/ping.yml` runs every 5 minutes to prevent free-tier sleep. Requires `RENDER_URL` secret in repo settings.

### CORS Configuration
- Origins are read from the `ALLOWED_ORIGINS` environment variable (comma-separated URLs)
- Falls back to localhost origins for local development if `ALLOWED_ORIGINS` is not set

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

## Frontend Routing

The application uses React Router for client-side navigation:

### Routes
- `/` - Home page: Upload PDF, view transactions, apply filters, edit transactions
- `/about` - About page: Application information and features
- `/analytics` - Dedicated analytics page with comprehensive financial insights

### Navigation Component
The header includes a navigation bar that highlights the active route automatically. Clicking navigation items switches between pages without full page reloads.

### State Sharing
Transaction data is lifted to the App component level and shared between pages via props, allowing the analytics page to access data uploaded on the home page.

## Adding a New Bank Parser

1. Create a new file in `backend/parsers/` (e.g., `axis.py`)
2. Implement a `parse(pdf)` function that accepts a pdfplumber PDF object and returns a pandas DataFrame with columns: Date, Payee, Category, Type, Amount, Balance, Bank, Narration
3. Add the parser to `backend/parsers/__init__.py` in the PARSERS dict:

```python
from parsers.axis import parse as parse_axis

PARSERS = {
    "HDFC": parse_hdfc,
    "Canara": parse_canara,
    "Union Bank": parse_union,
    "Federal Bank": parse_federal,
    "SBI": parse_sbi,
    "Kotak": parse_kotak,
    "PNB": parse_pnb,
    "Kerala Gramin Bank": parse_kgb,
    "Axis": parse_axis,  # Add your bank here
}
```

4. The bank name will automatically appear in the frontend bank dropdown via the `/api/banks` endpoint (no frontend changes needed)
5. Add unit tests in `backend/tests/test_axis.py` following the existing test patterns

## Parser Implementation Notes

- Use `_process_row()` helper pattern for consistent row processing (see `canara.py`, `pnb.py`)
- Each parser should handle both table extraction and text-based parsing as fallback
- Use `payee_extractor.extract_payee(narration)` for payee/category extraction
- Use `payee_extractor.normalize()` to fix broken PDF text (hyphenated line breaks, word fragments)
- Sort transactions by date/time before returning the DataFrame
- Add bank-specific date validators (e.g., `_is_pnb_date`, `_is_canara_date`) for reliability
- Add unit tests in `backend/tests/test_<bank>.py` covering date validation, row processing, and payee extraction

## PDF Decryption

The backend supports password-protected PDFs through `pdf_loader.py`. The decryption process:
1. Save uploaded PDF to temp file
2. If password provided, use pikepdf to decrypt and save to `_decrypted.pdf`
3. Load decrypted file with pdfplumber for parsing

## Payee Extraction

The `payee_extractor.py` module handles:
- Normalizing broken PDF text (joining hyphenated words, word fragments)
- Detecting transaction type (Credit/Debit/Unknown) from UPI strings and keywords
- Extracting payee name and category from narration
- Merchant name mappings for known merchants (see MERCHANT_MAPPINGS dict)
- UPI transaction parsing (format: `UPI/CR|DR/REFNO/NAME/BANK/...`)

**Note**: `get_type()` returns `"Unknown"` for transactions that don't match UPI/ATM patterns. Parsers should fall back to balance comparison or column-based detection (DR/CR) when type is Unknown.

**Note**: Self-transfer detection has been removed (previously used name-based detection which was unreliable). Proper self-transfer detection using account numbers, IFSC codes, or transaction patterns is planned for a future stage.

Add new merchant mappings to `MERCHANT_MAPPINGS` to improve categorization.

## Testing

Parser tests live in `backend/tests/` and are run via pytest in CI.

### Running Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Existing Test Coverage
- `test_canara.py` — 16 tests: date validation, row processing, amount extraction edge cases
- `test_pnb.py` — 23 tests: date validation, UPI/IMPS/NEFT/RTGS payee extraction, row processing, cheque handling
- `test_kgb.py` — 29 tests: date validation, payee extraction for UPI/UTR/MOB/Interest, text fallback parsing, row processing

### Adding New Parser Tests
Follow the pattern in `test_pnb.py`:
1. Test date validators (`_is_valid_date`, `_parse_date`)
2. Test amount parsing (`_amt`)
3. Test payee/category extraction for each transaction type
4. Test `_process_row` or `_process_row_data` for debit, credit, skip, and edge cases

## Analytics Dashboard

The application includes a comprehensive analytics dashboard (`frontend/src/components/Analytics.jsx`) that provides visual insights into transaction data:

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

### Advanced Analytics Features

#### Smart Category Insights
- **Category Drift Detection**: Compares current month vs previous month spending by category
- **Top Growing Category**: Highlights the category with highest/lowest growth rate with percentage change

#### Risk & Alert System
- **Unusual Transaction Detection**: Flags transactions where amount > 2x category average
- **Low Balance Warning**: Tracks periods when balance dropped below ₹1,000
- **High Frequency Spending**: Flags days with >5 transactions (potential impulse buying)

#### Payment Method Intelligence
- **ATM vs Digital**: Compares ATM withdrawal total vs digital payment total
- **Preferred Payment Methods**: Shows percentage breakdown with progress bars

#### Merchant Intelligence
- **Top Merchants by Amount**: Top 10 merchants by total spending
- **Merchant Frequency**: Top 10 most frequently used merchants
- **Hidden Spending**: Tracks small purchases (₹10-₹50) and shows cumulative impact by category

#### Savings & Efficiency Metrics
- **Savings Rate**: Calculates (income - expense) / income as percentage
- **Expense Ratio**: Shows % of income spent on each category

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

## Error Handling & User Feedback

### Bank Mismatch Detection
When parsing returns zero transactions, the app displays a warning suggesting possible bank selection error:
- Yellow warning banner with explanation
- Reference to Debug Logs for more details
- Prevents confusion when wrong bank is selected

### Loading States
- **Global Loading Overlay**: Full-screen overlay with spinner during PDF processing
- **Button Loading State**: Upload button shows spinner and "Processing..." text
- **Status Indicators**: Success (green), Warning (yellow), Error (red) states with icons

### Status States in Upload Component
- `idle`: No file or processing started
- `loading`: Currently processing PDF
- `success`: Processing completed successfully
- `error`: Processing failed with error message
- `warning`: No transactions found (possible bank mismatch)

## Analytics & Tracking

### Google Analytics (gtag)
- Measurement ID stored in `VITE_GA_MEASUREMENT_ID` env var
- Automatically tracks page views on route changes via `RouteTracker` component in `App.jsx`
- Custom events tracked via `trackEvent(action, category, label)`:
  - `select_bank` (category: upload) — when user picks a bank
  - `upload_statement` (category: upload) — when user submits a PDF
  - `view_toggle` (category: dashboard) — switching transactions/analytics view
  - `export_csv` (category: export) — when user exports CSV

### Microsoft Clarity
- Project ID stored in `VITE_CLARITY_PROJECT_ID` env var
- Provides session recordings, heatmaps, and user behavior insights

### Analytics Module (`frontend/src/analytics.js`)
- `initAnalytics()` — called in `main.jsx` on app load, injects gtag and Clarity scripts
- `trackPageView(path)` — fires page view on route change
- `trackEvent(action, category, label)` — sends custom GA events
- Scripts are not loaded when IDs are still placeholders (avoids dev noise)
