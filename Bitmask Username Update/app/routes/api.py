"""Additional API routes."""
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from app.models import get_db, Follower, UnfollowRecord
from app.routes.auth import get_current_session

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/export/csv")
async def export_csv(request: Request, db: Session = Depends(get_db)):
    """Export followers data to CSV."""
    from app.routes.auth import get_current_session
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    followers = db.query(Follower).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Username", "Display Name", "Bio", "Followers", "Following", 
        "Tweets", "Bot Score", "Is Bot", "Is Inactive", 
        "Last Tweet", "Account Created"
    ])
    
    # Write data
    for follower in followers:
        writer.writerow([
            follower.username,
            follower.display_name or "",
            follower.bio or "",
            follower.followers_count,
            follower.following_count,
            follower.tweet_count,
            follower.bot_score,
            follower.is_bot,
            follower.is_inactive,
            follower.last_tweet_at.isoformat() if follower.last_tweet_at else "",
            follower.account_created_at.isoformat() if follower.account_created_at else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=followers_export.csv"}
    )


@router.get("/unfollow-history")
async def get_unfollow_history(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get unfollow history."""
    from app.routes.auth import get_current_session
    session = get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    records = db.query(UnfollowRecord).order_by(
        UnfollowRecord.unfollowed_at.desc()
    ).offset(skip).limit(limit).all()
    
    history = []
    for record in records:
        history.append({
            "id": record.id,
            "username": record.follower.username,
            "unfollowed_at": record.unfollowed_at.isoformat(),
            "reason": record.reason,
            "can_undo": record.can_undo,
            "undone_at": record.undone_at.isoformat() if record.undone_at else None
        })
    
    return JSONResponse({"history": history})

