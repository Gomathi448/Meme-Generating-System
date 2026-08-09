import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    # Clean up test DB tables if needed, or SQLite will wipe if custom URL used.

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert "Meme" in res.json()["message"]

def test_register_and_login():
    # Register new user
    user_data = {
        "email": "testuser@gmail.com",
        "username": "testuser",
        "password": "testpassword",
        "role": "USER"
    }
    res = client.post("/api/v1/auth/register", json=user_data)
    assert res.status_code == 201 or res.status_code == 400 # 400 if already exists in local test runs
    
    # Login user
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    res = client.post("/api/v1/auth/login", json=login_data)
    assert res.status_code == 200
    json_data = res.json()
    assert "access_token" in json_data
    assert json_data["role"] in ["USER", "ADMIN"]


def test_get_templates():
    res = client.get("/api/v1/templates")
    assert res.status_code == 200
    assert len(res.json()) >= 6 # Seeding should create at least 6 templates
    assert res.json()[0]["name"] == "Distracted Boyfriend"

def test_generate_captions_unauthorized():
    # Attempt generating captions without token
    caption_payload = {
        "prompt": "when I start writing code",
        "tone": "sarcastic",
        "language": "en"
    }
    res = client.post("/api/v1/memes/generate-captions", json=caption_payload)
    assert res.status_code == 401

def test_generate_captions_authorized():
    # Login to get token
    login_data = {"username": "testuser", "password": "testpassword"}
    login_res = client.post("/api/v1/auth/login", json=login_data)
    token = login_res.json()["access_token"]
    
    caption_payload = {
        "prompt": "when my code compiles first try",
        "tone": "sarcastic",
        "language": "en"
    }
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/memes/generate-captions", json=caption_payload, headers=headers)
    assert res.status_code == 200
    assert "variants" in res.json()
    assert len(res.json()["variants"]) == 4

def test_generate_meme():
    # Login to get token
    login_data = {"username": "testuser", "password": "testpassword"}
    login_res = client.post("/api/v1/auth/login", json=login_data)
    token = login_res.json()["access_token"]
    
    # Generate meme on template ID 1
    meme_payload = {
        "title": "My first generated meme",
        "top_text": "Code compiles",
        "bottom_text": "It doesn't crash",
        "tone": "wholesome",
        "tags": "programming,happy",
        "template_id": 1,
        "status": "PUBLISHED"
    }
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/memes/generate", json=meme_payload, headers=headers)
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["title"] == "My first generated meme"
    assert "static/generated_memes" in json_data["image_url"]

def test_get_gallery():
    res = client.get("/api/v1/memes")
    assert res.status_code == 200
    assert res.json()[0]["top_text"] == "Code compiles"

