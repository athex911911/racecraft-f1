from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import StrategyCircuitListItem, StrategySimOut
from app.services import strategy as svc

router = APIRouter(prefix="/api/v1/strategy", tags=["strategy"])


@router.get("/circuits", response_model=list[StrategyCircuitListItem])
def strategy_circuits(db: Session = Depends(get_db)) -> list[StrategyCircuitListItem]:
    return svc.list_circuits(db)


@router.get("/{circuit_ref}", response_model=StrategySimOut)
def strategy_simulate(
    circuit_ref: str,
    deg_mode: str = Query("normal", pattern="^(low|normal|high)$"),
    db: Session = Depends(get_db),
) -> StrategySimOut:
    out = svc.simulate(db, circuit_ref, deg_mode)
    if out is None:
        raise HTTPException(status_code=404, detail=f"No strategy data for '{circuit_ref}'")
    return out
