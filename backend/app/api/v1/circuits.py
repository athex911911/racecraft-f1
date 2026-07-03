from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import CircuitDetailOut, CircuitListItem
from app.services import circuits as svc

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
