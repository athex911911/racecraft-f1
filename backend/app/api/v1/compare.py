from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import CompareOut
from app.services import compare as svc

router = APIRouter(prefix="/api/v1/compare", tags=["compare"])


@router.get("/drivers", response_model=CompareOut)
def compare_drivers(
    a: str = Query(..., description="driver_ref"),
    b: str = Query(..., description="driver_ref"),
    db: Session = Depends(get_db),
) -> CompareOut:
    result = svc.compare_drivers(db, a, b)
    if result is None:
        raise HTTPException(status_code=404, detail="One or both drivers not found")
    return result
