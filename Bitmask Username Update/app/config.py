"""Configuration management for the application."""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    def __init__(self):
        # Twitter API Credentials
        self.twitter_api_key = os.getenv("TWITTER_API_KEY", "")
        self.twitter_api_secret = os.getenv("TWITTER_API_SECRET", "")
        self.twitter_access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.twitter_access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        
        # Application Secret
        self.secret_key = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
        
        # Database
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./twitter_unfollow.db")
        
        # Detection Settings
        self.inactivity_threshold_months = int(os.getenv("INACTIVITY_THRESHOLD_MONTHS", "6"))
        self.bot_score_threshold = int(os.getenv("BOT_SCORE_THRESHOLD", "60"))
        self.daily_unfollow_limit = int(os.getenv("DAILY_UNFOLLOW_LIMIT", "50"))
        
        # Rate Limiting
        self.rate_limit_buffer = int(os.getenv("RATE_LIMIT_BUFFER", "5"))


settings = Settings()

