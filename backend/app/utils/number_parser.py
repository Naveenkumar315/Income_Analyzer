# app/utils/number_parser.py

def parse_number(value):
    """
    Safely parse numbers from strings like '23,000.00'
    """
    if value is None:
        return 0.0

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        value = value.replace(",", "").strip()

    try:
        return float(value)
    except Exception:
        return 0.0
