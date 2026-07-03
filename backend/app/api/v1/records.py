from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import HallOfFameOut
from app.services import records as svc

router = APIRouter(prefix="/api/v1", tags=["records"])


@router.get("/records", response_model=HallOfFameOut)
def get_records(db: Session = Depends(get_db)) -> HallOfFameOut:
    return svc.hall_of_fame(db)
