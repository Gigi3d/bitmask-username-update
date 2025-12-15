"""Tests for the analyzer module."""
import pytest
from datetime import datetime, timedelta
from app.analyzer import FollowerAnalyzer


def test_inactive_account_detection():
    """Test detection of inactive accounts."""
    analyzer = FollowerAnalyzer()
    
    # Account with no tweets
    follower = {
        "twitter_id": "123",
        "username": "testuser",
        "tweet_count": 0,
        "followers_count": 50,
        "account_created_at": datetime.utcnow() - timedelta(days=365)
    }
    
    result = analyzer.analyze_follower(follower)
    assert result["is_inactive"] == True


def test_bot_detection_default_profile():
    """Test bot detection for default profile picture."""
    analyzer = FollowerAnalyzer()
    
    follower = {
        "twitter_id": "123",
        "username": "testuser",
        "profile_image_url": "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
        "bio": "",
        "followers_count": 10,
        "following_count": 5000,
        "tweet_count": 100,
        "account_created_at": datetime.utcnow() - timedelta(days=30)
    }
    
    result = analyzer.analyze_follower(follower)
    assert result["bot_score"] > 60
    assert result["is_bot"] == True


def test_bot_detection_low_ratio():
    """Test bot detection for low follower/following ratio."""
    analyzer = FollowerAnalyzer()
    
    follower = {
        "twitter_id": "123",
        "username": "testuser",
        "followers_count": 10,
        "following_count": 5000,
        "tweet_count": 100,
        "account_created_at": datetime.utcnow() - timedelta(days=100)
    }
    
    result = analyzer.analyze_follower(follower)
    assert result["bot_score"] >= 20  # Should have high score for low ratio


def test_legitimate_account():
    """Test that legitimate accounts are not flagged."""
    analyzer = FollowerAnalyzer()
    
    follower = {
        "twitter_id": "123",
        "username": "legituser",
        "bio": "Real person with real bio",
        "profile_image_url": "https://pbs.twimg.com/profile_images/custom.jpg",
        "followers_count": 1000,
        "following_count": 500,
        "tweet_count": 500,
        "last_tweet_at": datetime.utcnow() - timedelta(days=1),
        "account_created_at": datetime.utcnow() - timedelta(days=365)
    }
    
    result = analyzer.analyze_follower(follower)
    assert result["bot_score"] < 60
    assert result["is_bot"] == False
    assert result["is_inactive"] == False

