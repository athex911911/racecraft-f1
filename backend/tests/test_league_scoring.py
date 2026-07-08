from types import SimpleNamespace

from app.services.league import (
    MAX_POINTS,
    PTS_FASTEST_LAP,
    PTS_PODIUM_WRONG_SLOT,
    PTS_WINNER,
    _score,
)

# winner=1, p2=2, p3=3, pole=1, fastest lap=4
ACTUAL = {"pole": 1, "winner": 1, "p2": 2, "p3": 3, "fl": 4, "podium": {1, 2, 3}}


def _pred(**kw):
    base = dict(
        pole_driver_id=None,
        winner_driver_id=None,
        p2_driver_id=None,
        p3_driver_id=None,
        fastest_lap_driver_id=None,
    )
    base.update(kw)
    return SimpleNamespace(**base)


def test_perfect_prediction_scores_max():
    p = _pred(pole_driver_id=1, winner_driver_id=1, p2_driver_id=2, p3_driver_id=3, fastest_lap_driver_id=4)
    assert _score(p, ACTUAL).total == MAX_POINTS == 75


def test_podium_driver_in_wrong_slot_scores_partial():
    # 3 and 2 are on the podium but in the opposite slots -> +5 each, nothing else
    p = _pred(p2_driver_id=3, p3_driver_id=2)
    sb = _score(p, ACTUAL)
    assert sb.podium == PTS_PODIUM_WRONG_SLOT * 2
    assert sb.total == PTS_PODIUM_WRONG_SLOT * 2


def test_all_wrong_scores_zero():
    p = _pred(pole_driver_id=9, winner_driver_id=9, p2_driver_id=9, p3_driver_id=9, fastest_lap_driver_id=9)
    assert _score(p, ACTUAL).total == 0


def test_partial_winner_and_fastest_lap():
    p = _pred(winner_driver_id=1, fastest_lap_driver_id=4)
    sb = _score(p, ACTUAL)
    assert sb.winner == PTS_WINNER
    assert sb.fastest_lap == PTS_FASTEST_LAP
    assert sb.total == PTS_WINNER + PTS_FASTEST_LAP


def test_empty_prediction_scores_zero():
    assert _score(_pred(), ACTUAL).total == 0
