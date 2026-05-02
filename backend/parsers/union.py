import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple

log = logging.getLogger("union_parser")


def parse(pdf) -> pd.DataFrame:
    """Parse Union Bank of India statement PDF."""
    transactions = []
    skipped = 0

    log.info("Union Bank Parser: Starting — %d page(s)", len(pdf.pages))

    for page_idx, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        log.info("  Page %d: %d table(s) extracted", page_idx + 1, len(tables))

        for table_idx, table in enumerate(tables):
            log.info("    Table %d: %d rows, %d cols", table_idx + 1, len(table), len(table[0]) if table else 0)

            for row_idx, row in enumerate(table):
                if not row or len(row) < 5:
                    log.debug("      Row %d: SKIPPED — empty or <5 cols (got %d)", row_idx, len(row) if row else 0)
                    skipped += 1
                    continue

                date_str = str(row[0] or "").strip()
                remarks = str(row[2] or "").strip()
                amount_str = str(row[3] or "").strip()
                balance_str = str(row[4] or "").strip()

                skip_reason = None
                if date_str.lower() in ("date", ""):
                    skip_reason = "header or empty date"
                elif "opening" in date_str.lower():
                    skip_reason = "opening balance"
                elif "closing" in date_str.lower():
                    skip_reason = "closing balance"
                elif not re.match(r"\d{2}-\d{2}-\d{4}", date_str):
                    skip_reason = f"no valid date '{date_str}'"

                if skip_reason:
                    log.debug("      Row %d: SKIPPED — %s | raw: %s", row_idx, skip_reason, row[:3])
                    skipped += 1
                    continue

                try:
                    date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
                except ValueError:
                    log.debug("      Row %d: SKIPPED — date parse failed for '%s'", row_idx, date_str)
                    skipped += 1
                    continue

                txn_type, amount = _parse_amount(amount_str)
                if amount == 0:
                    log.debug("      Row %d: SKIPPED — amount is 0 (raw: '%s')", row_idx, amount_str)
                    skipped += 1
                    continue

                closing = _parse_balance(balance_str)

                # Extract time
                txn_date_obj, txn_time_obj = extract_datetime_tuple(remarks)
                txn_time = str(txn_time_obj) if txn_time_obj else ""

                payee, category = extract_payee(remarks)

                # Union Bank-specific mappings
                if payee == "INDIAN":
                    payee = "Zerodha"
                    category = "MF Mutual Funds"

                log.debug("      Row %d: OK — %s | %s | %s ₹%.2f", row_idx, date, payee, txn_type, amount)

                transactions.append({
                    "Date": date,
                    "Time": txn_time,
                    "Payee": payee,
                    "Category": category,
                    "Type": txn_type,
                    "Amount": amount,
                    "Balance": closing,
                    "Bank": "Union Bank",
                    "Narration": remarks,
                })

    log.info("Union Bank Parser: Done — %d transactions, %d rows skipped", len(transactions), skipped)

    df = pd.DataFrame(transactions)
    if not df.empty:
        # Convert empty Time strings to '00:00:00' for proper datetime parsing
        df["Time"] = df["Time"].replace("", "00:00:00").fillna("00:00:00")

        # Sort by Date and Time
        df["DateTime"] = pd.to_datetime(
            df["Date"] + " " + df["Time"],
            format="%Y-%m-%d %H:%M:%S",
            errors="coerce"
        )
        df = df.sort_values("DateTime").reset_index(drop=True).drop(columns=["DateTime"])

        # Drop Time column after sorting
        if "Time" in df.columns:
            df = df.drop(columns=["Time"])

    return df


def _parse_amount(val: str) -> tuple[str, float]:
    val = val.replace(",", "").strip()
    dr = re.match(r"([\d.]+)\s*\(Dr\)", val)
    cr = re.match(r"([\d.]+)\s*\(Cr\)", val)
    if dr:
        return ("Debit", float(dr.group(1)))
    if cr:
        return ("Credit", float(cr.group(1)))
    try:
        return ("Unknown", float(val))
    except ValueError:
        return ("Unknown", 0.0)


def _parse_balance(val: str):
    val = val.replace(",", "").strip()
    val = re.sub(r"\s*\(Dr\)|\s*\(Cr\)", "", val)
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
