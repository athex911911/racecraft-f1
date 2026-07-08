from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """A registered account: login + profile prefs + saved favorites."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str | None] = mapped_column(String(80))
    theme: Mapped[str] = mapped_column(String(16), default="dark")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    favorites: Mapped[list["UserFavorite"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    predictions: Mapped[list["Prediction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserFavorite(Base):
    """A bookmarked driver / constructor / circuit for a user."""

    __tablename__ = "user_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "entity_type", "entity_ref", name="uq_user_favorite"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    entity_type: Mapped[str] = mapped_column(String(16))  # driver | constructor | circuit
    entity_ref: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="favorites")


class Prediction(Base):
    """A user's pre-race picks for the Prediction League (one row per user+race)."""

    __tablename__ = "predictions"
    __table_args__ = (UniqueConstraint("user_id", "race_id", name="uq_user_race_prediction"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id", ondelete="CASCADE"), index=True)

    pole_driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    winner_driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    p2_driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    p3_driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))
    fastest_lap_driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id"))

    points: Mapped[int | None] = mapped_column(Integer)  # scored once the race completes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="predictions")
