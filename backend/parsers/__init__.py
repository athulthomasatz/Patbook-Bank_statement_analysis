from parsers.hdfc import parse as parse_hdfc
from parsers.canara import parse as parse_canara
from parsers.union import parse as parse_union
from parsers.federal import parse as parse_federal
from parsers.sbi import parse as parse_sbi
from parsers.kotak import parse as parse_kotak
from parsers.pnb import parse as parse_pnb
from parsers.kgb import parse as parse_kgb

PARSERS = {
    "HDFC": parse_hdfc,
    "Canara": parse_canara,
    "Union Bank": parse_union,
    "Federal Bank": parse_federal,
    "SBI": parse_sbi,
    "Kotak": parse_kotak,
    "PNB": parse_pnb,
    "Kerala Gramin Bank": parse_kgb,
}


def get_parser(bank_name: str):
    return PARSERS.get(bank_name)
