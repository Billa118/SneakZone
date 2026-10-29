import re

from email_validator import EmailNotValidError, validate_email


MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
PIN_RE = re.compile(r"^[1-9][0-9]{5}$")


def is_valid_mobile(mobile: str) -> bool:
    return bool(mobile and MOBILE_RE.match(mobile.strip()))


def is_valid_pin(pin: str) -> bool:
    return bool(pin and PIN_RE.match(pin.strip()))


def is_valid_email(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def require_fields(data: dict, fields: list[str]) -> list[str]:
    missing = []
    for field in fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(field)
    return missing
