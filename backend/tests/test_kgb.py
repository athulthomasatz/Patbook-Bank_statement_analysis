"""Unit tests for Kerala Gramin Bank (KGB) parser."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from parsers.kgb import (
    _is_kgb_date,
    _parse_kgb_date,
    _amt,
    _extract_kgb_payee_category,
    _detect_type_from_narration,
    _process_row_data,
)


class TestKgbDateValidator:
    def test_valid_date(self):
        assert _is_kgb_date("03-03-2026") is True
        assert _is_kgb_date("29-03-2026") is True
        assert _is_kgb_date("01-01-2024") is True
        assert _is_kgb_date("31-12-1999") is True

    def test_invalid_date(self):
        assert _is_kgb_date("32-04-2025") is False  # invalid day
        assert _is_kgb_date("15-13-2025") is False  # invalid month
        assert _is_kgb_date("2025-04-15") is False  # wrong format
        assert _is_kgb_date("15/04/2025") is False  # slash separator
        assert _is_kgb_date("") is False
        assert _is_kgb_date("Date") is False
        assert _is_kgb_date("opening balance") is False


class TestParseKgbDate:
    def test_parse_valid(self):
        assert _parse_kgb_date("03-03-2026") == "2026-03-03"
        assert _parse_kgb_date("29-03-2026") == "2026-03-29"
        assert _parse_kgb_date("01-01-2024") == "2024-01-01"

    def test_parse_invalid_raises(self):
        with pytest.raises(ValueError):
            _parse_kgb_date("not-a-date")


class TestAmountParsing:
    def test_simple_amount(self):
        assert _amt("3,850.00") == 3850.0
        assert _amt("50,000.00") == 50000.0
        assert _amt("0.00") == 0.0
        assert _amt("15.00") == 15.0

    def test_empty_and_garbage(self):
        assert _amt("") == 0.0
        assert _amt("None") == 0.0
        assert _amt("-") == 0.0


class TestDetectTypeFromNarration:
    def test_upi_debit(self):
        assert _detect_type_from_narration("UPI/642891452932/Dr/terjohr") == "Debit"
        assert _detect_type_from_narration("UPI/123456789012/Dr/CHARLES") == "Debit"

    def test_upi_credit(self):
        assert _detect_type_from_narration("UPI/123456789012/Cr/ANCY MATH") == "Credit"
        assert _detect_type_from_narration("UPI/999888777666/Cr/Teresa") == "Credit"

    def test_cr_for_utr(self):
        assert _detect_type_from_narration("Cr.for UTR:SBIN326072183931") == "Credit"
        assert _detect_type_from_narration("Cr.for NEFT:REF123") == "Credit"

    def test_interest(self):
        assert _detect_type_from_narration("402771:X:Int.Pd:01-02-2026 to 29-03-2026") == "Credit"

    def test_mob_defaults_credit(self):
        assert _detect_type_from_narration("MOB/608613167720/TERESA J") == "Credit"

    def test_unknown(self):
        assert _detect_type_from_narration("SOME RANDOM TEXT") is None


class TestExtractKgbPayeeCategory:
    def test_upi_debit(self):
        payee, category = _extract_kgb_payee_category(
            "UPI/642891452932/Dr/terjohr", "Debit"
        )
        assert payee == "Terjohr"
        assert category == "UPI"

    def test_upi_debit_with_handle(self):
        payee, category = _extract_kgb_payee_category(
            "UPI/642891452932/Dr/terjohr@ybl", "Debit"
        )
        assert payee == "Terjohr"
        assert category == "UPI"

    def test_upi_credit(self):
        payee, category = _extract_kgb_payee_category(
            "UPI/123456789012/Cr/ANCY MATH", "Credit"
        )
        assert payee == "Ancy Math"
        assert category == "UPI"

    def test_cr_for_utr_with_company(self):
        payee, category = _extract_kgb_payee_category(
            "Cr.for UTR:SBIN326072183931 INDEL MONEY LIMITED", "Credit"
        )
        assert payee == "Indel Money Limited"
        assert category == "NEFT/RTGS"

    def test_cr_for_utr_alone(self):
        payee, category = _extract_kgb_payee_category(
            "Cr.for UTR:SBIN326072183931", "Credit"
        )
        assert payee == "NEFT/RTGS Credit"
        assert category == "NEFT/RTGS"

    def test_mob(self):
        payee, category = _extract_kgb_payee_category(
            "MOB/608613167720/TERESA J", "Credit"
        )
        assert payee == "Teresa J"
        assert category == "Mobile Banking"

    def test_interest(self):
        payee, category = _extract_kgb_payee_category(
            "402771:X:Int.Pd:01-02-2026 to 29-03-2026", "Credit"
        )
        assert payee == "Bank Interest"
        assert category == "Interest"

    def test_empty_narration(self):
        payee, category = _extract_kgb_payee_category("", "Debit")
        assert payee == "Unknown"
        assert category == "Other"


class TestProcessRowData:
    def test_debit_row_upi(self):
        result = _process_row_data({
            "date": "03-03-2026",
            "narration": "UPI/642891452932/Dr/terjohr",
            "amount": "3,850.00",
            "debit": "",
            "credit": "",
            "balance": "1,970.73",
            "has_separate_cols": False,
        })
        assert result is not None
        assert result["Date"] == "2026-03-03"
        assert result["Type"] == "Debit"
        assert result["Amount"] == 3850.0
        assert result["Balance"] == 1970.73
        assert result["Bank"] == "Kerala Gramin Bank"
        assert result["Payee"] == "Terjohr"
        assert result["Category"] == "UPI"

    def test_credit_row_upi(self):
        result = _process_row_data({
            "date": "03-03-2026",
            "narration": "UPI/123456789012/Cr/ANCY MATH",
            "amount": "250.00",
            "debit": "",
            "credit": "",
            "balance": "1,250.73",
            "has_separate_cols": False,
        })
        assert result is not None
        assert result["Date"] == "2026-03-03"
        assert result["Type"] == "Credit"
        assert result["Amount"] == 250.0
        assert result["Payee"] == "Ancy Math"

    def test_credit_row_cr_for_utr(self):
        result = _process_row_data({
            "date": "13-03-2026",
            "narration": "Cr.for UTR:SBIN326072183931 INDEL MONEY LIMITED",
            "amount": "777.00",
            "debit": "",
            "credit": "",
            "balance": "6,689.73",
            "has_separate_cols": False,
        })
        assert result is not None
        assert result["Date"] == "2026-03-13"
        assert result["Type"] == "Credit"
        assert result["Amount"] == 777.0
        assert result["Payee"] == "Indel Money Limited"
        assert result["Category"] == "NEFT/RTGS"

    def test_credit_row_mob(self):
        result = _process_row_data({
            "date": "27-03-2026",
            "narration": "MOB/608613167720/TERESA J",
            "amount": "1,000.00",
            "debit": "",
            "credit": "",
            "balance": "7,171.58",
            "has_separate_cols": False,
        })
        assert result is not None
        assert result["Type"] == "Credit"
        assert result["Amount"] == 1000.0
        assert result["Payee"] == "Teresa J"
        assert result["Category"] == "Mobile Banking"

    def test_credit_row_interest(self):
        result = _process_row_data({
            "date": "30-03-2026",
            "narration": "402771:X:Int.Pd:01-02-2026 to 29-03-2026",
            "amount": "15.00",
            "debit": "",
            "credit": "",
            "balance": "7,686.58",
            "has_separate_cols": False,
        })
        assert result is not None
        assert result["Type"] == "Credit"
        assert result["Amount"] == 15.0
        assert result["Payee"] == "Bank Interest"
        assert result["Category"] == "Interest"

    def test_separate_debit_credit_columns(self):
        result = _process_row_data({
            "date": "03-03-2026",
            "narration": "UPI/642891452932/Dr/terjohr",
            "amount": "3,850.00",
            "debit": "3,850.00",
            "credit": "",
            "balance": "1,970.73",
            "has_separate_cols": True,
        })
        assert result is not None
        assert result["Type"] == "Debit"
        assert result["Amount"] == 3850.0

    def test_skip_header(self):
        assert _process_row_data({
            "date": "Date",
            "narration": "Particulars",
            "amount": "",
            "debit": "",
            "credit": "",
            "balance": "",
            "has_separate_cols": False,
        }) is None

    def test_skip_zero_amount(self):
        assert _process_row_data({
            "date": "03-03-2026",
            "narration": "UPI/642891452932/Dr/terjohr",
            "amount": "0.00",
            "debit": "",
            "credit": "",
            "balance": "1,970.73",
            "has_separate_cols": False,
        }) is None

    def test_skip_invalid_date(self):
        assert _process_row_data({
            "date": "not-a-date",
            "narration": "Something",
            "amount": "100.00",
            "debit": "",
            "credit": "",
            "balance": "500.00",
            "has_separate_cols": False,
        }) is None
