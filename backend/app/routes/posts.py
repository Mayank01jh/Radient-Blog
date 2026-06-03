from fastapi import APIRouter, HTTPException, Header
from app.database import get_database
from app.schemas import PostCreate, PostOut, PostUpdate
from app.auth import decode_token
from datetime import datetime
from bson import ObjectId

router = APIRouter()

def get_current_user(authorization: str = Header(...)):
    """Extract user ID from JWT token in Authorization header"""
    try:
        token = authorization.split(" ")[1]  # "Bearer <token>"
        payload = decode_token(token)
        return payload["sub"]  # user ID
    except:
        raise HTTPException(status_code=401, detail="Invalid or missing token")


# ── GET all posts (public) ────────────────────────────
@router.get("/", response_model=list[PostOut])
def get_posts():
    db = get_database()
    posts = list(db["posts"].find().sort("created_at", -1))
    for post in posts:
        post["id"] = str(post["_id"])
    return posts


# ── GET single post (public) ─────────────────────────
@router.get("/{post_id}", response_model=PostOut)
def get_post(post_id: str):
    db = get_database()
    post = db["posts"].find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post["id"] = str(post["_id"])
    return post


# ── CREATE post (protected 🔒) ────────────────────────
@router.post("/", response_model=PostOut)
def create_post(post: PostCreate, authorization: str = Header(...)):
    user_id = get_current_user(authorization)
    db = get_database()

    new_post = {
        "title":      post.title,
        "tag":        post.tag,
        "body":       post.body,
        "author_id":  user_id,
        "created_at": datetime.utcnow()
    }
    result = db["posts"].insert_one(new_post)
    new_post["id"] = str(result.inserted_id)
    return new_post


# ── DELETE post (protected 🔒) ────────────────────────
@router.delete("/{post_id}")
def delete_post(post_id: str, authorization: str = Header(...)):
    user_id = get_current_user(authorization)
    db = get_database()

    post = db["posts"].find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(post["author_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not your post")

    db["posts"].delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted"}

# ── UPDATE post (protected 🔒) ────────────────────────
@router.put("/{post_id}", response_model=PostOut)
def update_post(post_id: str, post: PostUpdate, authorization: str = Header(...)):
    user_id = get_current_user(authorization)
    db = get_database()

    existing = db["posts"].find_one({"_id": ObjectId(post_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    if str(existing["author_id"]) != user_id:
        raise HTTPException(status_code=403, detail="Not your post")

    # Only update fields that were sent (PostUpdate has Optional fields)
    updates = {k: v for k, v in post.dict().items() if v is not None}
    db["posts"].update_one({"_id": ObjectId(post_id)}, {"$set": updates})

    updated = db["posts"].find_one({"_id": ObjectId(post_id)})
    updated["id"] = str(updated["_id"])
    return updated
