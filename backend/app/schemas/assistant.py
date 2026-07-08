from pydantic import BaseModel


class AssistantAsk(BaseModel):
    question: str


class AssistantStat(BaseModel):
    label: str
    value: str


class AssistantEntity(BaseModel):
    kind: str  # driver | constructor | circuit
    ref: str
    name: str


class AssistantAnswer(BaseModel):
    answer: str
    intent: str
    provider: str = "template"
    stats: list[AssistantStat] = []
    entities: list[AssistantEntity] = []
    suggestions: list[str] = []
