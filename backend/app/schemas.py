from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ── What the frontend sends when submitting the form ──
class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    tag:   str = Field(..., min_length=1)   # single string: "Essay", "Reflection"
    body:  str = Field(..., min_length=1)   # full post content

# ── What the backend returns to the frontend ──
class PostOut(BaseModel):
    id:         str
    title:      str
    tag:        str
    body:       str
    author_id:  str
    created_at: datetime

# ── For partial updates (PATCH requests) ──
class PostUpdate(BaseModel):
    title: Optional[str] = None
    tag:   Optional[str] = None
    body:  Optional[str] = None

# ── Auth schemas ──
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email:    str
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email:    str
    password: str

class UserOut(BaseModel):
    id:       str
    username: str
    email:    str

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None