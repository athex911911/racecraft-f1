"""Deterministic natural-language answers over the F1 database.

Resolves driver / constructor / circuit mentions in the question, routes to an
intent, and formats a factual answer from the existing analytics services. No
LLM — every answer is reproducible from the ingested data.
"""

from __future__ import annotations

import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.insights.base import InsightProvider
from app.models.f1 import Circuit, Constructor, Driver, QualifyingResult, Race, Result
from app.schemas.assistant import AssistantAnswer, AssistantEntity, AssistantStat
from app.services import circuits as circ_svc
from app.services import compare as compare_svc
from app.services import constructors as cons_svc
from app.services import dashboard as dash_svc
from app.services import drivers as drivers_svc

STAND_KW = [
    "standing", "who is leading", "who's leading", "who leads", "leader of",
    "top of the table", "league table", "championship lead",
]
NEXT_KW = ["next race", "next gp", "next grand prix", "when is the next", "upcoming race"]
COMPARE_KW = ["compare", " vs ", "versus", "against", "better than", " or "]


def _num(x) -> str:
    try:
        f = float(x)
    except (TypeError, ValueError):
        return str(x)
    return str(int(f)) if f == int(f) else f"{f:g}"


def _hit(hay: str, needle: str) -> bool:
    needle = needle.strip().lower()
    if len(needle) < 3:
        return False
    return re.search(r"(?<![a-z0-9])" + re.escape(needle) + r"(?![a-z0-9])", hay) is not None


def _any(hay: str, needles: list[str]) -> bool:
    return any(n in hay for n in needles)


class TemplateProvider(InsightProvider):
    name = "template"

    def answer(self, db: Session, question: str) -> AssistantAnswer:
        q = (question or "").strip()
        if not q:
            return self._fallback("Ask me about a driver, team, circuit, the standings or the next race.")
        ql = f" {q.lower()} "
        ents = self._resolve(db, ql)
        drivers, cons, circs = ents["drivers"], ents["constructors"], ents["circuits"]

        if _any(ql, NEXT_KW):
            return self._next_race(db)
        if len(drivers) >= 2 and (_any(ql, COMPARE_KW) or len(drivers) == 2):
            return self._compare(db, drivers[0], drivers[1])
        if len(drivers) == 1 and circs:
            return self._driver_at_circuit(db, drivers[0], circs[0])
        if _any(ql, STAND_KW) or (("championship" in ql or "standings" in ql) and not drivers):
            return self._standings(db, ql)
        if drivers:
            return self._driver_profile(db, drivers[0])
        if cons:
            return self._constructor_profile(db, cons[0])
        if circs:
            return self._circuit_profile(db, circs[0])
        return self._fallback(
            "I couldn't find a driver, team or circuit in that. Try a name, or ask about the standings or the next race."
        )

    # -- entity resolution -------------------------------------------------
    def _resolve(self, db: Session, ql: str) -> dict:
        races = dict(
            db.execute(select(Result.driver_id, func.count(Result.id)).group_by(Result.driver_id)).all()
        )
        # Only match drivers/teams that actually have race starts, so obscure
        # never-qualified entries (e.g. the 1990 "Life" team) don't hijack a
        # sentence that merely contains a common word like "life".
        by_surname: dict[str, dict] = {}
        for did, ref, fore, sur in db.execute(
            select(Driver.id, Driver.driver_ref, Driver.forename, Driver.surname)
        ):
            if races.get(did, 0) == 0:
                continue
            names = [f"{fore} {sur}", sur, ref.replace("_", " ")]
            if any(_hit(ql, nm) for nm in names):
                cand = {"id": did, "ref": ref, "name": f"{fore} {sur}", "races": races.get(did, 0)}
                key = sur.lower()
                if key not in by_surname or cand["races"] > by_surname[key]["races"]:
                    by_surname[key] = cand
        drivers = sorted(by_surname.values(), key=lambda c: -c["races"])

        cons_races = dict(
            db.execute(select(Result.constructor_id, func.count(Result.id)).group_by(Result.constructor_id)).all()
        )
        cons = []
        for cid, ref, name in db.execute(
            select(Constructor.id, Constructor.constructor_ref, Constructor.name)
        ):
            if cons_races.get(cid, 0) == 0:
                continue
            if _hit(ql, name) or _hit(ql, ref.replace("_", " ")):
                cons.append({"id": cid, "ref": ref, "name": name})

        circs = []
        for cid, ref, name, loc in db.execute(
            select(Circuit.id, Circuit.circuit_ref, Circuit.name, Circuit.location)
        ):
            if any(_hit(ql, c) for c in (name, loc or "", ref.replace("_", " "))):
                circs.append({"id": cid, "ref": ref, "name": name})
        return {"drivers": drivers, "constructors": cons, "circuits": circs}

    # -- intent handlers ---------------------------------------------------
    def _driver_profile(self, db: Session, d: dict) -> AssistantAnswer:
        det = drivers_svc.driver_detail(db, d["ref"])
        if det is None:
            return self._fallback(f"I don't have data for {d['name']}.")
        c = det.career
        name = det.driver.full_name
        parts = [f"{name} has {c.wins} wins, {c.podiums} podiums and {c.poles} poles from {c.races} race starts"]
        if c.titles:
            parts.append(f", including {c.titles} World Championship{'s' if c.titles > 1 else ''}")
        win_rate = (c.wins / c.races * 100) if c.races else 0
        text = "".join(parts) + f". That's a {win_rate:.1f}% win rate over {c.seasons} seasons ({c.first_season}–{c.last_season})."
        surname = d["name"].split()[-1]
        return AssistantAnswer(
            answer=text,
            intent="driver_profile",
            stats=[
                AssistantStat(label="Wins", value=_num(c.wins)),
                AssistantStat(label="Podiums", value=_num(c.podiums)),
                AssistantStat(label="Poles", value=_num(c.poles)),
                AssistantStat(label="Titles", value=_num(c.titles)),
                AssistantStat(label="Points", value=_num(c.points)),
                AssistantStat(label="Best finish", value=("P" + _num(c.best_championship_position)) if c.best_championship_position else "—"),
            ],
            entities=[AssistantEntity(kind="driver", ref=d["ref"], name=name)],
            suggestions=[f"{surname} at Monaco", f"Compare {surname} and Verstappen", "Who leads the championship?"],
        )

    def _compare(self, db: Session, d1: dict, d2: dict) -> AssistantAnswer:
        cmp = compare_svc.compare_drivers(db, d1["ref"], d2["ref"])
        if cmp is None:
            return self._fallback("I couldn't compare those two drivers.")
        h, a, b = cmp.head_to_head, cmp.a, cmp.b
        an, bn = a.driver.full_name, b.driver.full_name
        text = (
            f"Across {h.shared_races} shared races, {an} finished ahead {h.a_race_ahead} times to "
            f"{h.b_race_ahead} for {bn} (qualifying head-to-head {h.a_quali_ahead}–{h.b_quali_ahead}). "
            f"Career: {an} — {a.career.wins} wins, {a.career.titles} titles; "
            f"{bn} — {b.career.wins} wins, {b.career.titles} titles."
        )
        return AssistantAnswer(
            answer=text,
            intent="compare",
            stats=[
                AssistantStat(label=f"{an} race wins H2H", value=_num(h.a_race_ahead)),
                AssistantStat(label=f"{bn} race wins H2H", value=_num(h.b_race_ahead)),
                AssistantStat(label=f"{an} career wins", value=_num(a.career.wins)),
                AssistantStat(label=f"{bn} career wins", value=_num(b.career.wins)),
            ],
            entities=[
                AssistantEntity(kind="driver", ref=d1["ref"], name=an),
                AssistantEntity(kind="driver", ref=d2["ref"], name=bn),
            ],
            suggestions=[f"{an.split()[-1]} at Silverstone", "Who leads the championship?"],
        )

    def _driver_at_circuit(self, db: Session, d: dict, ci: dict) -> AssistantAnswer:
        rows = db.execute(
            select(Result.position_text, Result.position)
            .join(Race, Result.race_id == Race.id)
            .where(Result.driver_id == d["id"], Race.circuit_id == ci["id"])
        ).all()
        if not rows:
            return AssistantAnswer(
                answer=f"{d['name']} has no race starts at {ci['name']} in the database.",
                intent="driver_at_circuit",
                entities=[
                    AssistantEntity(kind="driver", ref=d["ref"], name=d["name"]),
                    AssistantEntity(kind="circuit", ref=ci["ref"], name=ci["name"]),
                ],
            )
        starts = len(rows)
        wins = sum(1 for pt, _ in rows if pt == "1")
        podiums = sum(1 for pt, _ in rows if pt in ("1", "2", "3"))
        finishes = [p for _, p in rows if p is not None]
        best = min(finishes) if finishes else None
        text = (
            f"At {ci['name']}, {d['name']} has {starts} start{'s' if starts != 1 else ''}, "
            f"{wins} win{'s' if wins != 1 else ''} and {podiums} podium{'s' if podiums != 1 else ''}"
        )
        text += f", with a best finish of P{best}." if best else "."
        return AssistantAnswer(
            answer=text,
            intent="driver_at_circuit",
            stats=[
                AssistantStat(label="Starts", value=_num(starts)),
                AssistantStat(label="Wins", value=_num(wins)),
                AssistantStat(label="Podiums", value=_num(podiums)),
                AssistantStat(label="Best", value=("P" + _num(best)) if best else "—"),
            ],
            entities=[
                AssistantEntity(kind="driver", ref=d["ref"], name=d["name"]),
                AssistantEntity(kind="circuit", ref=ci["ref"], name=ci["name"]),
            ],
            suggestions=[f"Tell me about {ci['name']}", f"{d['name'].split()[-1]} career stats"],
        )

    def _standings(self, db: Session, ql: str) -> AssistantAnswer:
        season = dash_svc.resolve_season(db, None)
        team = "constructor" in ql or "team" in ql
        if team:
            st = dash_svc.constructor_standings(db, season)[:5]
            if not st:
                return self._fallback("No standings are available yet.")
            leader = st[0]
            text = f"{leader.constructor.name} lead the {season} Constructors' Championship with {_num(leader.points)} points"
            if len(st) > 1:
                text += f", ahead of {st[1].constructor.name} ({_num(st[1].points)})."
            stats = [AssistantStat(label=f"{s.position}. {s.constructor.name}", value=_num(s.points)) for s in st]
            return AssistantAnswer(answer=text, intent="standings", stats=stats,
                                   suggestions=["Who leads the drivers' championship?", "When is the next race?"])
        st = dash_svc.driver_standings(db, season)[:5]
        if not st:
            return self._fallback("No standings are available yet.")
        leader = st[0]
        text = f"{leader.driver.full_name} leads the {season} Drivers' Championship with {_num(leader.points)} points"
        if len(st) > 1:
            text += f", ahead of {st[1].driver.full_name} ({_num(st[1].points)})"
        if len(st) > 2:
            text += f" and {st[2].driver.full_name} ({_num(st[2].points)})"
        text += "."
        stats = [AssistantStat(label=f"{s.position}. {s.driver.full_name}", value=_num(s.points)) for s in st]
        return AssistantAnswer(answer=text, intent="standings", stats=stats,
                               suggestions=["Constructor standings", "When is the next race?"])

    def _next_race(self, db: Session) -> AssistantAnswer:
        nr = dash_svc.next_race(db)
        if nr is None:
            return self._fallback("There's no upcoming race scheduled in the data.")
        text = f"The next race is the {nr.name} at {nr.circuit.name}, {nr.circuit.location or nr.circuit.country}, on {nr.date}."
        if nr.previous_winner:
            text += f" Last time out here the winner was {nr.previous_winner}."
        return AssistantAnswer(
            answer=text,
            intent="next_race",
            entities=[AssistantEntity(kind="circuit", ref=nr.circuit.circuit_ref, name=nr.circuit.name)],
            stats=[AssistantStat(label="Round", value=_num(nr.round)), AssistantStat(label="Date", value=str(nr.date))],
            suggestions=[f"Tell me about {nr.circuit.name}", "Who leads the championship?"],
        )

    def _constructor_profile(self, db: Session, c: dict) -> AssistantAnswer:
        det = cons_svc.constructor_detail(db, c["ref"])
        if det is None:
            return self._fallback(f"I don't have data for {c['name']}.")
        cc = det.career
        text = (
            f"{det.constructor.name} have {cc.wins} wins, {cc.podiums} podiums and {cc.poles} poles"
        )
        if cc.titles:
            text += f", with {cc.titles} Constructors' Championship{'s' if cc.titles > 1 else ''}"
        text += f" across {cc.seasons} seasons."
        return AssistantAnswer(
            answer=text,
            intent="constructor_profile",
            stats=[
                AssistantStat(label="Wins", value=_num(cc.wins)),
                AssistantStat(label="Podiums", value=_num(cc.podiums)),
                AssistantStat(label="Poles", value=_num(cc.poles)),
                AssistantStat(label="Titles", value=_num(cc.titles)),
            ],
            entities=[AssistantEntity(kind="constructor", ref=c["ref"], name=det.constructor.name)],
            suggestions=["Who leads the constructors' championship?"],
        )

    def _circuit_profile(self, db: Session, ci: dict) -> AssistantAnswer:
        det = circ_svc.circuit_detail(db, ci["ref"])
        if det is None:
            return self._fallback(f"I don't have data for {ci['name']}.")
        cc = det.circuit
        text = f"{cc.name} in {cc.location or cc.country} has hosted {det.races_held} Grands Prix"
        if det.first_year:
            text += f" since {det.first_year}"
        if det.top_drivers:
            text += f". The most successful driver here is {det.top_drivers[0].label} ({_num(det.top_drivers[0].value)} wins)"
        text += "."
        stats = [AssistantStat(label="GPs held", value=_num(det.races_held))]
        if cc.length_km:
            stats.append(AssistantStat(label="Length", value=f"{_num(cc.length_km)} km"))
        if cc.corners:
            stats.append(AssistantStat(label="Corners", value=_num(cc.corners)))
        if det.pole_win_rate is not None:
            stats.append(AssistantStat(label="Pole→win", value=f"{det.pole_win_rate * 100:.0f}%"))
        return AssistantAnswer(
            answer=text,
            intent="circuit_profile",
            stats=stats,
            entities=[AssistantEntity(kind="circuit", ref=ci["ref"], name=cc.name)],
            suggestions=[f"Who has the most wins at {cc.name}?", "When is the next race?"],
        )

    def _fallback(self, msg: str) -> AssistantAnswer:
        return AssistantAnswer(
            answer=msg,
            intent="fallback",
            suggestions=[
                "How many titles does Hamilton have?",
                "Compare Verstappen and Leclerc",
                "Who leads the championship?",
                "Verstappen at Monaco",
                "When is the next race?",
            ],
        )
