import sys
import os

# Set python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.template import Template
from app.schemas.meme import MemeCreate
from app.routers.memes import generate_meme_image
import asyncio

# Ensure tables are built
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Find or create user
user = db.query(User).filter(User.username == "testuser").first()
if not user:
    user = User(username="testuser", email="testuser@gmail.com", password_hash="hash", role="USER")
    db.add(user)
    db.commit()
    db.refresh(user)

# Find or create template
template = db.query(Template).first()
if not template:
    from app.services.image_service import image_service
    initials = image_service.create_initial_templates()
    for item in initials:
        new_temp = Template(
            name=item["name"],
            image_url=item["url"],
            category="trending",
            tags="funny"
        )
        db.add(new_temp)
    db.commit()
    template = db.query(Template).first()

print(f"Using User ID: {user.id}, Template ID: {template.id}, Image URL: {template.image_url}")

# Run generation function directly and catch traceback
meme_payload = MemeCreate(
    title="My first generated meme",
    top_text="Code compiles",
    bottom_text="It doesn't crash",
    tone="wholesome",
    tags="programming,happy",
    template_id=template.id,
    status="PUBLISHED"
)

async def test():
    try:
        res = await generate_meme_image(
            req=meme_payload,
            image_data_url=None,
            current_user=user,
            db=db
        )
        print("Success!", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
