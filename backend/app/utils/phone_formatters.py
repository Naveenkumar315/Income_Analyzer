def format_us_phone(phone: str) -> str:
    if not phone:
        return ""
    digits = "".join(filter(str.isdigit, phone))
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone
