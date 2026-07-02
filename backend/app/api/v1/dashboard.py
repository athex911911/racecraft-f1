from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import (
    ChampionshipProgressOut,
    ConstructorStandingOut,
    DriverStandingOut,
    NextRaceOut,
    RaceSummaryOut,
    SeasonProgressOut,
    TrendingStat,
)
from app.services import dashboard as svc

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/standings/drivers", response_model=list[DriverStandingOut])
def get_driver_standings(
    season: str = Query("current"), db: Session = Depends(get_db)
) -> list[DriverStandingOut]:
    return svc.driver_standings(db, svc.resolve_season(db, season))


@router.get("/standings/constructors", response_model=list[ConstructorStandingOut])
def get_constructor_standings(
    season: str = Query("current"), db: Session = Depends(get_db)
) -> list[ConstructorStandingOut]:
    return svc.constructor_standings(db, svc.resolve_season(db, season))


@router.get("/races/next", response_model=NextRaceOut | None)
def get_next_race(db: Session = Depends(get_db)) -> NextRaceOut | None:
    return svc.next_race(db)


@router.get("/seasons/progress", response_model=SeasonProgressOut)
def get_season_progress(
    season: str = Query("current"), db: Session = Depends(get_db)
) -> SeasonProgressOut:
    return svc.season_progress(db, svc.resolve_season(db, season))


@router.get("/analytics/championship-progress", response_model=ChampionshipProgressOut)
def get_championship_progress(
    season: str = Query("current"),
    entity_type: str = Query("driver", pattern="^(driver|constructor)$"),
    db: Session = Depends(get_db),
) -> ChampionshipProgressOut:
    return svc.championship_progress(db, svc.resolve_season(db, season), entity_type)


@router.get("/analytics/trending", response_model=list[TrendingStat])
def get_trending_stats(
    season: str = Query("current"), db: Session = Depends(get_db)
) -> list[TrendingStat]:
    return svc.trending_stats(db, svc.resolve_season(db, season))


@router.get("/races/latest/summary", response_model=RaceSummaryOut | None)
def get_latest_race_summary(db: Session = Depends(get_db)) -> RaceSummaryOut | None:
    return svc.latest_race_summary(db)
