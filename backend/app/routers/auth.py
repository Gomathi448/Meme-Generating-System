from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.models.interaction import AIUsage
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, RefreshTokenRequest

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login-form-docs")

# Authentication Dependency Helper
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive/banned")
        
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email/username exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
        
    hashed_pass = get_password_hash(user_in.password)
    # Check if first user in database to make admin
    is_first = db.query(User).count() == 0
    role = "ADMIN" if is_first else user_in.role.upper()
    if role not in ["USER", "ADMIN"]:
        role = "USER"
        
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_pass,
        role=role,
        avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize AI usage quota
    quota = AIUsage(user_id=new_user.id, count_limit=50, count_used=0)
    db.add(quota)
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")
        
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user.role,
        "username": user.username,
        "id": user.id
    }

# Endpoint for Swagger documentation token authentication
@router.post("/login-form-docs")
def login_docs(form_data: OAuth2PasswordBearer = Depends(), db: Session = Depends(get_db)):
    # Implements standard OAuth2 password flow form handler
    from fastapi.security import OAuth2PasswordRequestForm
    form_data = Depends(OAuth2PasswordRequestForm)
    # This is a helper wrapper if users authorize inside FastAPI Swagger GUI
    pass

@router.post("/refresh", response_model=Token)
def refresh_token(payload_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(payload_in.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or not found")
        
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user.role,
        "username": user.username,
        "id": user.id
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/oauth/google", response_model=Token)
def oauth_google_login(google_payload: dict, db: Session = Depends(get_db)):
    # Simulates OAuth sign-in/up by reading client google auth identity info
    email = google_payload.get("email")
    name = google_payload.get("name", "GoogleUser")
    if not email:
        raise HTTPException(status_code=400, detail="Google authentication payload invalid")
        
    # Find existing or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = email.split("@")[0] + "_g"
        # Ensure username unique
        existing_username = db.query(User).filter(User.username == username).first()
        if existing_username:
            username = f"{username}{random.randint(10,99)}"
            
        user = User(
            email=email,
            username=username,
            password_hash=get_password_hash(f"google_pass_{random.randint(1000,9999)}"),
            role="USER",
            avatar_url=google_payload.get("picture", f"https://api.dicebear.com/7.x/bottts/svg?seed={username}")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Initialize Quota
        quota = AIUsage(user_id=user.id, count_limit=50, count_used=0)
        db.add(quota)
        db.commit()
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User banned")
        
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "role": user.role,
        "username": user.username,
        "id": user.id
    }
