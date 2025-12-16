# Bitmask Username Update

A Next.js app for Bitmask users to update their usernames from campaign/testnet to mainnet. Simple 2-step process with admin dashboard for CSV management and analytics.

## 🎯 Overview

Users update their Bitmask username in 2 steps. Admins manage campaign data via CSV uploads and track submissions. Each user gets 3 attempts to update their username.

## ✨ Key Features

### 👥 User Features

#### **2-Step Update Flow** (`/update`)

- **Step 1**: Enter old username or nPUB key (63 chars starting with npub1)
- **Step 2**: Enter new mainnet username
- **Success**: Confirmation with submission details

#### **3-Attempt Limit**

- Users can update their username up to 3 times
- All 3 usernames are stored and tracked
- Clear feedback on remaining attempts

#### **Real-Time Validation**

- Username/nPUB format validation
- Cross-reference against campaign CSV records
- Duplicate prevention
- Instant error feedback

#### **Status Checker** (`/status`)

- Check if you've already submitted an update
- Search by old username or nPUB key
- View submission details and remaining attempts
- Track update history

---

### 🔐 Admin Features

#### **Secure Authentication** (`/admin/login`)

- Magic code login via email (InstantDB)
- Role-based access (admin/superadmin)
- Automatic session management

#### **Multi-Admin Support**

- **Regular Admins**: Upload/manage own CSV files, view scoped analytics
- **Superadmins**: Full access to all data, manage admin users, system-wide analytics
- **Data Isolation**: Each admin's uploads tracked separately

#### **CSV Upload & Management** (`/admin/dashboard`)

- Drag-and-drop CSV upload
- Format validation (required: oldUsername, newUsername)
- Duplicate handling
- Upload history tracking

#### **Analytics Dashboard**

- Scoped analytics (superadmins see all, admins see own data)
- Key metrics: total updates, daily/weekly stats, success rate
- Interactive charts with Recharts
- Real-time updates (auto-refresh every 30s)

#### **Real-Time Updates Feed**

- Live stream of new username updates
- Shows old → new username transitions with attempt count
- Auto-refresh via InstantDB

#### **All Records View**

- Complete list of submitted updates
- Search & filter capabilities
- Export and sortable columns

#### **Admin Management** (Superadmin Only)

- Create admin users
- Assign roles (admin/superadmin)
- Email-based access control

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

Submit a username update (max 3 attempts).

**Request:**

```json
{
  "oldUsername": "old_username",
  "newUsername": "new_username"
}
```

**Response:** `200` (success), `400` (validation error), `404` (not found), `409` (max attempts reached)

#### `POST /api/users/verify-old-username`

Verify old username or nPUB exists in campaign data.

### Admin Endpoints

#### `POST /api/csv/upload`

Upload campaign CSV (requires auth).

#### `GET /api/analytics/data`

Get dashboard analytics.

## 📊 Database Schema

InstantDB schema:

**csv_records**: Campaign data

- `oldUsername`, `newUsername`, `createdAt`, `uploadedBy`

**user_updates**: Username updates (3-attempt tracking)

- `oldUsername`, `newUsername1`, `newUsername2`, `newUsername3`
- `attemptCount`, `submittedAt`, `lastUpdatedAt`

**admin_users**: Admin accounts

- `email`, `role` (admin/superadmin), `createdAt`

## 🔐 Authentication

Admin dashboard uses InstantDB magic code auth via `/admin/login`.

## 📝 CSV Format

Required columns:

- `oldUsername`: Campaign/testnet username
- `newUsername`: New mainnet username

Example:

```csv
oldUsername,newUsername
user123,newuser123
user456,newuser456
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
