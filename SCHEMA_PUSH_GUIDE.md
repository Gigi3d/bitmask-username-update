# InstantDB Schema Push Guide

## Problem

CSV upload is failing with error:

```
Validation failed for steps: Attributes are missing in your schema
```

This means the schema defined in `instant.schema.ts` hasn't been pushed to InstantDB production yet.

## Solution Options

### Option 1: Manual Dashboard Update (Recommended for Now)

Since `instant-cli` requires Node.js v20+ (you have v18.20.8), use the InstantDB dashboard:

#### Step 1: Go to InstantDB Dashboard

1. Visit: <https://instantdb.com/dashboard>
2. Select your app (App ID: `e183332d...`)
3. Go to the **"Schema"** tab

#### Step 2: Add csv_uploads Entity

Click "Add Entity" and create `csv_uploads` with these attributes:

| Attribute | Type | Required | Indexed |
|-----------|------|----------|---------|
| uploadName | string | ✅ | ❌ |
| fileName | string | ✅ | ❌ |
| uploadedBy | string | ✅ | ❌ |
| uploadedAt | number | ✅ | ❌ |
| recordCount | number | ✅ | ❌ |

#### Step 3: Update csv_records Entity

If `csv_records` doesn't exist, create it. Add/update these attributes:

| Attribute | Type | Required | Indexed |
|-----------|------|----------|---------|
| oldUsername | string | ✅ | ❌ |
| newUsername | string | ✅ | ❌ |
| npubKey | string | ❌ (optional) | ❌ |
| createdAt | number | ✅ | ❌ |
| uploadId | string | ✅ | ❌ |
| uploadedBy | string | ❌ (optional) | ❌ |

#### Step 4: Create csvUploadRecords Relationship

1. Go to the **"Links"** or **"Relationships"** section
2. Create a new link called `csvUploadRecords`
3. Configure:
   - **Forward**:
     - From: `csv_records`
     - To: `csv_uploads`
     - Cardinality: `one`
     - Label: `upload`
   - **Reverse**:
     - From: `csv_uploads`
     - To: `csv_records`
     - Cardinality: `many`
     - Label: `records`

#### Step 5: Save and Deploy

Click **"Save"** or **"Deploy Schema"** to apply changes.

#### Step 6: Test CSV Upload

1. Go back to your app: <https://bitmask-username-update.vercel.app/admin/dashboard>
2. Try uploading a CSV file
3. It should work now! ✅

---

### Option 2: Upgrade Node.js and Use CLI (Future)

If you want to use the CLI in the future:

1. **Upgrade Node.js to v20+**:

   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20
   
   # Or download from nodejs.org
   ```

2. **Login to InstantDB CLI**:

   ```bash
   npx instant-cli login
   ```

   This will open a browser for authentication.

3. **Push Schema**:

   ```bash
   npx instant-cli push
   ```

   This will push both `instant.schema.ts` and `instant.perms.ts` to production.

---

## Current Schema Reference

Your `instant.schema.ts` defines:

```typescript
entities: {
  csv_uploads: i.entity({
    uploadName: i.string(),
    fileName: i.string(),
    uploadedBy: i.string(),
    uploadedAt: i.number(),
    recordCount: i.number(),
  }),
  csv_records: i.entity({
    oldUsername: i.string(),
    newUsername: i.string(),
    npubKey: i.string().optional(),
    createdAt: i.number(),
    uploadId: i.string(),
    uploadedBy: i.string().optional(),
  }),
  // ... other entities
},
links: {
  csvUploadRecords: {
    forward: { on: "csv_records", has: "one", label: "upload" },
    reverse: { on: "csv_uploads", has: "many", label: "records" }
  },
  // ... other links
}
```

---

## Why This Happened

InstantDB's "auto-sync" feature only works when you **run the app locally** and use the entities. It doesn't automatically sync from deployed code. You need to either:

1. Use the dashboard to manually add entities (Option 1 above)
2. Use `instant-cli push` to push schema from code (requires Node v20+)
3. Run the app locally first, which will auto-sync the schema

---

## Next Steps

**For immediate fix**: Use Option 1 (Manual Dashboard Update)

This will take about 5 minutes and will immediately fix the CSV upload error.
