from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import (
    FavoriteIn,
    FavoriteOut,
    LoginIn,
    ProfileUpdate,
    RegisterIn,
    TokenOut,
    UserOut,
)
from app.services import users as svc

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    if svc.get_by_identifier(db, body.email) or svc.get_by_identifier(db, body.username):
        raise HTTPException(status_code=409, detail="Email or username already registered")
    user = svc.create_user(db, body.email, body.username, body.password, body.display_name)
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = svc.authenticate(db, body.identifier, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/username or password")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    svc.update_profile(db, user, body.display_name, body.theme)
    return UserOut.model_validate(user)


@router.get("/favorites", response_model=list[FavoriteOut])
def list_favorites(user: User = Depends(get_current_user)) -> list[FavoriteOut]:
    return [FavoriteOut.model_validate(f) for f in user.favorites]


@router.post("/favorites", response_model=list[FavoriteOut], status_code=201)
def add_favorite(
    body: FavoriteIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FavoriteOut]:
    svc.add_favorite(db, user, body.entity_type, body.entity_ref)
    db.refresh(user)
    return [FavoriteOut.model_validate(f) for f in user.favorites]


@router.delete("/favorites", response_model=list[FavoriteOut])
def remove_favorite(
    entity_type: str,
    entity_ref: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FavoriteOut]:
    svc.remove_favorite(db, user, entity_type, entity_ref)
    db.refresh(user)
    return [FavoriteOut.model_validate(f) for f in user.favorites]
