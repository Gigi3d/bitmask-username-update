# Local Setup & Usage Guide

## Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18 or higher) installed
- **npm** (comes with Node.js)
- An **InstantDB account** with your app configured
- Access to the email address you'll use for admin login

## Step-by-Step Setup

### Step 1: Verify Environment File

The `.env.local` file should already exist with:
```
NEXT_PUBLIC_INSTANT_APP_ID=e183332d-f1ca-469a-a705-d24f4f39eb12
```

If it doesn't exist, create it in the root directory.

### Step 2: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Next.js
- React
- InstantDB packages
- Other dependencies

### Step 3: Configure InstantDB Schema

**Important:** Before running the app, you need to configure the schema in your InstantDB dashboard:

1. Log into your InstantDB dashboard
2. Navigate to your app (ID: `e183332d-f1ca-469a-a705-d24f4f39eb12`)
3. Go to the Schema section
4. Add the following entities:

   **Entity: `csv_records`**
   - `oldUsername` (string)
   - `telegramAccount` (string)
   - `newUsername` (string)
   - `createdAt` (number)

   **Entity: `user_updates`**
   - `oldUsername` (string)
   - `telegramAccount` (string)
   - `newUsername` (string)
   - `submittedAt` (number)

   **Entity: `admin_users`** (optional, for future use)
   - `email` (string)
   - `role` (string)
   - `createdAt` (number)

5. Configure email delivery for magic code authentication in InstantDB settings

### Step 4: Start the Development Server

Run the development server:

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 16.0.3
- Local:        http://localhost:3000
- Ready in X seconds
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## How to Use the Application

The application has two main user flows:

### 1. Public User Flow (Username Update)

**Purpose:** Allows users to update their Bitmask username for mainnet.

**Steps:**

1. **Home Page** (`http://localhost:3000`)
   - Read the instructions
   - Click "START" button

2. **Step 1: Enter Old Username**
   - Enter the username you used during the campaign
   - Click "Next"

3. **Step 2: Verify Telegram Account**
   - Enter your Telegram account (e.g., `@username`)
   - The system verifies it against campaign records
   - Click "Next" if verified

4. **Step 3: Enter New Username**
   - Enter your new mainnet Bitmask username
   - The system validates it matches the expected value from records
   - Click "Submit"

5. **Success Screen**
   - Confirmation that your username has been updated
   - Shows old and new username

**Note:** Users can only update if their Telegram account exists in the uploaded CSV records.

### 2. Admin Flow (Dashboard Management)

**Purpose:** Allows admins to upload CSV data and view analytics.

#### A. First-Time Admin Login

1. Navigate to: `http://localhost:3000/admin/login`

2. **Enter Email**
   - Enter your email address
   - Click "Send Magic Code"
   - Check your email for the magic code (usually arrives within seconds)

3. **Enter Magic Code**
   - Enter the 6-digit code from your email
   - Click "Verify Code"
   - You'll be automatically redirected to the dashboard

**Note:** The first user to sign in with an email becomes an admin automatically.

#### B. Admin Dashboard Features

Once logged in at `http://localhost:3000/admin/dashboard`, you can:

**1. Upload CSV File**
   - Click "Choose File" or drag and drop a CSV file
   - CSV format should be:
     ```
     oldUsername,telegramAccount,newUsername
     user1,@telegram1,newuser1
     user2,@telegram2,newuser2
     ```
   - Click "Upload CSV"
   - The system will:
     - Parse and validate the CSV
     - Store records in InstantDB
     - Show success message with row count
     - Warn about any duplicate Telegram accounts

**2. View Analytics**
   - **Total Updates:** Number of username updates submitted
   - **Updates Per Day:** Daily breakdown of updates
   - **Updates Per Week:** Weekly aggregation
   - **Success Rate:** Percentage of successful updates
   - **Activity Timeline:** Visual chart of update activity

**3. Logout**
   - Click "Logout" button in the top right
   - You'll be redirected to the login page

## Application Structure

### Routes

- `/` - Home page with instructions
- `/update` - User update flow (3-step process)
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Admin dashboard (protected)

### API Endpoints

- `POST /api/users/update` - Submit username update
- `POST /api/users/verify` - Verify Telegram account
- `POST /api/csv/upload` - Upload CSV (admin only)
- `GET /api/analytics/data` - Get analytics data

## Troubleshooting

### Issue: "NEXT_PUBLIC_INSTANT_APP_ID is not set"

**Solution:**
- Verify `.env.local` exists in the root directory
- Check the file contains: `NEXT_PUBLIC_INSTANT_APP_ID=e183332d-f1ca-469a-a705-d24f4f39eb12`
- Restart the development server after creating/modifying `.env.local`

### Issue: Magic Code Not Received

**Solutions:**
1. Check spam/junk folder
2. Verify email is configured in InstantDB dashboard
3. Check InstantDB dashboard for email delivery settings
4. Wait a few minutes and try again
5. Check browser console for errors

### Issue: "Telegram account not found in campaign records"

**Solution:**
- Admin must upload CSV file first via `/admin/dashboard`
- Ensure CSV contains the user's Telegram account
- Verify CSV format is correct (oldUsername,telegramAccount,newUsername)

### Issue: Build/Compilation Errors

**Solutions:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Next.js cache: `rm -rf .next`
4. Restart the development server

### Issue: Database Connection Errors

**Solutions:**
1. Verify InstantDB App ID is correct
2. Check your internet connection
3. Verify schema is configured in InstantDB dashboard
4. Check InstantDB dashboard for service status

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Development Commands

```bash
# Start development server
npm run dev

# Start without Turbopack (if you encounter issues)
npm run dev:no-turbo

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Next Steps After Setup

1. **Test the Admin Flow:**
   - Log in as admin
   - Upload a test CSV file
   - Verify data appears in InstantDB dashboard

2. **Test the User Flow:**
   - Use a Telegram account from your CSV
   - Complete the 3-step update process
   - Verify the update appears in analytics

3. **Monitor Analytics:**
   - Check the analytics dashboard regularly
   - Monitor update trends and success rates

## Production Deployment

When ready for production:

1. Set environment variables in your hosting platform
2. Build the application: `npm run build`
3. Deploy to your hosting service (Vercel, Netlify, etc.)
4. Configure production InstantDB settings
5. Set up `INSTANT_ADMIN_TOKEN` for enhanced security

## Support

For issues specific to:
- **InstantDB:** Check [InstantDB Documentation](https://www.instantdb.com/docs)
- **Next.js:** Check [Next.js Documentation](https://nextjs.org/docs)
- **Application Issues:** Review error messages in browser console and server logs

