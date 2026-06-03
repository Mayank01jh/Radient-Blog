from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, posts

app = FastAPI(title="Radient Blog API", version="1.0")

# ── CORS — allow the frontend to talk to the backend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # change to your frontend URL in production
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
