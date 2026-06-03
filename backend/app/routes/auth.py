from fastapi import APIRouter, HTTPException
from app.database import get_database
from app.schemas import UserCreate, UserOut, Token, UserLogin
from app.auth import hash_password, verify_password, create_access_token
from datetime import datetime
from bson import ObjectId
from fastapi import Header


router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate):
    db = get_database()
    users = db["users"]

    # Check if email already exists
    if users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Save new user
    new_user = {
        "username":  user.username,
        "email":     user.email,
        "password":  hash_password(user.password),
        "created_at": datetime.utcnow()
    }
    result = users.insert_one(new_user)

    return {"id": str(result.inserted_id), "username": user.username, "email": user.email}


@router.post("/login", response_model=Token)
def login(user: UserLogin):
    db = get_database()
    users = db["users"]

    # Find user by email
    found = users.find_one({"email": user.email})
    if not found or not verify_password(user.password, found["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create and return JWT token
    token = create_access_token({"sub": str(found["_id"])})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(authorization: str = Header(...)):
    from app.auth import decode_token
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    db = get_database()
    user = db["users"].find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    posts = list(db["posts"].find({"author_id": payload["sub"]}).sort("created_at", -1))
    for p in posts:
        p["id"] = str(p["_id"])
    return {
        "username": user["username"],
        "email":    user["email"],
        "posts":    posts
    }
