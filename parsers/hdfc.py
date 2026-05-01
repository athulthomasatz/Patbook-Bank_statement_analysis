import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee

log = logging.getLogger("hdfc_parser")


def parse(pdf) -> pd.DataFrame:
    """Parse HDFC Bank statement PDF."""
    transactions = []
    skipped = 0

    log.info("HDFC Parser: Starting — %d page(s)", len(pdf.pages))

    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        log.info("  Page %d: %d table(s) extracted", page_idx + 1, len(tables))

        for table_idx, table in enumerate(tables):
            log.info("    Table %d: %d rows, %d cols", table_idx + 1, len(table), len(table[0]) if table else 0)

            for row_idx, row in enumerate(table):
                if not row or len(row) < 7:
                    log.debug("      Row %d: SKIPPED — empty or <7 cols (got %d)", row_idx, len(row) if row else 0)
                    skipped += 1
                    continue

                date_str = str(row[0] or "").strip()
                narration = str(row[1] or "").strip()
                withdrawal = str(row[4] or "").strip()
                deposit = str(row[5] or "").strip()
                balance = str(row[6] or "").strip()

                # Skip headers / summary rows
                skip_reason = None
                if date_str.lower() in ("date", ""):
                    skip_reason = "header row (date='date' or empty)"
                elif "opening" in date_str.lower():
                    skip_reason = "opening balance row"
                elif "closing" in date_str.lower():
                    skip_reason = "closing balance row"
                elif "balance" in date_str.lower():
                    skip_reason = "balance summary row"
                elif not re.match(r"\d{2}/\d{2}/\d{2}", date_str):
                    skip_reason = f"no valid date '{date_str}'"

                if skip_reason:
                    log.debug("      Row %d: SKIPPED — %s | raw: %s", row_idx, skip_reason, row[:3])
                    skipped += 1
                    continue

                try:
                    date = datetime.strptime(date_str, "%d/%m/%y").strftime("%Y-%m-%d")
                except ValueError:
                    log.debug("      Row %d: SKIPPED — date parse failed for '%s'", row_idx, date_str)
                    skipped += 1
                    continue

                # Debit or credit
                if withdrawal and withdrawal not in ("", "None", "-"):
                    txn_type = "Debit"
                    amount = _amt(withdrawal)
                elif deposit and deposit not in ("", "None", "-"):
                    txn_type = "Credit"
                    amount = _amt(deposit)
                else:
                    log.debug("      Row %d: SKIPPED — no withdrawal or deposit amount", row_idx)
                    skipped += 1
                    continue

                if amount == 0:
                    log.debug("      Row %d: SKIPPED — amount is 0", row_idx)
                    skipped += 1
                    continue

                closing = _amt(balance) if balance and balance not in ("", "None") else None
                payee, category = extract_payee(narration)

                log.debug("      Row %d: OK — %s | %s | %s ₹%.2f", row_idx, date, payee, txn_type, amount)

                transactions.append({
                    "Date": date,
                    "Payee": payee,
                    "Category": category,
                    "Type": txn_type,
                    "Amount": amount,
                    "Balance": closing,
                    "Bank": "HDFC",
                    "Narration": narration,
                })

    log.info("HDFC Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

    df = pd.DataFrame(transactions)
    if not df.empty:
        df = df.sort_values("Date").reset_index(drop=True)
    return df


def _amt(val: str) -> float:
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
