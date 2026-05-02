# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Date parsing in Canara Bank statements** - Updated `DATE_TIME_REGEX` to support both slash (`/`) and hyphen (`-`) date separators, fixing datetime extraction for Canara e-passbook PDFs that use `DD-MM-YYYY` format
- **Double normalization in Canara parser** - Removed redundant text normalization when determining transaction type; now uses `get_type()` from `payee_extractor.py` directly
- **Datetime tuple extraction** - Enhanced `extract_datetime_tuple()` to try multiple date format combinations (`DD/MM/YYYY`, `DD/MM/YY`, `DD-MM-YYYY`, `DD-MM-YY`)

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
