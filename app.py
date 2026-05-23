from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import yt_dlp

# 1. Initialize Limiter to prevent Brute Force/DDoS
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. Strict CORS Policy
# Replace '*' with your actual domain once deployed to prevent unauthorized sites from using your API
origins = [
    "https://bijaykumarkarki.com.np",
    "https://sbj2058.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["GET"], # Only allow GET requests
    allow_headers=["*"],
)

@app.get("/api/compare/{username}")
@limiter.limit("5/minute") # Limits each IP to 5 searches per minute
async def compare_profile(username: str, request: Request):
    # Sanitize input to prevent injection
    clean_username = "".join(char for char in username if char.isalnum() or char in "._")
    
    if not clean_username:
        raise HTTPException(status_code=400, detail="Invalid username format")
        
    # ... rest of your get_tiktok_videos logic ...
 