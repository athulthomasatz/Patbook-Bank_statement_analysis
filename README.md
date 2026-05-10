# Patbook — Bank Statement Analyzer

Parse bank statement PDFs, extract transactions, and export them as CSV.

> This was initially built for personal use to make sense of my own bank statements. I'm putting it out here in case it helps someone else. It's not perfect — but it gets the job done.

## What it does

- Upload a password-protected bank statement PDF
- Automatically extracts transactions (date, payee, amount, balance, category)
- Filter, search, and edit transactions in the browser
- Export to CSV
- Analytics dashboard with spending breakdowns, charts, and insights

## Supported Banks

HDFC, Canara, Union Bank, Federal Bank, SBI, Kotak

> Adding a new bank? See [CLAUDE.md](CLAUDE.md) for parser implementation guide.

## Tech Stack

| Layer    | Tech                    |
|----------|-------------------------|
| Frontend | React + Vite + Recharts |
| Backend  | FastAPI + pdfplumber    |
| Deploy   | Cloudflare Pages + Render |

## Run Locally

**Backend** (port 8000):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Frontend (Cloudflare Pages / `.env`)
| Variable                   | Description                                |
|----------------------------|--------------------------------------------|
| `VITE_API_URL`             | Backend API URL (e.g. `https://your-backend.onrender.com/api`) |
| `VITE_GTM_ID`              | Google Tag Manager container ID            |
| `VITE_CLARITY_PROJECT_ID`  | Microsoft Clarity project ID               |

> Vite env vars are **baked in at build time** — changing them requires a redeploy.

### Backend (Render)
| Variable          | Description                                      |
|-------------------|--------------------------------------------------|
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs for CORS            |

## Deployment

- **Frontend**: Cloudflare Pages — root dir `frontend`, build `npm run build`, output `dist`
- **Backend**: Render — uses `render.yaml`, root dir `backend`

## Known Limitations

This project is under active development. You **will** encounter issues:

- **Parser errors** — Bank statement formats vary widely. Some statements may fail to parse or return incomplete data. If you get 0 transactions, try selecting a different bank or check the debug logs.
- **Payee extraction is imperfect** — Some transactions may show "Unknown" payee or wrong categories. UPI and NEFT payees are usually accurate; others depend on narration format.
- **PDF compatibility** — Not all PDF layouts are handled. Encrypted PDFs with non-standard encryption may fail.
- **Balance tracking** — Running balance may be inaccurate if the parser misses rows.
- **Analytics data** — Charts are only as good as the parsed data. Garbage in, garbage out.

If something breaks, open an issue with the bank name and a screenshot of the debug logs.

## License

[MIT](LICENSE)
