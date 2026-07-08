from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.insights import get_provider
from app.schemas.assistant import AssistantAnswer, AssistantAsk

router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


@router.post("/ask", response_model=AssistantAnswer)
def ask(body: AssistantAsk, db: Session = Depends(get_db)) -> AssistantAnswer:
    """Answer a natural-language F1 question from the database (template provider)."""
    return get_provider().answer(db, body.question)
