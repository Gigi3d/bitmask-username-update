"""Database models for the application."""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from app.config import settings

Base = declarative_base()


class Follower(Base):
    """Model for storing follower information."""
    __tablename__ = "followers"
    
    id = Column(Integer, primary_key=True, index=True)
    twitter_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, index=True, nullable=False)
    display_name = Column(String)
    bio = Column(Text)
    profile_image_url = Column(String)
    banner_url = Column(String)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    tweet_count = Column(Integer, default=0)
    account_created_at = Column(DateTime)
    last_tweet_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_protected = Column(Boolean, default=False)
    bot_score = Column(Float, default=0.0)
    is_bot = Column(Boolean, default=False)
    is_inactive = Column(Boolean, default=False)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    unfollow_records = relationship("UnfollowRecord", back_populates="follower")


class AnalysisResult(Base):
    """Model for storing analysis results."""
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("followers.id"))
    analysis_date = Column(DateTime, default=datetime.utcnow)
    bot_score = Column(Float)
    inactivity_score = Column(Float)
    flags = Column(Text)  # JSON string of detected flags
    notes = Column(Text)


class UnfollowRecord(Base):
    """Model for tracking unfollow actions."""
    __tablename__ = "unfollow_records"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("followers.id"))
    follower = relationship("Follower", back_populates="unfollow_records")
    unfollowed_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String)  # 'bot', 'inactive', 'manual'
    can_undo = Column(Boolean, default=True)
    undone_at = Column(DateTime, nullable=True)


class UserSession(Base):
    """Model for storing user sessions."""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    access_token = Column(String)
    access_token_secret = Column(String)
    twitter_user_id = Column(String)
    twitter_username = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)


# Database setup
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session generator."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

