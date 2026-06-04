from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, posts

app = FastAPI(title="Radient Blog API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──
app.include_router(auth.router,  prefix="/auth",  tags=["Auth"])
app.include_router(posts.router, prefix="/posts", tags=["Posts"])

# ── Health check ──
@app.get("/")
def root():
    return {"message": "Radient Blog API is running ✅"}

# ── Stats for Frontend ──
@app.get("/stats")
def get_stats():
    from app.database import get_database
    db = get_database()
    posts_count = db["posts"].count_documents({})
    users_count = db["users"].count_documents({})
    return {"posts": posts_count, "readers": users_count}
