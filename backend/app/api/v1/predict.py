from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import ChampionshipSimOut, RacePredictionOut
from app.services import predict as svc

router = APIRouter(prefix="/api/v1/predict", tags=["predict"])


@router.get("/race/next", response_model=RacePredictionOut)
def predict_next_race(db: Session = Depends(get_db)) -> RacePredictionOut:
    out = svc.race_prediction(db, None)
    if out is None:
        raise HTTPException(status_code=404, detail="No race available to predict")
    return out


@router.get("/race/{race_id}", response_model=RacePredictionOut)
def predict_race(race_id: int, db: Session = Depends(get_db)) -> RacePredictionOut:
    try:
        out = svc.race_prediction(db, race_id)
    except ValueError as exc:  # e.g. no ingested history before this race
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if out is None:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    return out


@router.get("/championship", response_model=ChampionshipSimOut)
def predict_championship(
    iterations: int = Query(4000, ge=500, le=20000),
    db: Session = Depends(get_db),
) -> ChampionshipSimOut:
    out = svc.championship_simulation(db, iterations)
    if out is None:
        raise HTTPException(status_code=404, detail="No completed races ingested yet")
    return out
