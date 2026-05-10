# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Google Analytics (gtag) integration** - User behavior tracking with:
  - Automatic page view tracking on route changes
  - Custom events: bank selection, PDF upload, view toggle, CSV export
  - Environment-based measurement ID via `VITE_GA_MEASUREMENT_ID`
  - Scripts injected dynamically from `frontend/src/analytics.js`
- **Microsoft Clarity integration** - Session recordings and heatmaps via:
  - Environment-based project ID via `VITE_CLARITY_PROJECT_ID`
  - Dynamic script injection (skipped when ID is placeholder)
- **Analytics module** (`frontend/src/analytics.js`) with `initAnalytics()`, `trackPageView()`, `trackEvent()`
- **Route change tracking** - `RouteTracker` component in `App.jsx` fires page views
- **Deployment configs** - Open-source project setup:
  - `render.yaml` for backend deployment on Render
  - `frontend/public/_redirects` for Cloudflare Pages SPA routing
  - Environment-based CORS configuration via `ALLOWED_ORIGINS`
- **GitHub Actions CI** - Automated lint and build checks on PRs
- **Issue/PR templates** - Bug report, feature request, and pull request templates
- **CONTRIBUTING.md** - Setup instructions and contribution guidelines for open-source contributors

### Changed
- **CORS hardened** - Backend reads allowed origins from `ALLOWED_ORIGINS` env var instead of hardcoded localhost URLs (falls back to localhost for development)
- **Environment variables** - Analytics tracking IDs stored in `frontend/.env` (gitignored)
- **Updated .gitignore** - Added `.env`, `.env.local`, `.env.production` to frontend gitignore
- **SBI parser** - New parser for SBI bank statements with support for:
  - Table-based extraction (primary) with flexible column positioning
  - Text-based parsing as fallback for borderless tables
  - UPI transactions (UPI/CR for credit, UPI/DR for debit)
  - Date format: DD/MM/YYYY
  - Transaction type detection via separate debit/credit columns or UPI markers
  - Balance-based type detection as fallback
  - Multi-line narration handling with continuation line merging
- **React Router** - Added client-side routing with separate pages:
  - `/` - Home page with upload, transaction view, and filters
  - `/about` - About page with application information
  - `/analytics` - Dedicated analytics page
  - Navigation highlights active route automatically
- **Dynamic Bank Dropdown** - Bank selector now fetches available banks from `/api/banks` API endpoint instead of hardcoded list
- **Advanced Analytics Dashboard** - Comprehensive financial insights with:
  - **Smart Category Insights**: Category drift detection (month-over-month spending changes), Top growing category highlight
  - **Risk & Alert System**: Unusual transaction detection (amount > 2x category average), Low balance warnings (< ₹1,000), High frequency spending alerts (>5 transactions/day)
  - **Payment Method Intelligence**: ATM vs Digital spending comparison, Preferred payment method percentages
  - **Merchant Intelligence**: Top merchants by amount and frequency, Hidden spending tracker (₹10-₹50 small purchases)
  - **Savings & Efficiency**: Savings rate calculation, Expense ratio by category
  - Collapsible sections with Expand/Collapse All functionality
- **Bank Mismatch Detection** - Warning when no transactions are parsed, suggesting possible bank selection error
- **Loading States** - Global loading overlay with spinner during PDF processing
- **Status Indicators** - Success, warning, and error states with appropriate icons and colors
- **Federal Bank parser** - New parser for Federal Bank statements with support for:
  - Table-based extraction with multi-line narration handling
  - UPI transactions (extracts VPA/payee from `UPIOUT/<id>/<vpa>` format)
  - IFN transactions (Internal Funds Transfer with wallet categorization)
  - IMPS transactions (extracts recipient name)
  - Line-break hyphen removal for cleaner payee extraction
  - IFN wallet categories: Food, Fuel, Shopping, Medical, Transfer

### Fixed
- **Self-transfer detection logic** - Removed flawed name-based self-transfer detection (checked for "ATHUL" in payee name). TODO added for implementing proper self-transfer detection using account numbers, IFSC codes, or transaction patterns in a future stage
- **Date parsing in Canara Bank statements** - Updated `DATE_TIME_REGEX` to support both slash (`/`) and hyphen (`-`) date separators, fixing datetime extraction for Canara e-passbook PDFs that use `DD-MM-YYYY` format
- **Double normalization in Canara parser** - Removed redundant text normalization when determining transaction type; now uses `get_type()` from `payee_extractor.py` directly
- **Datetime tuple extraction** - Enhanced `extract_datetime_tuple()` to try multiple date format combinations (`DD/MM/YYYY`, `DD/MM/YY`, `DD-MM-YYYY`, `DD-MM-YY`)
- **Union Bank merchant mapping scope** - Moved "INDIAN" → "Zerodha" mapping from global `MERCHANT_MAPPINGS` to Union Bank parser only, preventing it from affecting other banks

## [0.2.0] - 2026-05-02

### Changed
- Stack migration from Streamlit to React + FastAPI architecture
- Backend refactored to modular structure with separate parsers for each bank
- Frontend updated to React with Vite

### Added
- FastAPI backend with CORS support for frontend integration
- `/api/banks` endpoint to list supported banks
- `/api/parse` endpoint for PDF statement parsing with password support
- `/api/export` endpoint for CSV export of parsed transactions
- Support for multiple bank statement parsers (Canara, HDFC, Union Bank)
- Payee extraction and transaction categorization
- Detailed logging for debugging PDF parsing

## [0.1.0] - 2026-05-01

### Added
- Initial project setup with Streamlit
- Basic PDF statement parsing functionality
- Support for Canara Bank e-passbook
- Transaction display and summary generation
