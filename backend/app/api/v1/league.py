from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.league import (
    LeaderboardOut,
    LeagueRaceDetail,
    LeagueRacesOut,
    MyPredictionsOut,
    SubmitPredictionIn,
)
from app.services import league as svc

router = APIRouter(prefix="/api/v1/league", tags=["league"])


@router.get("/races", response_model=LeagueRacesOut)
def list_races(
    season: int | None = Query(None),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> LeagueRacesOut:
    return svc.list_races(db, user, season)


@router.get("/leaderboard", response_model=LeaderboardOut)
def leaderboard(
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> LeaderboardOut:
    return svc.leaderboard(db, user)


@router.get("/me", response_model=MyPredictionsOut)
def my_predictions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MyPredictionsOut:
    return svc.my_predictions(db, user)


@router.get("/races/{race_id}", response_model=LeagueRaceDetail)
def race_detail(
    race_id: int,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> LeagueRaceDetail:
    detail = svc.race_detail(db, user, race_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    return detail


@router.post("/predictions", response_model=LeagueRaceDetail, status_code=201)
def submit_prediction(
    body: SubmitPredictionIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeagueRaceDetail:
    try:
        return svc.submit(db, user, body)
    except svc.LeagueError as e:
        raise HTTPException(status_code=e.status, detail=e.detail) from e
