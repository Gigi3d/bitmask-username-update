#!/bin/bash

# Setup script for Twitter Unfollow Bot

echo "Setting up Twitter Unfollow Bot..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cat > .env << EOF
# Twitter API Credentials
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=

# Application Secret Key (generate a random string)
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')

# Database URL (optional, defaults to SQLite)
DATABASE_URL=sqlite:///./twitter_unfollow.db

# Application Settings
INACTIVITY_THRESHOLD_MONTHS=6
BOT_SCORE_THRESHOLD=60
DAILY_UNFOLLOW_LIMIT=50
EOF
    echo ".env file created. Please edit it with your Twitter API credentials."
else
    echo ".env file already exists. Skipping creation."
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your Twitter API credentials"
echo "2. Run: source venv/bin/activate"
echo "3. Run: python -m app.main"
echo "4. Open http://localhost:8000 in your browser"

