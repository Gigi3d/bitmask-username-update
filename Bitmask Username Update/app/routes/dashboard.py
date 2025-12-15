"""Dashboard routes."""
from fastapi import APIRouter, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from app.models import get_db, Follower, UnfollowRecord
from app.twitter_client import TwitterClient
from app.analyzer import FollowerAnalyzer
from app.routes.auth import get_current_session
from datetime import datetime, timedelta
import json

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with login option."""
    session = get_current_session(request)
    if session:
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    """Main dashboard page."""
    session = get_current_session(request)
    if not session:
        return RedirectResponse(url="/auth/login")
    
    # Get statistics
    total_followers = db.query(Follower).count()
    bots = db.query(Follower).filter(Follower.is_bot == True).count()
    inactive = db.query(Follower).filter(Follower.is_inactive == True).count()
    
    # Get recent unfollows today
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    unfollowed_today = db.query(UnfollowRecord).filter(
        UnfollowRecord.unfollowed_at >= today
    ).count()
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "total_followers": total_followers,
        "bots": bots,
        "inactive": inactive,
        "unfollowed_today": unfollowed_today,
        "username": session["twitter_username"]
    })


@router.get("/api/followers")
async def get_followers(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    filter_type: Optional[str] = None,
    sort_by: Optional[str] = "bot_score",
    db: Session = Depends(get_db)
):
    """API endpoint to get followers with pagination and filtering."""
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = db.query(Follower)
    
    # Apply filters
    if filter_type == "bots":
        query = query.filter(Follower.is_bot == True)
    elif filter_type == "inactive":
        query = query.filter(Follower.is_inactive == True)
    elif filter_type == "both":
        query = query.filter((Follower.is_bot == True) | (Follower.is_inactive == True))
    
    # Apply sorting
    if sort_by == "bot_score":
        query = query.order_by(desc(Follower.bot_score))
    elif sort_by == "username":
        query = query.order_by(Follower.username)
    elif sort_by == "followers":
        query = query.order_by(desc(Follower.followers_count))
    elif sort_by == "last_tweet":
        query = query.order_by(desc(Follower.last_tweet_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    followers = query.offset(skip).limit(limit).all()
    
    # Convert to dict
    followers_data = []
    for follower in followers:
        followers_data.append({
            "id": follower.id,
            "twitter_id": follower.twitter_id,
            "username": follower.username,
            "display_name": follower.display_name,
            "bio": follower.bio,
            "profile_image_url": follower.profile_image_url,
            "followers_count": follower.followers_count,
            "following_count": follower.following_count,
            "tweet_count": follower.tweet_count,
            "bot_score": follower.bot_score,
            "is_bot": follower.is_bot,
            "is_inactive": follower.is_inactive,
            "last_tweet_at": follower.last_tweet_at.isoformat() if follower.last_tweet_at else None,
            "account_created_at": follower.account_created_at.isoformat() if follower.account_created_at else None
        })
    
    return JSONResponse({
        "followers": followers_data,
        "total": total,
        "skip": skip,
        "limit": limit
    })


@router.post("/api/analyze")
async def analyze_followers(request: Request, db: Session = Depends(get_db)):
    """Analyze followers from Twitter."""
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Initialize Twitter client with user's tokens
        twitter_client = TwitterClient(
            access_token=session["access_token"],
            access_token_secret=session["access_token_secret"]
        )
        
        # Verify credentials
        user_info = twitter_client.verify_credentials()
        if not user_info:
            raise HTTPException(status_code=401, detail="Invalid Twitter credentials")
        
        # Fetch followers
        followers_data = twitter_client.get_followers()
        
        # Analyze followers
        analyzer = FollowerAnalyzer()
        analyzed_followers = analyzer.batch_analyze(followers_data)
        
        # Store in database
        saved_count = 0
        for follower_data in analyzed_followers:
            # Check if already exists
            existing = db.query(Follower).filter(
                Follower.twitter_id == follower_data["twitter_id"]
            ).first()
            
            if existing:
                # Update existing
                for key, value in follower_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
            else:
                # Create new
                follower = Follower(**{k: v for k, v in follower_data.items() if hasattr(Follower, k)})
                db.add(follower)
            
            saved_count += 1
        
        db.commit()
        
        return JSONResponse({
            "success": True,
            "message": f"Analyzed and saved {saved_count} followers",
            "total": len(analyzed_followers)
        })
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error analyzing followers: {str(e)}")


@router.post("/api/unfollow")
async def unfollow_users(
    request: Request,
    user_ids: str = Form(...),
    reason: str = Form("manual"),
    db: Session = Depends(get_db)
):
    """Unfollow selected users."""
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Parse user IDs
        user_id_list = json.loads(user_ids) if isinstance(user_ids, str) else user_ids
        
        # Check daily limit
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        unfollowed_today = db.query(UnfollowRecord).filter(
            UnfollowRecord.unfollowed_at >= today
        ).count()
        
        from app.config import settings
        if unfollowed_today + len(user_id_list) > settings.daily_unfollow_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Daily unfollow limit ({settings.daily_unfollow_limit}) would be exceeded"
            )
        
        # Initialize Twitter client
        twitter_client = TwitterClient(
            access_token=session["access_token"],
            access_token_secret=session["access_token_secret"]
        )
        
        # Unfollow each user
        results = []
        for user_id in user_id_list:
            # Get follower from database
            follower = db.query(Follower).filter(Follower.twitter_id == str(user_id)).first()
            
            if not follower:
                continue
            
            # Unfollow on Twitter
            success = twitter_client.unfollow_user(str(user_id))
            
            if success:
                # Record unfollow
                unfollow_record = UnfollowRecord(
                    follower_id=follower.id,
                    reason=reason,
                    can_undo=True
                )
                db.add(unfollow_record)
                results.append({"user_id": user_id, "success": True})
            else:
                results.append({"user_id": user_id, "success": False, "error": "Failed to unfollow"})
            
            # Small delay to respect rate limits
            import time
            time.sleep(1)
        
        db.commit()
        
        return JSONResponse({
            "success": True,
            "results": results,
            "unfollowed": sum(1 for r in results if r.get("success"))
        })
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error unfollowing users: {str(e)}")


@router.get("/api/stats")
async def get_stats(request: Request, db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    total_followers = db.query(Follower).count()
    bots = db.query(Follower).filter(Follower.is_bot == True).count()
    inactive = db.query(Follower).filter(Follower.is_inactive == True).count()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    unfollowed_today = db.query(UnfollowRecord).filter(
        UnfollowRecord.unfollowed_at >= today
    ).count()
    
    return JSONResponse({
        "total_followers": total_followers,
        "bots": bots,
        "inactive": inactive,
        "unfollowed_today": unfollowed_today
    })

