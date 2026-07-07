from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import CircuitDetailOut, CircuitListItem, SuitabilityOut
from app.services import circuits as svc
from app.services import suitability as suit_svc

router = APIRouter(prefix="/api/v1/circuits", tags=["circuits"])


@router.get("", response_model=list[CircuitListItem])
def list_circuits(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
) -> list[CircuitListItem]:
    return svc.circuit_list(db, search)


@router.get("/{circuit_ref}", response_model=CircuitDetailOut)
def get_circuit(circuit_ref: str, db: Session = Depends(get_db)) -> CircuitDetailOut:
    detail = svc.circuit_detail(db, circuit_ref)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Circuit '{circuit_ref}' not found")
    return detail


@router.get("/{circuit_ref}/suitability", response_model=SuitabilityOut)
def get_suitability(circuit_ref: str, db: Session = Depends(get_db)) -> SuitabilityOut:
    out = suit_svc.track_suitability(db, circuit_ref)
    if out is None:
        raise HTTPException(status_code=404, detail=f"Circuit '{circuit_ref}' not found")
    return out
