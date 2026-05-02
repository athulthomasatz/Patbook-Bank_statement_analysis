import logging
import re
from datetime import datetime

import pandas as pd

from utils.payee_extractor import extract_payee, extract_datetime_tuple, normalize

log = logging.getLogger("hdfc_parser")

DATE_RE = re.compile(r"^(\d{2}/\d{2}/\d{2})\s+(.*)")
AMOUNT_RE = re.compile(r"(\d[\d,]*\.\d{2})")


def parse(pdf) -> pd.DataFrame:
    """Parse HDFC Bank statement PDF using text extraction."""
    transactions = []
    skipped = 0

    log.info("HDFC Parser: Starting — %d page(s)", len(pdf.pages))

    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text()
        if not text:
            log.info("  Page %d: no text extracted", page_idx + 1)
            continue

        lines = text.split("\n")
        log.info("  Page %d: %d text lines", page_idx + 1, len(lines))

        # Extract opening balance from statement summary
        opening_match = re.search(r"OpeningBalance\s+([\d,.]+)", text)
        prev_balance = float(opening_match.group(1).replace(",", "")) if opening_match else 0.0
        log.info("  Opening balance: %.2f", prev_balance)

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            match = DATE_RE.match(line)

            if not match:
                i += 1
                continue

            date_str = match.group(1)
            rest = match.group(2)

            # Collect continuation line(s)
            narration_parts = [rest]
            while i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if not next_line:
                    break
                if DATE_RE.match(next_line):
                    break
                if any(kw in next_line.upper() for kw in ["STATEMENT", "OPENING", "CLOSING", "GENERATED", "SUMMARY"]):
                    break
                narration_parts.append(next_line)
                i += 1

            full_text = " ".join(narration_parts)

            # Extract all amounts (X,XXX.XX pattern) from the first line only
            amounts = AMOUNT_RE.findall(rest)

            if len(amounts) < 2:
                log.debug("    Line %d: SKIPPED — need >=2 amounts, got %d — '%s'", i, len(amounts), rest[:80])
                skipped += 1
                i += 1
                continue

            # Last amount = closing balance, second-to-last = transaction amount
            closing_balance = _amt(amounts[-1])
            txn_amount = _amt(amounts[-2])

            if txn_amount == 0:
                skipped += 1
                i += 1
                continue

            # Narration = everything before the first amount in 'rest'
            first_amt_pos = rest.find(amounts[0])
            raw_middle = rest[:first_amt_pos].strip()

            # Combine with continuation for full narration (for payee extraction)
            full_narration = raw_middle
            if len(narration_parts) > 1:
                full_narration += " " + " ".join(narration_parts[1:])

            # Parse date
            try:
                date = datetime.strptime(date_str, "%d/%m/%y").strftime("%Y-%m-%d")
            except ValueError:
                log.debug("    Line %d: date parse failed for '%s'", i, date_str)
                skipped += 1
                i += 1
                continue

            # Extract time if present
            txn_date_obj, txn_time_obj = extract_datetime_tuple(full_narration)
            txn_time = str(txn_time_obj) if txn_time_obj else ""

            # Determine debit/credit by balance comparison
            if closing_balance < prev_balance:
                txn_type = "Debit"
            elif closing_balance > prev_balance:
                txn_type = "Credit"
            else:
                # Fallback to narration keywords
                normalized = normalize(full_narration)
                if "DR" in normalized or "IMPS" in normalized:
                    txn_type = "Debit"
                else:
                    txn_type = "Credit"

            prev_balance = closing_balance

            payee, category = extract_payee(full_narration)

            log.debug("    OK — %s | %s | %s ₹%.2f | bal ₹%.2f", date, payee, txn_type, txn_amount, closing_balance)

            transactions.append({
                "Date": date,
                "Time": txn_time,
                "Payee": payee,
                "Category": category,
                "Type": txn_type,
                "Amount": txn_amount,
                "Balance": closing_balance,
                "Bank": "HDFC",
                "Narration": full_narration.strip(),
            })

            i += 1

    log.info("HDFC Parser: Done — %d transactions, %d skipped", len(transactions), skipped)

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


def _amt(val: str) -> float:
    val = val.replace(",", "").replace(" ", "").strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
