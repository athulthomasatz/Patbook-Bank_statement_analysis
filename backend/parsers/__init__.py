from parsers.hdfc import parse as parse_hdfc
from parsers.canara import parse as parse_canara
from parsers.union import parse as parse_union
from parsers.federal import parse as parse_federal
from parsers.sbi import parse as parse_sbi

PARSERS = {
    "HDFC": parse_hdfc,
    "Canara": parse_canara,
    "Union Bank": parse_union,
    "Federal Bank": parse_federal,
    "SBI": parse_sbi,
}


def get_parser(bank_name: str):
    return PARSERS.get(bank_name)
