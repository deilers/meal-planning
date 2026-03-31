import os
import sys
from unittest.mock import patch

import fakeredis
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture()
def fake_redis():
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture()
def client(fake_redis):
    import main

    with patch("main.get_client", return_value=fake_redis):
        with TestClient(main.app) as c:
            yield c
