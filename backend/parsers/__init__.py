from parsers.hdfc import parse as parse_hdfc
from parsers.canara import parse as parse_canara
from parsers.union import parse as parse_union

PARSERS = {
    "HDFC": parse_hdfc,
    "Canara": parse_canara,
    "Union Bank": parse_union,
}


def get_parser(bank_name: str):
    return PARSERS.get(bank_name)
