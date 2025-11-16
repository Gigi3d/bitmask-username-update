# Admin User Management Scripts

## Adding Root Admin User

This directory contains scripts for managing admin users in the InstantDB database.

### Prerequisites

To add an admin user programmatically, you need:

1. **INSTANT_ADMIN_TOKEN** - Get this from your InstantDB dashboard:
   - Go to https://instantdb.com/dashboard
   - Navigate to your app settings
   - Copy the admin token
   - Add it to your `.env.local` file:
     ```
     INSTANT_ADMIN_TOKEN=your-admin-token-here
     ```

2. **admin_users entity** - Make sure the `admin_users` entity exists in your InstantDB schema with:
   - `email` (string)
   - `role` (string) 
   - `createdAt` (number)

### Method 1: Using the Script

Run the script to add `gideon@diba.io` as a superadmin:

```bash
npm run add-root-admin
```

This will:
- Add `gideon@diba.io` as a superadmin
- Give them privileges to add other admins
- Allow them to access the admin dashboard

### Method 2: Using the API Route

If you prefer to use an API call, you can POST to `/api/admin/create`:

```bash
curl -X POST http://localhost:3000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"email": "gideon@diba.io", "role": "superadmin"}'
```

### Method 3: Manual Login (Alternative)

If you don't have an admin token yet:

1. Navigate to `/admin/login`
2. Log in with `gideon@diba.io` using magic code authentication
3. The first user to log in automatically becomes an admin
4. **Note:** This will create them as a regular admin, not superadmin. To upgrade to superadmin, you'll need to use Method 1 or 2 with an admin token.

### Troubleshooting

**Error: "INSTANT_ADMIN_TOKEN is required"**
- Make sure you've added the admin token to `.env.local`
- Get your admin token from the InstantDB dashboard

**Error: "Admin token required"**
- Verify the token is correct and has the necessary permissions
- Check that the token hasn't expired

**Error: "Cannot read properties of undefined"**
- Verify the `admin_users` entity exists in your InstantDB schema
- Make sure the entity has the correct fields: `email`, `role`, `createdAt`

**Error: "already exists"**
- The admin user is already in the database
- No action needed

### Admin Roles

- **admin**: Regular admin with access to dashboard and CSV upload
- **superadmin**: Root admin with privileges to add other admins

The script sets `gideon@diba.io` as a **superadmin** by default.

