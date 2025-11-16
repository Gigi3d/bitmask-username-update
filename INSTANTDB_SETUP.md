# InstantDB Integration - Setup Guide

## Overview
This application has been fully integrated with InstantDB for authentication and database storage. All in-memory storage has been replaced with persistent InstantDB operations.

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```bash
NEXT_PUBLIC_INSTANT_APP_ID=e183332d-f1ca-469a-a705-d24f4f39eb12
```

### Optional (for production)
```bash
INSTANT_ADMIN_TOKEN=your-admin-token-here
```

## Database Schema

**⚠️ IMPORTANT:** Before using the application, you must configure the schema in your InstantDB dashboard. See **[INSTANTDB_SCHEMA_SETUP.md](./INSTANTDB_SCHEMA_SETUP.md)** for detailed step-by-step instructions.

The application uses the following InstantDB schema:

### Entities

1. **csv_records**
   - `oldUsername` (string)
   - `telegramAccount` (string)
   - `newUsername` (string)
   - `createdAt` (number)

2. **user_updates**
   - `oldUsername` (string)
   - `telegramAccount` (string)
   - `newUsername` (string)
   - `submittedAt` (number)

3. **admin_users**
   - `email` (string)
   - `role` (string)
   - `createdAt` (number)

## Authentication

The application uses InstantDB's **Magic Code Authentication** for admin login:

1. Admin enters their email address
2. A magic code is sent to their email
3. Admin enters the code to complete authentication

### First-Time Setup

1. Navigate to `/admin/login`
2. Enter your email address
3. Check your email for the magic code
4. Enter the code to sign in

**Note:** The first user to sign in with an email will automatically be created as an admin user.

## API Routes

All API routes have been migrated to use InstantDB:

- `/api/csv/upload` - Protected admin route for CSV uploads
- `/api/users/update` - Public route for user updates
- `/api/users/verify` - Public route for user verification
- `/api/analytics/data` - Public route for analytics data

## Key Files

- `lib/instantdb.ts` - InstantDB client and admin initialization
- `lib/storage.ts` - Database operations (replaces in-memory storage)
- `lib/auth.ts` - Server-side authentication helpers
- `types/index.ts` - TypeScript types and schema definition
- `components/AdminLogin.tsx` - Magic code authentication UI
- `components/AdminDashboard.tsx` - Protected admin dashboard

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up `.env.local` with your InstantDB App ID

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Access the admin dashboard at `http://localhost:3000/admin/login`

## Production Deployment

1. Set environment variables in your hosting platform:
   - `NEXT_PUBLIC_INSTANT_APP_ID`
   - `INSTANT_ADMIN_TOKEN` (recommended for production)

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## Important Notes

- The schema is defined in `types/index.ts` and must match your InstantDB dashboard configuration
- Admin authentication uses magic codes (passwordless)
- All database operations are now persistent and stored in InstantDB
- Server-side operations use the Admin SDK for elevated privileges
- Client-side operations use the React SDK with reactive hooks

## Troubleshooting

### Build Errors
If you encounter TypeScript errors related to the schema, ensure:
- The schema structure matches InstantDB's expected format
- All required properties (entities, links, rooms) are defined

### Authentication Issues
- Verify your InstantDB App ID is correct
- Check that email delivery is configured in your InstantDB dashboard
- Ensure the magic code hasn't expired (typically 10-15 minutes)

### Database Connection
- Verify your App ID is correct
- Check network connectivity
- Review InstantDB dashboard for any service issues

