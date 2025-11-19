# Bitmask Username Update

A Next.js web application designed to help Bitmask users update their usernames during the transition from campaign/testnet to mainnet. The application provides a streamlined 3-step process for users to verify and update their usernames, along with an admin dashboard for managing campaign data and viewing analytics.

## 🎯 Overview

This application facilitates the migration of Bitmask usernames from campaign/testnet to mainnet. Users can submit their username updates through a guided 3-step process, while administrators can manage campaign data via CSV uploads and monitor submission analytics.

## ✨ Features

### User Features
- **Welcome Page**: Instructions and overview of the update process
- **3-Step Update Flow**:
  1. Input old Bitmask username (from campaign)
  2. Verify Telegram account associated with the campaign
  3. Update to new mainnet Bitmask wallet username
- **Validation**: Automatic validation against campaign records
- **Success Confirmation**: Clear feedback upon successful submission

### Admin Features
- **Secure Authentication**: Admin login system using InstantDB
- **Multi-Admin Support**: 
  - Regular admins can upload their own CSV files with scoped data
  - Each admin's CSV uploads are tracked separately
  - Superadmins can manage other admins
- **CSV Upload**: Upload and manage campaign data (old username, Telegram account, new username)
  - Each admin maintains their own CSV dataset
  - Uploading a new CSV replaces only that admin's previous upload
- **Analytics Dashboard**: 
  - **Superadmins**: See 100% analytics of ALL data from all admins
  - **Regular Admins**: See analytics scoped to their own CSV data only
  - Total updates submitted
  - Daily and weekly update statistics
  - Success rate tracking
  - Activity timeline with interactive charts
- **Real-time Username Updates Feed**: 
  - Live feed of new bitmask username updates as they are submitted
  - Shows old username → new username transitions
  - Displays telegram account and timestamp
  - Updates automatically without page refresh
- **Real-time Data**: Analytics refresh every 30 seconds

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Database**: [InstantDB](https://instantdb.com/) (real-time database)
- **Charts**: Recharts
- **Authentication**: InstantDB Auth

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- InstantDB account and App ID
- (Optional) InstantDB Admin Token for production

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
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
# or
yarn dev
# or
pnpm dev
# or
bun dev
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
│   ├── InstructionsPage.tsx       # Welcome/instructions page
│   ├── Step1Form.tsx             # Step 1: Old username input
│   ├── Step2Form.tsx             # Step 2: Telegram verification
│   ├── Step3Form.tsx             # Step 3: New username input
│   ├── StepIndicator.tsx         # Progress indicator
│   ├── SuccessMessage.tsx        # Success confirmation
│   └── UpdateFlow.tsx            # Main update flow orchestrator
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication helpers
│   ├── instantdb.ts              # InstantDB configuration
│   ├── storage.ts                 # Database operations
│   └── utils.ts                  # Utility functions
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
- `400`: Validation error (missing fields, account not found, username mismatch)
- `409`: Duplicate submission
- `500`: Server error

### Admin Endpoints

#### `POST /api/csv/upload`
Upload CSV file with campaign data. Requires admin authentication.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: CSV file with columns: `oldUsername`, `telegramAccount`, `newUsername`

**Response:**
```json
{
  "message": "CSV uploaded successfully",
  "rowCount": 100
}
```

#### `GET /api/analytics/data`
Get analytics data for the dashboard.

**Response:**
```json
{
  "totalUpdates": 150,
  "updatesPerDay": [{ "date": "2024-01-01", "count": 10 }],
  "updatesPerWeek": [{ "week": "2024-01-01", "count": 50 }],
  "successRate": 100,
  "activityTimeline": [{ "date": "2024-01-01", "count": 10 }]
}
```

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

## 🎨 UI/UX Features

- **Dark Theme**: Black background with yellow accent color
- **Responsive Design**: Works on desktop and mobile devices
- **Step Indicator**: Visual progress tracking through the update process
- **Form Validation**: Real-time validation with clear error messages
- **Interactive Charts**: Recharts-powered analytics visualization
- **Loading States**: Clear feedback during async operations

## 🧪 Development

### Available Scripts

- `npm run dev`: Start development server with Turbo
- `npm run dev:no-turbo`: Start development server without Turbo
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Tailwind CSS for styling

## 📚 Additional Documentation

- [INSTANTDB_SETUP.md](./INSTANTDB_SETUP.md) - Detailed InstantDB configuration guide
- [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) - Local development setup guide

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### HMR (Hot Module Replacement) Errors

If you encounter errors like "Module factory is not available" during development:

1. **Refresh the browser** - The app uses lazy initialization to handle HMR gracefully
2. **Restart the dev server** if the error persists:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
3. **Clear Next.js cache** if issues continue:
   ```bash
   rm -rf .next
   npm run dev
   ```
4. **Use non-Turbo mode** as a fallback:
   ```bash
   npm run dev:no-turbo
   ```

### Common Issues

#### "NEXT_PUBLIC_INSTANT_APP_ID is not set"
- Verify `.env.local` exists in the root directory
- Check the file contains: `NEXT_PUBLIC_INSTANT_APP_ID=e183332d-f1ca-469a-a705-d24f4f39eb12`
- Restart the development server after creating/modifying `.env.local`

#### Magic Code Not Received
- Check spam/junk folder
- Verify email delivery is configured in InstantDB dashboard
- Wait a few minutes and try again
- Check browser console for errors

#### "Telegram account not found in campaign records"
- Admin must upload CSV file first via `/admin/dashboard`
- Ensure CSV contains the user's Telegram account
- Verify CSV format is correct (oldUsername,telegramAccount,newUsername)

#### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Build/Compilation Errors
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Next.js cache: `rm -rf .next`
4. Restart the development server

## 🆘 Support

For issues or questions:
1. Check the setup guides in the documentation files
2. Verify your InstantDB configuration
3. Check the browser console for errors
4. Review the API response messages
5. See the Troubleshooting section above

---

**Built with ❤️ for Bitmask community**
