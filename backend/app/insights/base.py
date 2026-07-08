"""Pluggable insights provider interface.

The app ships a deterministic TemplateProvider that answers from the database.
A ClaudeProvider could be dropped in behind the same interface (activated by an
ANTHROPIC_API_KEY) without touching the router — see get_provider() in __init__.
"""

from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.schemas.assistant import AssistantAnswer


class InsightProvider(ABC):
    name: str

    @abstractmethod
    def answer(self, db: Session, question: str) -> AssistantAnswer: ...
