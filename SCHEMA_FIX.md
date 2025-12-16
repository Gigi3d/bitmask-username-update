# InstantDB Schema Update Required

## Problem

The CSV upload is failing with: **"Validation failed for steps: Attributes are missing in your schema"**

This means the InstantDB schema in the dashboard doesn't match our local schema file.

## Solution

You need to update the schema in the InstantDB dashboard:

### Step 1: Go to InstantDB Dashboard

1. Visit: <https://instantdb.com/dashboard>
2. Select your app
3. Go to the "Schema" tab

### Step 2: Update csv_records Entity

Make sure the `csv_records` entity has these exact attributes:

```typescript
csv_records: {
  oldUsername: string (required)
  newUsername: string (required)
  npubKey: string (optional)
  createdAt: number (required)
  uploadedBy: string (optional)
}
```

### Step 3: Save and Deploy Schema

After updating, click "Save" or "Deploy Schema" in the InstantDB dashboard.

### Step 4: Test CSV Upload

Once the schema is updated, the CSV upload should work immediately.

## Alternative: Push Local Schema

If InstantDB supports schema push from CLI:

```bash
# Check if there's a schema push command
npx instant-cli push-schema
```

## Current Local Schema

Our local `instant.schema.ts` file already has the correct definition:

```typescript
csv_records: i.entity({
  oldUsername: i.string(),
  newUsername: i.string(),
  npubKey: i.string().optional(),
  createdAt: i.number(),
  uploadedBy: i.string().optional(),
}),
```

The dashboard schema just needs to match this.
