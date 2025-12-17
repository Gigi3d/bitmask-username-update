// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    // Application entities
    admin_users: i.entity({
      email: i.string(),
      role: i.string(),
      createdAt: i.number(),
    }),
    csv_uploads: i.entity({
      uploadName: i.string(), // Editable name/label for the upload
      fileName: i.string(), // Original filename
      uploadedBy: i.string(), // Admin email who uploaded
      uploadedAt: i.number(), // Timestamp
      recordCount: i.number(), // Number of records in this upload
    }),
    csv_records: i.entity({
      oldUsername: i.string(),
      newUsername: i.string(),
      npubKey: i.string().optional(), // nPUB key as alternative identifier
      createdAt: i.number(),
      uploadId: i.string(), // Links to csv_uploads
      uploadedBy: i.string().optional(), // Email of the admin who uploaded the CSV (optional for backward compatibility)
    }),
    user_updates: i.entity({
      oldUsername: i.string().optional(), // Optional - may be empty for npubKey-only users
      newUsername: i.string(), // Current/latest username
      npubKey: i.string().optional(), // nPUB key as alternative identifier
      submittedAt: i.number(),
      // 3-Attempt tracking fields
      updateAttemptCount: i.number(), // 1, 2, or 3
      firstNewUsername: i.string().optional(), // First attempt
      secondNewUsername: i.string().optional(), // Second attempt
      thirdNewUsername: i.string().optional(), // Third attempt
      lastUpdatedAt: i.number(), // Timestamp of last update
      trackingId: i.string().optional(), // Tracking ID for submission tracking
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    csvUploadRecords: {
      forward: {
        on: "csv_records",
        has: "one",
        label: "upload",
      },
      reverse: {
        on: "csv_uploads",
        has: "many",
        label: "records",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
