# Twitter Unfollow Bot

A web-based tool to analyze your Twitter followers, identify bots and inactive accounts, and safely remove them to improve your account's reach.

## Features

- **Follower Analysis**: Automatically fetch and analyze all your Twitter followers
- **Bot Detection**: Advanced algorithm to identify bot accounts based on multiple criteria:
  - Profile quality (default pictures, empty bios)
  - Account metrics (follower/following ratios)
  - Activity patterns (tweet frequency, engagement)
  - Username patterns
- **Inactivity Detection**: Identify accounts that haven't tweeted in configurable time periods
- **Safe Unfollowing**: Batch unfollow with rate limiting and daily limits
- **Web Interface**: Modern, responsive dashboard with filtering and sorting
- **Export**: Download analysis results as CSV
- **Audit Log**: Track all unfollow actions

## Prerequisites

- Python 3.10 or higher
- Twitter Developer Account with API credentials
- Twitter API v1.1 access (for OAuth and follower management)

## Installation

1. **Clone or navigate to the repository:**
   ```bash
   cd twitter-unfollow-bot
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Twitter API credentials:
   ```env
   TWITTER_API_KEY=your_api_key_here
   TWITTER_API_SECRET=your_api_secret_here
   SECRET_KEY=your_random_secret_key_here
   ```

5. **Initialize the database:**
   The database will be automatically created on first run.

## Getting Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Navigate to "Keys and tokens"
4. Generate API Key and Secret
5. Set up OAuth 1.0a (required for follower management)
6. Add your callback URL: `http://localhost:8000/auth/callback` (for local development)

## Usage

1. **Start the application:**
   ```bash
   python -m app.main
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8000`

3. **Login with Twitter:**
   Click "Login with Twitter" and authorize the application

4. **Analyze Followers:**
   Click "Analyze Followers" to fetch and analyze all your followers
   - This may take a while if you have many followers
   - Progress will be shown in the console

5. **Review Results:**
   - View statistics in the dashboard
   - Filter by bots, inactive accounts, or both
   - Sort by bot score, username, followers, etc.
   - Search for specific usernames

6. **Unfollow Accounts:**
   - Select accounts using checkboxes
   - Click "Unfollow Selected"
   - Confirm the action
   - The tool respects rate limits and daily limits

7. **Export Data:**
   Click "Export CSV" to download analysis results

## Configuration

Edit `.env` file to customize:

- `INACTIVITY_THRESHOLD_MONTHS`: Months without tweets to consider inactive (default: 6)
- `BOT_SCORE_THRESHOLD`: Bot score threshold (0-100, default: 60)
- `DAILY_UNFOLLOW_LIMIT`: Maximum unfollows per day (default: 50)

## Bot Detection Criteria

The bot detection algorithm scores accounts based on:

- **Profile Quality** (up to 30 points):
  - Default profile picture: +15 points
  - Empty bio: +10 points
  - Very short bio: +5 points
  - No banner: +5 points

- **Account Metrics** (up to 50 points):
  - Low follower/following ratio (<0.1): +20 points
  - Mass following (>5000) with low followers: +25 points
  - New account (<30 days) with high activity: +15 points
  - Suspicious follower counts: +5 points

- **Activity Patterns** (up to 20 points):
  - Extremely high tweet frequency (>50/day): +20 points
  - High tweet frequency (>20/day): +10 points

- **Username Patterns** (up to 18 points):
  - Suspicious patterns: +10 points
  - Too many numbers: +8 points
  - Very short username: +5 points

Accounts with a score ≥60 are flagged as bots.

## Safety Features

- **Rate Limiting**: Automatically handles Twitter API rate limits
- **Daily Limits**: Configurable daily unfollow limit (default: 50)
- **Confirmation Dialogs**: Requires confirmation before unfollowing
- **Audit Logging**: All actions are logged for review
- **Error Handling**: Graceful error handling with user feedback

## API Endpoints

- `GET /` - Home page (redirects to dashboard)
- `GET /dashboard` - Main dashboard
- `GET /auth/login` - Initiate Twitter OAuth
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/logout` - Logout
- `GET /api/followers` - Get followers (with pagination and filtering)
- `POST /api/analyze` - Analyze followers from Twitter
- `POST /api/unfollow` - Unfollow selected users
- `GET /api/stats` - Get dashboard statistics
- `GET /api/export/csv` - Export followers to CSV
- `GET /api/unfollow-history` - Get unfollow history

## Development

### Running Tests

```bash
pytest tests/
```

### Project Structure

```
twitter-unfollow-bot/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── models.py            # Database models
│   ├── twitter_client.py    # Twitter API wrapper
│   ├── analyzer.py          # Bot/inactivity detection
│   ├── routes/              # API routes
│   │   ├── auth.py          # Authentication
│   │   ├── dashboard.py     # Dashboard routes
│   │   └── api.py           # API endpoints
│   ├── templates/           # Jinja2 templates
│   │   ├── base.html
│   │   ├── login.html
│   │   └── dashboard.html
│   └── static/             # Static files
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Deployment

### Heroku

1. Create a `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

2. Deploy:
   ```bash
   heroku create
   heroku config:set TWITTER_API_KEY=...
   heroku config:set TWITTER_API_SECRET=...
   heroku config:set SECRET_KEY=...
   git push heroku main
   ```

### Railway

1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Limitations

- Twitter API rate limits apply (varies by endpoint)
- Large follower lists may take time to analyze
- Some bot detection criteria may have false positives
- OAuth tokens expire after 30 days (re-login required)

## Security Notes

- Never commit `.env` file with real credentials
- Use strong `SECRET_KEY` in production
- Enable HTTPS in production
- Regularly rotate API credentials
- Review unfollow actions before confirming

## License

This project is for personal use. Ensure compliance with Twitter's Terms of Service and API Usage Policies.

## Disclaimer

This tool is provided as-is. Use at your own risk. Always review accounts before unfollowing. The authors are not responsible for any account actions or consequences.

## Support

For issues or questions:
1. Check Twitter API status
2. Verify your API credentials
3. Review error logs
4. Check rate limit status

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

