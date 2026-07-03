from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import CalendarRace, RaceDetailOut
from app.services import calendar as svc

router = APIRouter(prefix="/api/v1", tags=["calendar"])


@router.get("/seasons", response_model=list[int])
def list_seasons(db: Session = Depends(get_db)) -> list[int]:
    return svc.season_years(db)


@router.get("/seasons/{season}/races", response_model=list[CalendarRace])
def get_season_races(season: int, db: Session = Depends(get_db)) -> list[CalendarRace]:
    return svc.season_races(db, season)


@router.get("/races/{race_id}", response_model=RaceDetailOut)
def get_race(race_id: int, db: Session = Depends(get_db)) -> RaceDetailOut:
    detail = svc.race_detail(db, race_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    return detail
