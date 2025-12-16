# InstantDB Schema Configuration Guide

## Overview

This guide will walk you through configuring all required entities in your InstantDB dashboard. The schema must match exactly what's defined in `types/index.ts`.

## Step-by-Step Instructions

### Step 1: Access InstantDB Dashboard

1. Go to **<https://instantdb.com/dashboard>**
2. Log in with your InstantDB account
3. Find and select your app with ID: `e183332d-f1ca-469a-a705-d24f4f39eb12`

### Step 2: Navigate to Schema Section

1. In your app dashboard, look for **"Schema"** or **"Data Model"** in the sidebar
2. Click on it to open the schema editor

### Step 3: Add Entity 1: `csv_records`

**Purpose:** Stores campaign data (old username and new username)

1. Click **"Add Entity"** or **"New Entity"** button
2. Enter entity name: `csv_records` (exact name, lowercase with underscore)
3. Add the following fields:

   | Field Name | Type | Required | Description |
   |------------|------|----------|-------------|
   | `oldUsername` | string | Yes | Old Bitmask username from campaign |
   | `newUsername` | string | Yes | New mainnet Bitmask username |
   | `createdAt` | number | Yes | Timestamp when record was created |
   | `uploadedBy` | string | Yes | Email of the admin who uploaded the CSV |

4. Save the entity

### Step 4: Add Entity 2: `user_updates`

**Purpose:** Stores user-submitted username updates

1. Click **"Add Entity"** or **"New Entity"** button
2. Enter entity name: `user_updates` (exact name, lowercase with underscore)
3. Add the following fields:

   | Field Name | Type | Required | Description |
   |------------|------|----------|-------------|
   | `oldUsername` | string | Yes | Old username submitted by user |
   | `newUsername` | string | Yes | New username submitted by user |
   | `submittedAt` | number | Yes | Timestamp when update was submitted |

4. Save the entity

### Step 5: Add Entity 3: `admin_users`

**Purpose:** Stores admin user records for authentication

1. Click **"Add Entity"** or **"New Entity"** button
2. Enter entity name: `admin_users` (exact name, lowercase with underscore)
3. Add the following fields:

   | Field Name | Type | Required | Description |
   |------------|------|----------|-------------|
   | `email` | string | Yes | Admin user's email address |
   | `role` | string | Yes | Admin role: "admin" or "superadmin" |
   | `createdAt` | number | Yes | Timestamp when admin was created |

4. Save the entity

### Step 6: Verify Schema

Your schema should now have exactly 3 entities:

1. ✅ `csv_records` (4 fields: oldUsername, newUsername, createdAt, uploadedBy)
2. ✅ `user_updates` (3 fields: oldUsername, newUsername, submittedAt)
3. ✅ `admin_users` (3 fields: email, role, createdAt)

### Step 7: Configure Email Delivery (for Magic Code Auth)

1. In your InstantDB dashboard, go to **"Settings"** or **"Auth"** section
2. Find **"Email Delivery"** or **"Magic Code"** settings
3. Configure email delivery service (InstantDB may use a default or require setup)
4. This is required for admin login magic codes to be sent

### Step 8: Verify Configuration

After completing the above steps:

1. **Save all changes** in the InstantDB dashboard
2. Wait a few seconds for the schema to propagate
3. Run the admin creation script:

```bash
export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts
```

## Quick Reference: Complete Schema

```json
{
  "entities": {
    "csv_records": {
      "oldUsername": "string",
      "newUsername": "string",
      "createdAt": "number",
      "uploadedBy": "string"
    },
    "user_updates": {
      "oldUsername": "string",
      "newUsername": "string",
      "submittedAt": "number"
    },
    "admin_users": {
      "email": "string",
      "role": "string",
      "createdAt": "number"
    }
  },
  "links": {},
  "rooms": {}
}
```

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'email')"

- **Cause:** The `admin_users` entity doesn't exist or fields don't match
- **Solution:** Verify all 3 entities exist with exact field names and types

### Error: "Entity not found"

- **Cause:** Entity name doesn't match (case-sensitive, must be lowercase with underscores)
- **Solution:** Ensure entity names are exactly: `csv_records`, `user_updates`, `admin_users`

### Error: "Field type mismatch"

- **Cause:** Field types don't match (e.g., using "text" instead of "string", "integer" instead of "number")
- **Solution:** Use exact types: `string` for text fields, `number` for timestamps

### Schema Changes Not Reflecting

- Wait 10-30 seconds after saving
- Refresh the dashboard
- Try running the script again

## Next Steps

After schema is configured:

1. ✅ Run the admin creation script
2. ✅ Test admin login at `/admin/login`
3. ✅ Upload a test CSV file
4. ✅ Verify analytics dashboard works

## Support

If you encounter issues:

- Check InstantDB dashboard for any error messages
- Verify all field names match exactly (case-sensitive)
- Ensure field types are correct (string/number)
- Check that entities are saved and visible in the schema view
