from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import ConstructorDetailOut, ConstructorListItem
from app.services import constructors as svc

router = APIRouter(prefix="/api/v1/constructors", tags=["constructors"])


@router.get("", response_model=list[ConstructorListItem])
def list_constructors(
    season: str = Query("current", description="'current', 'all', or a year"),
    search: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[ConstructorListItem]:
    return svc.constructor_list(db, season, search, limit)


@router.get("/{constructor_ref}", response_model=ConstructorDetailOut)
def get_constructor(constructor_ref: str, db: Session = Depends(get_db)) -> ConstructorDetailOut:
    detail = svc.constructor_detail(db, constructor_ref)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Constructor '{constructor_ref}' not found")
    return detail
