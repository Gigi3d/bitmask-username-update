# CSV Viewer Schema Update Guide

## ⚠️ IMPORTANT: Manual Schema Update Required

The CSV viewer feature requires updating your InstantDB schema in the dashboard. Follow these steps:

## Step 1: Access InstantDB Dashboard

1. Go to: <https://instantdb.com/dashboard>
2. Select your app
3. Navigate to the **Schema** tab

## Step 2: Update the Schema

Add the following to your schema:

### New Entity: `csv_uploads`

```typescript
csv_uploads: {
  uploadName: string (required)
  fileName: string (required)
  uploadedBy: string (required)
  uploadedAt: number (required)
  recordCount: number (required)
}
```

### Update Entity: `csv_records`

Add this field to the existing `csv_records` entity:

```typescript
uploadId: string (required)
```

### New Link: `csvUploadRecords`

Create a relationship between uploads and records:

```typescript
csvUploadRecords: {
  forward: {
    on: "csv_records",
    has: "one",
    label: "upload"
  },
  reverse: {
    on: "csv_uploads",
    has: "many",
    label: "records"
  }
}
```

## Step 3: Save and Deploy

1. Click **"Save"** or **"Deploy Schema"** in the InstantDB dashboard
2. Wait for the schema to deploy (usually takes a few seconds)

## Step 4: Verify

After deploying the schema:

1. Go to your admin dashboard
2. Upload a CSV file with a custom name
3. The upload should appear in the CSV Viewer section
4. Click to expand and view paginated records

## Troubleshooting

### Error: "Attributes are missing in your schema"

This means the schema in the dashboard doesn't match the local schema. Make sure:

- All fields are added correctly
- Field types match exactly (string, number, etc.)
- The link is created properly

### Existing CSV Records

Since we're starting fresh, any existing `csv_records` without an `uploadId` will cause errors. The new upload flow will automatically create the `uploadId` for all new uploads.

## Features Available After Update

✅ View all CSV uploads with custom names  
✅ Edit upload names inline  
✅ Paginated record viewing (1000 per page)  
✅ Expand/collapse upload sections  
✅ Track who uploaded and when  
✅ See total record counts per upload
