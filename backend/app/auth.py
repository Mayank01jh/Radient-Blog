import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from .database import get_collection
import os
from dotenv import load_dotenv
load_dotenv()

# Secret key — change this to something random in production
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    """Create a JWT token with an expiry time"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token"""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
