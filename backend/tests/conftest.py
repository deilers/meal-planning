import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from db import Base, get_session


@pytest.fixture()
def client():
    import db
    import main

    sqlite_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Patch module-level engine so init_db() creates tables in SQLite
    original_engine = db.engine
    db.engine = sqlite_engine

    Session = sessionmaker(bind=sqlite_engine)

    def override_get_session():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    main.app.dependency_overrides[get_session] = override_get_session
    with TestClient(main.app) as c:
        yield c
    main.app.dependency_overrides.clear()
    db.engine = original_engine
