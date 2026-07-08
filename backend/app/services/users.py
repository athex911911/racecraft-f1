"""Account persistence: register, authenticate, profile + favorites."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserFavorite


def get_by_identifier(db: Session, identifier: str) -> User | None:
    ident = identifier.strip()
    return db.scalar(
        select(User).where((User.email == ident.lower()) | (User.username == ident))
    )


def create_user(
    db: Session, email: str, username: str, password: str, display_name: str | None
) -> User:
    user = User(
        email=email.lower(),
        username=username,
        hashed_password=hash_password(password),
        display_name=display_name or username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, identifier: str, password: str) -> User | None:
    user = get_by_identifier(db, identifier)
    if user and verify_password(password, user.hashed_password):
        return user
    return None


def update_profile(
    db: Session, user: User, display_name: str | None, theme: str | None
) -> User:
    if display_name is not None:
        user.display_name = display_name
    if theme is not None:
        user.theme = theme
    db.commit()
    db.refresh(user)
    return user


def add_favorite(db: Session, user: User, entity_type: str, entity_ref: str) -> None:
    exists = db.scalar(
        select(UserFavorite).where(
            UserFavorite.user_id == user.id,
            UserFavorite.entity_type == entity_type,
            UserFavorite.entity_ref == entity_ref,
        )
    )
    if not exists:
        db.add(UserFavorite(user_id=user.id, entity_type=entity_type, entity_ref=entity_ref))
        db.commit()


def remove_favorite(db: Session, user: User, entity_type: str, entity_ref: str) -> None:
    db.query(UserFavorite).filter_by(
        user_id=user.id, entity_type=entity_type, entity_ref=entity_ref
    ).delete()
    db.commit()
