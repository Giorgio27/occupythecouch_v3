# Setup Instructions for User Disable Feature

## Overview

The user disable feature has been implemented but requires a Prisma migration to be applied to the database.

## Steps to Complete Setup

### 1. Generate Prisma Client

Run this command to regenerate the Prisma client with the new `disabled` field:

```bash
cd occupythecouch_v3
npx prisma generate
```

### 2. Create and Apply Migration

Create a migration for the new `disabled` field in the Membership model:

```bash
npx prisma migrate dev --name add_membership_disabled
```

This will:

- Create a new migration file
- Add the `disabled` column to the `Membership` table
- Set default value to `false` for all existing memberships

### 3. Verify the Changes

After running the migration, verify that:

- The `Membership` table has a new `disabled` column (BOOLEAN, default: false)
- All existing memberships have `disabled = false`
- TypeScript errors in the IDE should disappear

## What Was Changed

### Database Schema

- Added `disabled Boolean @default(false)` to the `Membership` model
- Added index on `disabled` field for query performance

### API Routes

- **GET `/api/cineforum/[cineforumId]/admin/users`**: Now returns `disabled` status for each user
- **PATCH `/api/cineforum/[cineforumId]/admin/users/[userId]`**:
  - Can update `role` (ADMIN/MEMBER)
  - Can toggle `disabled` status (true/false)
  - Removed DELETE endpoint (replaced with disable)

### UI Changes

- Users page now shows "Disabled" badge for disabled users
- Disabled users appear with reduced opacity
- "Remove" button replaced with "Disable/Enable" toggle button
- Role change buttons hidden for disabled users
- Cannot disable yourself
- Cannot disable the cineforum owner

### Client Functions

- Removed `removeUser()` function
- Added `toggleUserDisabled(cineforumId, userId, disabled)` function

## Testing

After completing the setup, test the feature:

1. Navigate to `/cineforum/[cineforumId]/admin/users`
2. Try disabling a user (not yourself, not the owner)
3. Verify the user shows as "Disabled" with reduced opacity
4. Try enabling the user again
5. Verify disabled users cannot have their roles changed

## Rollback (if needed)

If you need to rollback this change:

```bash
npx prisma migrate resolve --rolled-back add_membership_disabled
```

Then manually remove the `disabled` field from `prisma/schema.prisma` and regenerate:

```bash
npx prisma generate
```
