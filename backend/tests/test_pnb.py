"""Unit tests for Punjab National Bank (PNB) parser."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from parsers.pnb import (
    _is_valid_date,
    _parse_date,
    _amt,
    _extract_pnb_payee_category,
    _process_row_data,
)


class TestPnbDateValidator:
    def test_valid_date(self):
        assert _is_valid_date("11/05/2026") is True
        assert _is_valid_date("01/01/2024") is True
        assert _is_valid_date("31/12/1999") is True

    def test_invalid_date(self):
        assert _is_valid_date("32/04/2025") is False
        assert _is_valid_date("15/13/2025") is False
        assert _is_valid_date("2025-04-15") is False
        assert _is_valid_date("") is False
        assert _is_valid_date("Date") is False


class TestParsePnbDate:
    def test_parse_valid(self):
        assert _parse_date("11/05/2026") == "2026-05-11"
        assert _parse_date("01/01/2024") == "2024-01-01"

    def test_parse_invalid_raises(self):
        with pytest.raises(ValueError):
            _parse_date("not-a-date")


class TestAmountParsing:
    def test_simple_amount(self):
        assert _amt("1,250.0") == 1250.0
        assert _amt("60,000.0") == 60000.0
        assert _amt("0.0") == 0.0

    def test_empty_and_garbage(self):
        assert _amt("") == 0.0
        assert _amt("None") == 0.0


class TestExtractPnbPayeeCategory:
    def test_upi_debit_paytm(self):
        payee, category = _extract_pnb_payee_category(
            "UPI/DR/625303764931/VIVEKANA/YESB/paytm.s20q3fx@p/U", "Debit"
        )
        assert payee == "Vivekana"
        assert category == "UPI Paytm"

    def test_upi_debit_amazon(self):
        payee, category = _extract_pnb_payee_category(
            "UPI/DR/122949543932/BINULAL/CNRB/amzn0007342417@/U", "Debit"
        )
        assert payee == "Binulal"
        assert category == "UPI Amazon Pay"

    def test_upi_credit(self):
        payee, category = _extract_pnb_payee_category(
            "UPI/CR/123456789012/SENDER/HDFC/sender@okhdfcbank/U", "Credit"
        )
        assert category == "UPI Received"

    def test_imps_in(self):
        payee, category = _extract_pnb_payee_category(
            "IMPS-IN/604011559323/9961477761/ETHER GA", "Credit"
        )
        assert payee == "Ether Ga"
        assert category == "IMPS Received"

    def test_imps_out(self):
        payee, category = _extract_pnb_payee_category(
            "IMPS-OUT/604011559323/9961477761/RECIPIENT", "Debit"
        )
        assert payee == "Recipient"
        assert category == "IMPS Transfer"

    def test_neft_in(self):
        payee, category = _extract_pnb_payee_category(
            "NEFT-IN/ABCD123456/SALARY CREDIT", "Credit"
        )
        assert category == "NEFT Received"

    def test_neft_out(self):
        payee, category = _extract_pnb_payee_category(
            "NEFT-OUT/ABCD123456/RENT PAYMENT", "Debit"
        )
        assert category == "NEFT Transfer"

    def test_rtgs(self):
        payee, category = _extract_pnb_payee_category(
            "RTGS-OUT/REF123/VENDOR PAYMENT", "Debit"
        )
        assert category == "RTGS Transfer"

    def test_cash_deposit(self):
        payee, category = _extract_pnb_payee_category(
            "CASH DEPOSIT SELF", "Credit"
        )
        assert payee == "Cash Deposit"
        assert category == "Cash"

    def test_interest(self):
        payee, category = _extract_pnb_payee_category(
            "INTEREST CREDIT", "Credit"
        )
        assert payee == "Interest Credit"
        assert category == "Interest"

    def test_charges(self):
        payee, category = _extract_pnb_payee_category(
            "ATM CHARGES", "Debit"
        )
        assert payee == "Bank Charges"
        assert category == "Charges"


class TestProcessRowData:
    def test_debit_row(self):
        result = _process_row_data({
            "date": "11/05/2026",
            "instrument_id": "",
            "amount": "250.0",
            "txn_type_code": "DR",
            "balance": "9750.0",
            "remarks": "UPI/DR/625303764931/VIVEKANA/YESB/paytm.s20q3fx@p/U",
        })
        assert result is not None
        assert result["Date"] == "2026-05-11"
        assert result["Type"] == "Debit"
        assert result["Amount"] == 250.0
        assert result["Balance"] == 9750.0
        assert result["Bank"] == "PNB"
        assert result["Payee"] == "Vivekana"

    def test_credit_row(self):
        result = _process_row_data({
            "date": "09/02/2026",
            "instrument_id": "",
            "amount": "60000.0",
            "txn_type_code": "CR",
            "balance": "125000.0",
            "remarks": "IMPS-IN/604011559323/9961477761/ETHER GA",
        })
        assert result is not None
        assert result["Date"] == "2026-02-09"
        assert result["Type"] == "Credit"
        assert result["Amount"] == 60000.0
        assert result["Payee"] == "Ether Ga"

    def test_skip_header(self):
        assert _process_row_data({
            "date": "Date",
            "instrument_id": "",
            "amount": "",
            "txn_type_code": "",
            "balance": "",
            "remarks": "",
        }) is None

    def test_skip_zero_amount(self):
        assert _process_row_data({
            "date": "11/05/2026",
            "instrument_id": "",
            "amount": "0.0",
            "txn_type_code": "DR",
            "balance": "10000.0",
            "remarks": "UPI/DR/123/VIVEK/YESB/test@p/U",
        }) is None

    def test_skip_invalid_type(self):
        assert _process_row_data({
            "date": "11/05/2026",
            "instrument_id": "",
            "amount": "100.0",
            "txn_type_code": "XX",
            "balance": "10000.0",
            "remarks": "SOMETHING",
        }) is None

    def test_cheque_row(self):
        result = _process_row_data({
            "date": "11/05/2026",
            "instrument_id": "123456",
            "amount": "5000.0",
            "txn_type_code": "DR",
            "balance": "5000.0",
            "remarks": "CHEQUE PAYMENT",
        })
        assert result is not None
        assert result["Payee"] == "Cheque 123456"
        assert result["Category"] == "Cheque"
