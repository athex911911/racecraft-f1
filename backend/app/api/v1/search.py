from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.f1 import SearchOut
from app.services import search as svc

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.get("/search", response_model=SearchOut)
def global_search(q: str = Query("", description="query string"), db: Session = Depends(get_db)) -> SearchOut:
    return svc.search(db, q)
