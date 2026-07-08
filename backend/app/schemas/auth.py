import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class FavoriteOut(BaseModel):
    entity_type: str
    entity_ref: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    display_name: str | None
    theme: str
    created_at: datetime
    favorites: list[FavoriteOut] = []

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterIn(BaseModel):
    email: str = Field(max_length=255)
    username: str = Field(min_length=3, max_length=40, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=80)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("invalid email address")
        return v


class LoginIn(BaseModel):
    identifier: str = Field(description="email or username")
    password: str


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=80)
    theme: str | None = Field(default=None, pattern=r"^(dark|light)$")


class FavoriteIn(BaseModel):
    entity_type: str = Field(pattern=r"^(driver|constructor|circuit)$")
    entity_ref: str = Field(max_length=64)
