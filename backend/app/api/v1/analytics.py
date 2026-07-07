from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import TyreOverviewOut, WetRatingsOut
from app.services import tyres as tyre_svc
from app.services import weather as weather_svc

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/wet-weather", response_model=WetRatingsOut)
def wet_weather(db: Session = Depends(get_db)) -> WetRatingsOut:
    return weather_svc.wet_weather_ratings(db)


@router.get("/tyres", response_model=TyreOverviewOut)
def tyres(
    since: int = Query(2022, ge=2018, le=2026),
    db: Session = Depends(get_db),
) -> TyreOverviewOut:
    return tyre_svc.tyre_overview(db, since)
