import csv
import io
import logging
import tempfile
import os

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from utils.pdf_loader import load_pdf
from parsers import get_parser, PARSERS

logging.basicConfig(level=logging.DEBUG, format='%(name)s - %(levelname)s - %(message)s')
log = logging.getLogger("api")

app = FastAPI(title="Bank Statement Analyzer")

# CORS: use ALLOWED_ORIGINS env var in production, fallback to localhost for dev
_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/banks")
def list_banks():
    return list(PARSERS.keys())


@app.post("/api/parse")
async def parse_statement(
    file: UploadFile = File(...),
    bank: str = Form(...),
    password: str = Form(""),
):
    if bank not in PARSERS:
        raise HTTPException(400, f"Unsupported bank: {bank}")

    logs = []
    logs.append(f"File: {file.filename} ({file.size} bytes)")
    logs.append(f"Bank: {bank}")
    logs.append(f"Password: {'yes' if password else 'no'}")

    tmp_path = None
    decrypted_path = None

    try:
        # Save uploaded file to temp
        content = await file.read()
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        logs.append(f"Step 1: Saved PDF ({len(content)} bytes)")

        # Load PDF (handles decryption)
        class FileProxy:
            def __init__(self, path):
                self.path = path
            def read(self):
                with open(self.path, "rb") as f:
                    return f.read()

        pdf = load_pdf(FileProxy(tmp_path), password if password else None)
        logs.append(f"Step 2: PDF loaded — {len(pdf.pages)} page(s)")

        # Extract debug info from pages
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            tables = page.extract_tables()
            logs.append(f"  Page {i+1}: {len(tables)} table(s), {len(text) if text else 0} chars text")

        # Parse
        parser = get_parser(bank)
        df = parser(pdf)
        logs.append(f"Step 3: Parser returned {len(df)} transactions")
        pdf.close()

        if df.empty:
            return {
                "transactions": [],
                "summary": {"count": 0, "credits": 0, "debits": 0, "net": 0},
                "logs": logs,
            }

        # Convert to records
        transactions = df.to_dict(orient="records")
        # Convert NaN/None to null-friendly values
        for t in transactions:
            for k, v in t.items():
                if isinstance(v, float) and (v != v):  # NaN check
                    t[k] = None
                if v is None:
                    t[k] = None

        credits = df[df["Type"] == "Credit"]["Amount"].sum()
        debits = df[df["Type"] == "Debit"]["Amount"].sum()

        return {
            "transactions": transactions,
            "summary": {
                "count": len(df),
                "credits": round(float(credits), 2),
                "debits": round(float(debits), 2),
                "net": round(float(credits - debits), 2),
            },
            "logs": logs,
        }

    except ValueError as e:
        logs.append(f"ERROR: {e}")
        raise HTTPException(400, str(e))
    except Exception as e:
        logs.append(f"ERROR: {type(e).__name__}: {e}")
        raise HTTPException(500, f"Processing error: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        if decrypted_path and os.path.exists(decrypted_path):
            os.unlink(decrypted_path)


@app.post("/api/export")
async def export_csv(transactions: list[dict]):
    if not transactions:
        raise HTTPException(400, "No transactions to export")

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["Date", "Payee", "Category", "Type", "Amount", "Balance", "Bank", "Narration"],
    )
    writer.writeheader()
    for t in transactions:
        writer.writerow({
            "Date": t.get("Date", ""),
            "Payee": t.get("Payee", ""),
            "Category": t.get("Category", ""),
            "Type": t.get("Type", ""),
            "Amount": t.get("Amount", ""),
            "Balance": t.get("Balance", ""),
            "Bank": t.get("Bank", ""),
            "Narration": t.get("Narration", ""),
        })

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
