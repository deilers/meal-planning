import os

from sqlalchemy import Column, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/meal_planning")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


class MealRow(Base):
    __tablename__ = "meals"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    recipe = Column(Text, default="")
    ingredients = Column(Text, default="")
    tags = Column(String, default="")
    weight = Column(Integer, default=1)
    created_at = Column(String, nullable=False)


class PlanRow(Base):
    __tablename__ = "plans"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    weeks = Column(Text, nullable=False)


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(engine)
