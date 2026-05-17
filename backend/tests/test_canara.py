"""Unit tests for Canara Bank parser."""

import pytest
import sys
from pathlib import Path

# Ensure backend is on path
sys.path.insert(0, str(Path(__file__).parent.parent))

from parsers.canara import (
    _is_canara_date,
    _parse_canara_date,
    _process_row,
    _amt,
)


class TestCanaraDateValidator:
    def test_valid_date(self):
        assert _is_canara_date("15-04-2025") is True
        assert _is_canara_date("01-01-2024") is True
        assert _is_canara_date("31-12-1999") is True

    def test_invalid_date(self):
        assert _is_canara_date("32-04-2025") is False  # invalid day
        assert _is_canara_date("15-13-2025") is False  # invalid month
        assert _is_canara_date("2025-04-15") is False  # wrong format
        assert _is_canara_date("15/04/2025") is False  # slash separator
        assert _is_canara_date("") is False
        assert _is_canara_date("Date") is False
        assert _is_canara_date("opening balance") is False


class TestParseCanaraDate:
    def test_parse_valid(self):
        assert _parse_canara_date("15-04-2025") == "2025-04-15"
        assert _parse_canara_date("01-01-2024") == "2024-01-01"

    def test_parse_invalid_raises(self):
        with pytest.raises(ValueError):
            _parse_canara_date("not-a-date")


class TestProcessRow:
    def test_debit_row(self):
        result = _process_row(
            "15-04-2025",
            "UPI/DR/123456789/SWIGGY/HDFC/OKHDFC",
            "",
            "250.00",
            "9,750.00",
        )
        assert result is not None
        assert result["Date"] == "2025-04-15"
        assert result["Type"] == "Debit"
        assert result["Amount"] == 250.0
        assert result["Balance"] == 9750.0
        assert result["Bank"] == "Canara"

    def test_credit_row(self):
        result = _process_row(
            "10-04-2025",
            "NEFT/CR/SALARY",
            "50,000.00",
            "",
            "59,750.00",
        )
        assert result is not None
        assert result["Date"] == "2025-04-10"
        assert result["Type"] == "Credit"
        assert result["Amount"] == 50000.0

    def test_skip_header(self):
        assert _process_row("Date", "Particulars", "Deposits", "Withdrawals", "Balance") is None

    def test_skip_empty_date(self):
        assert _process_row("", "Something", "100.00", "", "500.00") is None

    def test_skip_zero_amount(self):
        assert _process_row("15-04-2025", "No amount", "0.00", "0.00", "500.00") is None

    def test_skip_invalid_date(self):
        assert _process_row("not-a-date", "Something", "100.00", "", "500.00") is None

    def test_skip_opening_balance(self):
        assert _process_row("Opening Balance", "", "", "", "500.00") is None


class TestAmountParsing:
    def test_simple_amount(self):
        assert _amt("1,250.00") == 1250.0
        assert _amt("50,000.00") == 50000.0
        assert _amt("0.00") == 0.0

    def test_empty_and_garbage(self):
        assert _amt("") == 0.0
        assert _amt("None") == 0.0
        assert _amt("-") == 0.0


class TestAmountExtractionEdgeCases:
    """Simulate the text-mode amount extraction logic without a full PDF."""

    def test_two_amounts(self):
        """Standard case: narration + txn amount + balance."""
        amounts = ["250.00", "9750.00"]
        closing = _amt(amounts[-1])
        txn_amount = 0.0
        for amt_str in reversed(amounts[:-1]):
            candidate = _amt(amt_str)
            if candidate > 0:
                txn_amount = candidate
                break
        assert closing == 9750.0
        assert txn_amount == 250.0

    def test_three_amounts_extra_fee(self):
        """Line with fee + txn amount + balance."""
        amounts = ["10.00", "250.00", "9740.00"]
        closing = _amt(amounts[-1])
        txn_amount = 0.0
        for amt_str in reversed(amounts[:-1]):
            candidate = _amt(amt_str)
            if candidate > 0:
                txn_amount = candidate
                break
        # Should pick the first non-zero from the right (excluding balance)
        assert closing == 9740.0
        assert txn_amount == 250.0

    def test_four_amounts(self):
        """Multiple reference numbers + txn + balance."""
        amounts = ["12.50", "18.00", "500.00", "9500.00"]
        closing = _amt(amounts[-1])
        txn_amount = 0.0
        for amt_str in reversed(amounts[:-1]):
            candidate = _amt(amt_str)
            if candidate > 0:
                txn_amount = candidate
                break
        assert closing == 9500.0
        assert txn_amount == 500.0
