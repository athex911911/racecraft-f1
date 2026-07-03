from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import DriverDetailOut, DriverListItem
from app.services import drivers as svc

router = APIRouter(prefix="/api/v1/drivers", tags=["drivers"])


@router.get("", response_model=list[DriverListItem])
def list_drivers(
    season: str = Query("current", description="'current', 'all', or a year"),
    search: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[DriverListItem]:
    return svc.driver_list(db, season, search, limit)


@router.get("/{driver_ref}", response_model=DriverDetailOut)
def get_driver(driver_ref: str, db: Session = Depends(get_db)) -> DriverDetailOut:
    detail = svc.driver_detail(db, driver_ref)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Driver '{driver_ref}' not found")
    return detail
