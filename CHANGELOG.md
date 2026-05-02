# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Analytics Dashboard** - New visual analytics view with interactive charts:
  - Financial Overview cards showing Total Debit, Total Credit, and Net Balance
  - Spending by Category pie chart (top 10 categories with percentages)
  - Debit vs Credit donut chart
  - Transactions by Date bar chart (last 14 days)
  - Spending by Payment Method pie chart (UPI, IMPS, IFN, ATM, NEFT, etc.)
  - Navigation tabs to switch between Transactions and Analytics views
- **Federal Bank parser** - New parser for Federal Bank statements with support for:
  - Table-based extraction with multi-line narration handling
  - UPI transactions (extracts VPA/payee from `UPIOUT/<id>/<vpa>` format)
  - IFN transactions (Internal Funds Transfer with wallet categorization)
  - IMPS transactions (extracts recipient name)
  - Line-break hyphen removal for cleaner payee extraction
  - IFN wallet categories: Food, Fuel, Shopping, Medical, Transfer

### Fixed
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
