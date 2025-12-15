# Quick Start Guide

## Prerequisites

1. Python 3.10 or higher installed
2. Twitter Developer Account with API credentials

## Setup Steps

### 1. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

Or use the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
SECRET_KEY=generate_a_random_secret_key_here
```

You can generate a secret key with:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 3. Get Twitter API Credentials

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing one
3. Go to "Keys and tokens"
4. Copy your API Key and Secret
5. Set up OAuth 1.0a callback URL: `http://localhost:8000/auth/callback`

### 4. Run the Application

```bash
python -m app.main
```

Or:
```bash
uvicorn app.main:app --reload
```

### 5. Access the Application

Open your browser and go to: `http://localhost:8000`

### 6. First Use

1. Click "Login with Twitter"
2. Authorize the application
3. Click "Analyze Followers" to fetch and analyze your followers
4. Review the results in the dashboard
5. Select accounts to unfollow and click "Unfollow Selected"

## Troubleshooting

### Database Issues
- The database is created automatically on first run
- If you need to reset, delete `twitter_unfollow.db`

### OAuth Issues
- Make sure callback URL matches exactly: `http://localhost:8000/auth/callback`
- Check that your Twitter app has OAuth 1.0a enabled
- Verify API keys are correct in `.env`

### Rate Limits
- Twitter API has rate limits
- The tool automatically handles rate limits with delays
- If you hit limits, wait 15 minutes and try again

### Import Errors
- Make sure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Customize detection thresholds in `.env`
- Review unfollow history in the dashboard

