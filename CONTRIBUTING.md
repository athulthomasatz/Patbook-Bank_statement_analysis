# Contributing to Bank Statement Analyzer

Thanks for your interest in contributing! Here's how to get started.

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000. API docs at http://localhost:8000/docs.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173.

## How to Contribute

1. **Fork** the repository
2. Create a **feature branch** from `develop`: `git checkout -b feature/my-feature`
3. Make your changes
4. Ensure linting passes:
   - Frontend: `cd frontend && npm run lint`
   - Backend: `cd backend && pip install ruff && ruff check .`
5. **Commit** with a clear message
6. Open a **Pull Request** against `develop`

## Adding a New Bank Parser

See the [CLAUDE.md](./CLAUDE.md#adding-a-new-bank-parser) for step-by-step instructions.

Key points:
- Create `backend/parsers/<bank>.py` with a `parse(pdf)` function
- Return a DataFrame with columns: Date, Payee, Category, Type, Amount, Balance, Bank, Narration
- Register in `backend/parsers/__init__.py`
- The bank appears automatically in the frontend dropdown

## Reporting Issues

- **Bug reports**: Use the Bug Report template and include debug logs from the app
- **Feature requests**: Use the Feature Request template

## Code Style

- **Python**: Follow PEP 8 (enforced by ruff)
- **JavaScript/JSX**: Follow the existing ESLint config in the project

## Project Structure

```
project-root/
├── backend/          # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── parsers/      # Bank statement parsers
│   └── utils/        # PDF loading, payee extraction
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page-level components
│   │   └── analytics.js  # GA & Clarity integration
│   └── public/
├── .github/          # CI workflows, issue templates
├── CLAUDE.md         # Detailed project documentation
└── CONTRIBUTING.md   # This file
```
