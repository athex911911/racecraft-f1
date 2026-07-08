from jose import jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password


def test_hash_is_not_plaintext_and_verifies():
    h = hash_password("racecar2026")
    assert h != "racecar2026"
    assert verify_password("racecar2026", h)
    assert not verify_password("wrong-password", h)


def test_password_over_72_bytes_does_not_raise():
    # bcrypt hard-caps at 72 bytes; hashing a long password must not blow up.
    pw = "a" * 200
    assert verify_password(pw, hash_password(pw))


def test_access_token_round_trips():
    settings = get_settings()
    token = create_access_token(42)
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["sub"] == "42"
    assert "exp" in payload
