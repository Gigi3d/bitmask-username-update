"""Authentication routes for Twitter OAuth."""
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from fastapi.responses import RedirectResponse
from requests_oauthlib import OAuth1Session
from urllib.parse import parse_qs, urlparse
import secrets
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

# Store temporary tokens (in production, use Redis or database)
temp_tokens = {}


@router.get("/login")
async def login(request: Request):
    """Initiate Twitter OAuth flow."""
    # Create OAuth session
    # Get callback URL
    base_url = str(request.base_url).rstrip('/')
    callback_uri = f"{base_url}/auth/callback"
    
    oauth = OAuth1Session(
        settings.twitter_api_key,
        client_secret=settings.twitter_api_secret,
        callback_uri=callback_uri
    )
    
    # Get request token
    try:
        fetch_response = oauth.fetch_request_token(
            "https://api.twitter.com/oauth/request_token"
        )
        
        # Store tokens temporarily
        session_id = secrets.token_urlsafe(32)
        temp_tokens[session_id] = {
            "request_token": fetch_response.get("oauth_token"),
            "request_token_secret": fetch_response.get("oauth_token_secret")
        }
        
        # Redirect to authorization URL
        authorization_url = oauth.authorization_url("https://api.twitter.com/oauth/authorize")
        
        response = RedirectResponse(url=authorization_url)
        response.set_cookie(key="oauth_session", value=session_id, httponly=True)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")


@router.get("/callback")
async def callback(request: Request, oauth_token: str = None, oauth_verifier: str = None):
    """Handle OAuth callback."""
    if not oauth_token or not oauth_verifier:
        raise HTTPException(status_code=400, detail="Missing OAuth parameters")
    
    # Get session ID from cookie
    session_id = request.cookies.get("oauth_session")
    if not session_id or session_id not in temp_tokens:
        raise HTTPException(status_code=400, detail="Invalid session")
    
    temp_token_data = temp_tokens[session_id]
    
    # Create OAuth session with request token
    oauth = OAuth1Session(
        settings.twitter_api_key,
        client_secret=settings.twitter_api_secret,
        resource_owner_key=temp_token_data["request_token"],
        resource_owner_secret=temp_token_data["request_token_secret"],
        verifier=oauth_verifier
    )
    
    try:
        # Get access token
        oauth_tokens = oauth.fetch_access_token("https://api.twitter.com/oauth/access_token")
        
        access_token = oauth_tokens.get("oauth_token")
        access_token_secret = oauth_tokens.get("oauth_token_secret")
        user_id = oauth_tokens.get("user_id")
        screen_name = oauth_tokens.get("screen_name")
        
        # Store in session (in production, use proper session management)
        session_token = secrets.token_urlsafe(32)
        
        # Store session data (in production, use database)
        from app.models import SessionLocal, UserSession
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            user_session = UserSession(
                session_id=session_token,
                access_token=access_token,
                access_token_secret=access_token_secret,
                twitter_user_id=user_id,
                twitter_username=screen_name,
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            db.add(user_session)
            db.commit()
        finally:
            db.close()
        
        # Clean up temp token
        del temp_tokens[session_id]
        
        # Redirect to dashboard
        response = RedirectResponse(url="/dashboard")
        response.set_cookie(key="session_token", value=session_token, httponly=True, max_age=2592000)
        response.delete_cookie("oauth_session")
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error completing OAuth: {str(e)}")


@router.get("/logout")
async def logout(request: Request):
    """Logout and clear session."""
    session_token = request.cookies.get("session_token")
    if session_token:
        from app.models import SessionLocal, UserSession
        db = SessionLocal()
        try:
            db.query(UserSession).filter(UserSession.session_id == session_token).delete()
            db.commit()
        finally:
            db.close()
    
    response = RedirectResponse(url="/")
    response.delete_cookie("session_token")
    return response


def get_current_session(request: Request):
    """Dependency to get current user session."""
    session_token = request.cookies.get("session_token")
    if not session_token:
        return None
    
    from app.models import SessionLocal, UserSession
    from datetime import datetime
    
    db = SessionLocal()
    try:
        user_session = db.query(UserSession).filter(
            UserSession.session_id == session_token,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if user_session:
            return {
                "session_id": user_session.session_id,
                "access_token": user_session.access_token,
                "access_token_secret": user_session.access_token_secret,
                "twitter_user_id": user_session.twitter_user_id,
                "twitter_username": user_session.twitter_username
            }
        return None
    finally:
        db.close()

