"""Bot and inactivity detection analyzer."""
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
from app.config import settings

# Default profile image patterns (Twitter default avatars)
DEFAULT_PROFILE_PATTERNS = [
    "default_profile",
    "default_profile_normal",
    "egg",
    "twimg.com/images/themes/theme1/bg.png"
]


class FollowerAnalyzer:
    """Analyzes followers to detect bots and inactive accounts."""
    
    def __init__(self):
        """Initialize analyzer with configuration."""
        self.inactivity_threshold = timedelta(days=settings.inactivity_threshold_months * 30)
        self.bot_threshold = settings.bot_score_threshold
    
    def analyze_follower(self, follower_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single follower and return analysis results.
        
        Args:
            follower_data: Dictionary containing follower information
        
        Returns:
            Dictionary with analysis results including bot_score, is_bot, is_inactive, flags
        """
        bot_score = 0.0
        flags = []
        
        # Check inactivity
        is_inactive = self._check_inactivity(follower_data)
        
        # Check profile quality
        profile_score, profile_flags = self._analyze_profile_quality(follower_data)
        bot_score += profile_score
        flags.extend(profile_flags)
        
        # Check account metrics
        metrics_score, metrics_flags = self._analyze_account_metrics(follower_data)
        bot_score += metrics_score
        flags.extend(metrics_flags)
        
        # Check activity patterns
        activity_score, activity_flags = self._analyze_activity_patterns(follower_data)
        bot_score += activity_score
        flags.extend(activity_flags)
        
        # Check username patterns
        username_score, username_flags = self._analyze_username(follower_data.get("username", ""))
        bot_score += username_score
        flags.extend(username_flags)
        
        # Determine if bot
        is_bot = bot_score >= self.bot_threshold
        
        return {
            "bot_score": min(bot_score, 100.0),  # Cap at 100
            "is_bot": is_bot,
            "is_inactive": is_inactive,
            "flags": flags,
            "analysis_date": datetime.utcnow()
        }
    
    def _check_inactivity(self, follower_data: Dict[str, Any]) -> bool:
        """Check if account is inactive."""
        last_tweet_at = follower_data.get("last_tweet_at")
        account_created_at = follower_data.get("account_created_at")
        tweet_count = follower_data.get("tweet_count", 0)
        followers_count = follower_data.get("followers_count", 0)
        
        # Never tweeted and has low followers
        if tweet_count == 0 and followers_count < 100:
            return True
        
        # No last tweet data
        if not last_tweet_at:
            # If account is old and has no tweets, consider inactive
            if account_created_at:
                account_age = datetime.utcnow() - account_created_at
                if account_age > timedelta(days=365) and tweet_count == 0:
                    return True
            return False
        
        # Check if last tweet is beyond threshold
        time_since_last_tweet = datetime.utcnow() - last_tweet_at
        if time_since_last_tweet > self.inactivity_threshold:
            return True
        
        return False
    
    def _analyze_profile_quality(self, follower_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Analyze profile quality indicators."""
        score = 0.0
        flags = []
        
        # Default profile picture
        profile_image = follower_data.get("profile_image_url", "")
        if profile_image:
            if any(pattern in profile_image.lower() for pattern in DEFAULT_PROFILE_PATTERNS):
                score += 15.0
                flags.append("default_profile_picture")
        
        # Empty or generic bio
        bio = follower_data.get("bio", "")
        if not bio or len(bio.strip()) == 0:
            score += 10.0
            flags.append("empty_bio")
        elif len(bio) < 10:
            score += 5.0
            flags.append("very_short_bio")
        
        # No banner
        if not follower_data.get("banner_url"):
            score += 5.0
            flags.append("no_banner")
        
        return score, flags
    
    def _analyze_account_metrics(self, follower_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Analyze account metrics for bot indicators."""
        score = 0.0
        flags = []
        
        followers_count = follower_data.get("followers_count", 0)
        following_count = follower_data.get("following_count", 0)
        tweet_count = follower_data.get("tweet_count", 0)
        account_created_at = follower_data.get("account_created_at")
        
        # Follower-to-following ratio
        if following_count > 0:
            ratio = followers_count / following_count
            if ratio < 0.1 and following_count > 100:
                score += 20.0
                flags.append("low_follower_following_ratio")
            elif ratio < 0.2 and following_count > 500:
                score += 10.0
                flags.append("suspicious_follower_following_ratio")
        
        # Following too many with low followers
        if following_count > 5000 and followers_count < 100:
            score += 25.0
            flags.append("mass_following_low_followers")
        
        # Account age vs activity
        if account_created_at:
            account_age = datetime.utcnow() - account_created_at
            if account_age < timedelta(days=30):
                # New account with high activity
                if tweet_count > 500:
                    score += 15.0
                    flags.append("new_account_high_activity")
                # New account following many
                if following_count > 1000:
                    score += 10.0
                    flags.append("new_account_mass_following")
        
        # Suspicious follower count (too round numbers)
        if followers_count > 0 and followers_count % 1000 == 0:
            score += 5.0
            flags.append("suspicious_follower_count")
        
        return score, flags
    
    def _analyze_activity_patterns(self, follower_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Analyze activity patterns."""
        score = 0.0
        flags = []
        
        tweet_count = follower_data.get("tweet_count", 0)
        account_created_at = follower_data.get("account_created_at")
        
        if account_created_at and tweet_count > 0:
            account_age = datetime.utcnow() - account_created_at
            if account_age.total_seconds() > 0:
                days_old = account_age.days or 1
                tweets_per_day = tweet_count / days_old
                
                # Extremely high tweet frequency
                if tweets_per_day > 50:
                    score += 20.0
                    flags.append("extremely_high_tweet_frequency")
                elif tweets_per_day > 20:
                    score += 10.0
                    flags.append("high_tweet_frequency")
        
        return score, flags
    
    def _analyze_username(self, username: str) -> Tuple[float, List[str]]:
        """Analyze username for suspicious patterns."""
        score = 0.0
        flags = []
        
        if not username:
            return score, flags
        
        # Random numbers/letters pattern
        if re.match(r'^[a-z]+\d{4,}', username.lower()) or re.match(r'^\d+[a-z]+', username.lower()):
            score += 10.0
            flags.append("suspicious_username_pattern")
        
        # Too many numbers
        digit_count = sum(c.isdigit() for c in username)
        if len(username) > 0 and digit_count / len(username) > 0.5:
            score += 8.0
            flags.append("username_too_many_numbers")
        
        # Very short username
        if len(username) < 4:
            score += 5.0
            flags.append("very_short_username")
        
        return score, flags
    
    def batch_analyze(self, followers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze multiple followers.
        
        Args:
            followers: List of follower dictionaries
        
        Returns:
            List of analysis results
        """
        results = []
        for follower in followers:
            analysis = self.analyze_follower(follower)
            results.append({
                **follower,
                **analysis
            })
        return results

