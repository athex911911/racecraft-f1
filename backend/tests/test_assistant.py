import pytest

from app.core.database import SessionLocal
from app.insights.template_provider import TemplateProvider


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def provider():
    return TemplateProvider()


def test_driver_profile_intent(db, provider):
    a = provider.answer(db, "How many titles does Hamilton have?")
    assert a.intent == "driver_profile"
    assert "Hamilton" in a.answer
    assert any(s.label == "Titles" for s in a.stats)
    assert any(e.kind == "driver" for e in a.entities)


def test_compare_intent(db, provider):
    a = provider.answer(db, "Compare Verstappen and Leclerc")
    assert a.intent == "compare"
    assert len(a.entities) == 2


def test_standings_intent(db, provider):
    a = provider.answer(db, "Who leads the championship?")
    assert a.intent == "standings"
    assert "Championship" in a.answer


def test_next_race_intent(db, provider):
    a = provider.answer(db, "When is the next race?")
    assert a.intent == "next_race"


def test_driver_at_circuit_intent(db, provider):
    a = provider.answer(db, "Verstappen at Monaco")
    assert a.intent == "driver_at_circuit"


def test_common_word_does_not_false_match_obscure_team(db, provider):
    # "life" is a never-qualified 1990 team; it must not hijack this question.
    a = provider.answer(db, "What is the meaning of life?")
    assert a.intent == "fallback"


def test_empty_question_is_handled(db, provider):
    a = provider.answer(db, "")
    assert a.intent == "fallback"
