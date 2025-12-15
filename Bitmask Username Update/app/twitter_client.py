"""Twitter API client wrapper."""
import time
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import tweepy
from tweepy import API, OAuthHandler, Cursor
from tweepy.errors import TweepyException, TooManyRequests, Unauthorized
from app.config import settings

logger = logging.getLogger(__name__)


class TwitterClient:
    """Wrapper for Twitter API operations."""
    
    def __init__(self, access_token: Optional[str] = None, access_token_secret: Optional[str] = None):
        """Initialize Twitter client with credentials."""
        self.api_key = settings.twitter_api_key
        self.api_secret = settings.twitter_api_secret
        self.access_token = access_token or settings.twitter_access_token
        self.access_token_secret = access_token_secret or settings.twitter_access_token_secret
        
        # Initialize OAuth handler
        self.auth = OAuthHandler(self.api_key, self.api_secret)
        if self.access_token and self.access_token_secret:
            self.auth.set_access_token(self.access_token, self.access_token_secret)
        
        # Initialize API
        self.api = API(self.auth, wait_on_rate_limit=True, retry_count=3, retry_delay=5)
        
        # Rate limit tracking
        self.rate_limit_status = {}
    
    def verify_credentials(self) -> Optional[Dict[str, Any]]:
        """Verify API credentials and return user info."""
        try:
            user = self.api.verify_credentials()
            return {
                "id": user.id_str,
                "username": user.screen_name,
                "name": user.name,
                "followers_count": user.followers_count,
                "friends_count": user.friends_count
            }
        except Unauthorized:
            logger.error("Invalid Twitter credentials")
            return None
        except Exception as e:
            logger.error(f"Error verifying credentials: {e}")
            return None
    
    def get_followers(self, user_id: Optional[str] = None, count: int = 200) -> List[Dict[str, Any]]:
        """
        Fetch all followers for the authenticated user.
        
        Args:
            user_id: Twitter user ID (None for authenticated user)
            count: Number of followers per page (max 200)
        
        Returns:
            List of follower dictionaries
        """
        followers = []
        try:
            for page in Cursor(self.api.get_followers, 
                             user_id=user_id,
                             count=count,
                             skip_status=False,
                             include_user_entities=True).pages():
                for user in page:
                    follower_data = self._user_to_dict(user)
                    followers.append(follower_data)
                
                # Small delay to avoid rate limits
                time.sleep(1)
                
                logger.info(f"Fetched {len(followers)} followers so far...")
            
            logger.info(f"Total followers fetched: {len(followers)}")
            return followers
            
        except TooManyRequests:
            logger.warning("Rate limit exceeded. Waiting...")
            time.sleep(900)  # Wait 15 minutes
            return self.get_followers(user_id, count)
        except Exception as e:
            logger.error(f"Error fetching followers: {e}")
            raise
    
    def get_user_timeline(self, user_id: str, count: int = 200) -> List[Dict[str, Any]]:
        """Get user's recent tweets."""
        try:
            tweets = []
            for tweet in Cursor(self.api.user_timeline, 
                              user_id=user_id,
                              count=min(count, 200),
                              tweet_mode='extended').items(count):
                tweets.append({
                    "id": tweet.id_str,
                    "created_at": tweet.created_at,
                    "text": tweet.full_text if hasattr(tweet, 'full_text') else tweet.text,
                    "retweet_count": tweet.retweet_count,
                    "favorite_count": tweet.favorite_count
                })
            return tweets
        except Exception as e:
            logger.error(f"Error fetching timeline for user {user_id}: {e}")
            return []
    
    def unfollow_user(self, user_id: str) -> bool:
        """
        Unfollow a user.
        
        Args:
            user_id: Twitter user ID to unfollow
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.api.destroy_friendship(user_id=user_id)
            logger.info(f"Successfully unfollowed user {user_id}")
            return True
        except TooManyRequests:
            logger.warning("Rate limit exceeded for unfollow action")
            raise
        except Exception as e:
            logger.error(f"Error unfollowing user {user_id}: {e}")
            return False
    
    def follow_user(self, user_id: str) -> bool:
        """
        Follow a user (for undo functionality).
        
        Args:
            user_id: Twitter user ID to follow
        
        Returns:
            True if successful, False otherwise
        """
        try:
            self.api.create_friendship(user_id=user_id)
            logger.info(f"Successfully followed user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error following user {user_id}: {e}")
            return False
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status."""
        try:
            return self.api.get_rate_limit_status()
        except Exception as e:
            logger.error(f"Error getting rate limit status: {e}")
            return {}
    
    def _user_to_dict(self, user) -> Dict[str, Any]:
        """Convert tweepy User object to dictionary."""
        return {
            "twitter_id": user.id_str,
            "username": user.screen_name,
            "display_name": user.name,
            "bio": user.description or "",
            "profile_image_url": user.profile_image_url_https if hasattr(user, 'profile_image_url_https') else None,
            "banner_url": user.profile_banner_url if hasattr(user, 'profile_banner_url') else None,
            "followers_count": user.followers_count,
            "following_count": user.friends_count,
            "tweet_count": user.statuses_count,
            "account_created_at": user.created_at,
            "is_verified": user.verified if hasattr(user, 'verified') else False,
            "is_protected": user.protected if hasattr(user, 'protected') else False,
            "last_tweet_at": user.status.created_at if hasattr(user, 'status') and user.status else None
        }

