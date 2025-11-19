# InstantDB Schema Setup Checklist

Use this checklist to ensure all entities are configured correctly.

## ✅ Pre-Setup

- [ ] Have access to InstantDB dashboard
- [ ] Know your App ID: `e183332d-f1ca-469a-a705-d24f4f39eb12`
- [ ] Have admin token: `fd5ce403-ed7a-4d1d-be7e-0a401e5b03df` (already in `.env.local`)

## ✅ Entity 1: csv_records

- [ ] Entity name is exactly: `csv_records` (lowercase, underscore)
- [ ] Field: `oldUsername` (type: string)
- [ ] Field: `telegramAccount` (type: string)
- [ ] Field: `newUsername` (type: string)
- [ ] Field: `createdAt` (type: number)
- [ ] Entity saved in dashboard

## ✅ Entity 2: user_updates

- [ ] Entity name is exactly: `user_updates` (lowercase, underscore)
- [ ] Field: `oldUsername` (type: string)
- [ ] Field: `telegramAccount` (type: string)
- [ ] Field: `newUsername` (type: string)
- [ ] Field: `submittedAt` (type: number)
- [ ] Entity saved in dashboard

## ✅ Entity 3: admin_users

- [ ] Entity name is exactly: `admin_users` (lowercase, underscore)
- [ ] Field: `email` (type: string)
- [ ] Field: `role` (type: string)
- [ ] Field: `createdAt` (type: number)
- [ ] Entity saved in dashboard

## ✅ Post-Setup Verification

- [ ] All 3 entities visible in InstantDB dashboard
- [ ] All fields have correct types (string/number)
- [ ] Schema changes saved
- [ ] Waited 10-30 seconds for propagation
- [ ] Run admin creation script:
  ```bash
  export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts
  ```
- [ ] Script completes successfully
- [ ] Admin user `gideon@diba.io` created as superadmin

## 🎯 Quick Command Reference

After completing the checklist above, run:

```bash
# Load environment variables and create admin
export $(cat .env.local | xargs) && npx tsx scripts/add-root-admin-direct.ts
```

Expected output:
```
✅ Successfully added gideon@diba.io as a superadmin!
```

## 📚 Full Instructions

For detailed step-by-step instructions, see: **[INSTANTDB_SCHEMA_SETUP.md](./INSTANTDB_SCHEMA_SETUP.md)**


