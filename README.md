# Bitmask Username Update

A Next.js web application designed to help Bitmask users update their usernames during the transition from campaign/testnet to mainnet. The application provides a streamlined 3-step process for users to verify and update their usernames, along with an admin dashboard for managing campaign data and viewing analytics.

## 🎯 Overview

This application facilitates the migration of Bitmask usernames from campaign/testnet to mainnet. Users can submit their username updates through a guided 3-step process, while administrators can manage campaign data via CSV uploads and monitor submission analytics.

## ✨ Key Features

### 👥 User-Facing Features

#### **Welcome & Instructions**

- **Instructions Page**: Clear overview of the username update process
- **FAQ Section**: Answers to common questions
- **Step-by-step Guidance**: Visual walkthrough of the entire process

#### **3-Step Username Update Flow** (`/update`)

- **Step 1 - Old Username**: Enter your campaign/testnet Bitmask username
- **Step 2 - Telegram Verification**: Verify your Telegram account associated with the campaign
- **Step 3 - New Username**: Enter your new mainnet Bitmask wallet username
- **Step 4 - Success Confirmation**: Visual confirmation with submission details

#### **Real-Time Validation**

- **Username Format Validation**: Ensures usernames meet requirements
- **Telegram Handle Validation**: Accepts handles with or without @ symbol
- **Cross-Reference Validation**: Automatically validates against campaign CSV records
- **Duplicate Prevention**: Prevents multiple submissions from the same user
- **Instant Feedback**: Real-time error messages and validation status

#### **Status Checker** (`/status`)

- **Submission Lookup**: Check if you've already submitted an update
- **Search Options**: Search by old username or Telegram account
- **Submission Details**: View your submission details and timestamp
- **Update History**: Track your username migration status

---

### 🔐 Admin Features

#### **Secure Authentication** (`/admin/login`)

- **Magic Code Authentication**: Passwordless login via email (InstantDB)
- **No Password Required**: Secure magic code sent to admin email
- **Session Management**: Automatic session handling and security
- **Role-Based Access**: Different permissions for admins and superadmins

#### **Multi-Admin Support**

- **Regular Admins**:
  - Upload and manage their own CSV files
  - View analytics scoped to their own data
  - Track their own campaign participants
- **Superadmins**:
  - Full access to ALL data from all admins
  - Manage admin users (create, view, assign roles)
  - System-wide analytics and oversight
- **Data Isolation**: Each admin's CSV uploads are tracked and scoped separately
- **Independent Datasets**: Uploading a new CSV replaces only that admin's previous upload

#### **CSV Upload & Management** (`/admin/dashboard`)

- **CSV File Upload**: Upload campaign data with drag-and-drop support
- **Format Validation**: Automatic validation of CSV structure and data
- **Required Columns**: oldUsername, telegramAccount, newUsername
- **Flexible Format**: Handles Telegram accounts with or without @ symbol
- **Duplicate Handling**: Smart handling of duplicate entries
- **Upload History**: Track when and who uploaded CSV files
- **Data Replacement**: New uploads replace previous data for that admin only

#### **Comprehensive Analytics Dashboard**

- **Scoped Analytics**:
  - **Superadmins**: View 100% of ALL data from all admins combined
  - **Regular Admins**: View analytics scoped only to their own CSV data
  
- **Key Metrics**:
  - **Total Updates**: Count of all submitted username updates
  - **Daily Statistics**: Updates submitted per day
  - **Weekly Statistics**: Updates submitted per week
  - **Success Rate**: Percentage of successful validations
  - **Completion Rate**: Percentage of campaign users who updated
  
- **Visual Analytics**:
  - **Interactive Charts**: Beautiful visualizations using Recharts
  - **Activity Timeline**: Time-series graph of submission activity
  - **Trend Analysis**: Daily and weekly trend indicators
  - **Real-Time Updates**: Dashboard refreshes every 30 seconds automatically

#### **Real-Time Username Updates Feed**

- **Live Feed**: Real-time stream of new username updates as they're submitted
- **Update Details**: Shows old username → new username transitions
- **User Information**: Displays associated Telegram account
- **Timestamps**: Exact submission time for each update
- **Auto-Refresh**: Updates automatically without page reload
- **No Manual Refresh**: Leverages InstantDB real-time capabilities

#### **All Updated Records View**

- **Complete List**: View all submitted username updates
- **Search & Filter**: Find specific updates quickly
- **Export Capability**: Download records for external use
- **Timestamp Tracking**: See when each update was submitted
- **Sortable Columns**: Sort by any field (username, date, etc.)

#### **Admin Management** (Superadmin Only)

- **Create Admin Users**: Add new administrators to the system
- **Role Assignment**: Assign admin or superadmin roles
- **View All Admins**: See complete list of admin accounts
- **Access Control**: Manage who can access the admin dashboard
- **Email-Based**: Admin accounts tied to email addresses

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Database**: [InstantDB](https://instantdb.com/) (real-time database)
- **Charts**: Recharts
- **Authentication**: InstantDB Auth

## � Code Optimizations

This codebase has been optimized for performance and maintainability:

### Recent Improvements

- **~200 lines of code removed** through consolidation and refactoring
- **Shared utilities created**: Centralized error handling and validation
- **13 redundant files deleted**: Cleaned up documentation and scripts
- **Consistent API patterns**: All routes use standardized error handling
- **Single source of truth**: Eliminated duplicate normalization logic

### Key Optimizations

- Created `lib/apiHelpers.ts` for standardized API responses and error handling
- Added `normalizeTelegramAccount()` utility (eliminated 5 duplicate instances)
- Refactored all 5 API routes to use shared utilities (~20% code reduction)
- Fixed duplicate variable declarations for better type safety
- Improved code maintainability with consistent patterns

## �📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- InstantDB account and App ID
- (Optional) InstantDB Admin Token for production

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Required: Your InstantDB App ID
NEXT_PUBLIC_INSTANT_APP_ID=your-app-id-here

# Optional: For production admin operations
INSTANT_ADMIN_TOKEN=your-admin-token-here
```

**Note**: For detailed InstantDB setup instructions, see [INSTANTDB_SETUP.md](./INSTANTDB_SETUP.md)

### 3. Run Development Server

```bash
npm run dev
# or without Turbopack (recommended for stability)
npm run dev:no-turbo
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin routes
│   │   ├── dashboard/            # Admin dashboard page
│   │   └── login/                # Admin login page
│   ├── api/                      # API routes
│   │   ├── analytics/            # Analytics data endpoint
│   │   ├── csv/                  # CSV upload endpoint
│   │   └── users/                # User update endpoints
│   ├── update/                   # User update flow page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/instructions page
├── components/                   # React components
│   ├── AdminDashboard.tsx        # Admin dashboard component
│   ├── AdminLogin.tsx            # Admin login component
│   ├── Analytics.tsx             # Analytics charts component
│   ├── CSVUpload.tsx             # CSV upload component
│   └── ...                       # Other components
├── lib/                          # Utility libraries
│   ├── apiHelpers.ts             # Shared API utilities (NEW)
│   ├── auth.ts                   # Authentication helpers
│   ├── instantdb.ts              # InstantDB configuration
│   ├── storage.ts                # Database operations
│   ├── utils.ts                  # Utility functions
│   └── validationHelpers.ts     # Enhanced validation
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Type definitions and schema
└── public/                       # Static assets
```

## 🔌 API Endpoints

### User Endpoints

#### `POST /api/users/update`

Submit a username update request.

**Request Body:**

```json
{
  "oldUsername": "old_username",
  "telegramAccount": "@telegram_handle",
  "newUsername": "new_username"
}
```

**Response:**

- `200`: Update successful
- `400`: Validation error
- `404`: Account not found
- `409`: Duplicate submission
- `500`: Server error

### Admin Endpoints

#### `POST /api/csv/upload`

Upload CSV file with campaign data. Requires admin authentication.

#### `GET /api/analytics/data`

Get analytics data for the dashboard.

## 📊 Database Schema

The application uses InstantDB with the following schema:

### Entities

- **csv_records**: Campaign data records
  - `oldUsername`: string
  - `telegramAccount`: string
  - `newUsername`: string
  - `createdAt`: number (timestamp)
  - `uploadedBy`: string (email of admin who uploaded the CSV)

- **user_updates**: Submitted username updates
  - `oldUsername`: string
  - `telegramAccount`: string
  - `newUsername`: string
  - `submittedAt`: number (timestamp)

- **admin_users**: Admin user records
  - `email`: string
  - `role`: string ('admin' | 'superadmin')
  - `createdAt`: number (timestamp)

## 🔐 Authentication

The admin dashboard uses InstantDB authentication. Admin users must log in through `/admin/login` to access:

- CSV upload functionality
- Analytics dashboard

## 📝 CSV Format

The CSV file should have the following columns:

- `oldUsername`: The username used during the campaign
- `telegramAccount`: The Telegram handle (with or without @)
- `newUsername`: The new mainnet username

Example:

```csv
oldUsername,telegramAccount,newUsername
user123,@telegram_user,newuser123
user456,@another_user,newuser456
```

## 🧪 Development

### Available Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run dev:no-turbo`: Start development server without Turbopack (more stable)
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run analyze`: Analyze bundle size

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Tailwind CSS for styling
- Shared utilities for consistency

## 📚 Additional Documentation

- [INSTANTDB_SETUP.md](./INSTANTDB_SETUP.md) - Detailed InstantDB configuration guide
- [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) - Local development setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

## 🚢 Deployment

The application can be deployed to any platform that supports Next.js:

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you set the following environment variables:

- `NEXT_PUBLIC_INSTANT_APP_ID`
- `INSTANT_ADMIN_TOKEN` (for production)

## 🔒 Security Considerations

- Admin routes are protected with authentication
- CSV data is validated before processing
- User submissions are validated against campaign records
- Duplicate submissions are prevented
- Error messages are sanitized in production
- Rate limiting on API endpoints

## 🐛 Troubleshooting

### Common Issues

#### "NEXT_PUBLIC_INSTANT_APP_ID is not set"

- Verify `.env.local` exists in the root directory
- Check the file contains the correct App ID
- Restart the development server after creating/modifying `.env.local`

#### Slow Compilation

- Use `npm run dev:no-turbo` instead of `npm run dev`
- Clear Next.js cache: `rm -rf .next && npm run dev`

#### Port 3000 Already in Use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## 🆘 Support

For issues or questions:

1. Check the setup guides in the documentation files
2. Verify your InstantDB configuration
3. Check the browser console for errors
4. Review the API response messages

---

**Built with ❤️ for Bitmask community**
