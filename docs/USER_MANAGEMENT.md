# User Management System

This document describes the user management system implemented for the cineforum admin section.

## Overview

The user management system allows cineforum admins and owners to:

- Invite new users to the cineforum
- Assign roles (ADMIN or MEMBER) to users
- Update user roles
- Remove users from the cineforum

## Key Features

### Role System

The system uses three roles defined in the Prisma schema:

- **OWNER**: The creator of the cineforum (cannot be modified or removed)
- **ADMIN**: Can manage users, rounds, teams, and proposals
- **MEMBER**: Regular user with standard permissions

### User Invitation

Since there's no email server, admins can:

1. Create a new user account if the email doesn't exist
2. Set a temporary password for the user
3. Automatically add the user to the cineforum with the specified role

If the user already exists in the system, they are simply added to the cineforum.

## Implementation Details

### API Routes

#### 1. List Users

- **Endpoint**: `GET /api/cineforum/[cineforumId]/admin/users`
- **Auth**: Requires ADMIN or OWNER role
- **Returns**: List of all users in the cineforum with their roles

#### 2. Invite User

- **Endpoint**: `POST /api/cineforum/[cineforumId]/admin/users/invite`
- **Auth**: Requires ADMIN or OWNER role
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "password": "temporary123",
    "role": "ADMIN" | "MEMBER"
  }
  ```
- **Behavior**:
  - Creates user if doesn't exist
  - Hashes password with bcrypt
  - Creates membership with specified role
  - Returns error if user already member

#### 3. Update User Role

- **Endpoint**: `PATCH /api/cineforum/[cineforumId]/admin/users/[userId]`
- **Auth**: Requires ADMIN or OWNER role
- **Body**:
  ```json
  {
    "role": "ADMIN" | "MEMBER"
  }
  ```
- **Restrictions**:
  - Cannot modify the cineforum owner
  - Can only set ADMIN or MEMBER roles

#### 4. Remove User

- **Endpoint**: `DELETE /api/cineforum/[cineforumId]/admin/users/[userId]`
- **Auth**: Requires ADMIN or OWNER role
- **Restrictions**:
  - Cannot remove the cineforum owner
  - Cannot remove yourself

### UI Component

The admin users page (`/cineforum/[cineforumId]/admin/users`) provides:

1. **Invite Form**:

   - Email (required)
   - Name (optional)
   - Password (required)
   - Role selector (ADMIN/MEMBER)

2. **Users List**:
   - Shows all members with their roles
   - Visual badges for OWNER, ADMIN, and MEMBER roles
   - Action buttons to promote/demote users
   - Remove button (except for owner and self)
   - Join date information

### Client Functions

Located in `lib/client/cineforum/users.ts`:

- `fetchCineforumUsers(cineforumId)`: Get all users
- `inviteUser(cineforumId, payload)`: Invite a new user
- `updateUserRole(cineforumId, userId, role)`: Change user role
- `removeUser(cineforumId, userId)`: Remove user from cineforum

### Type Definitions

Located in `lib/shared/types/users.ts`:

- `CineforumUserDTO`: User data with role and membership info
- `CineforumUsersListDTO`: List response wrapper
- `InviteUserDTO`: Response after inviting a user

## Security Considerations

1. **Authorization**: All endpoints check that the requesting user is an ADMIN or OWNER
2. **Owner Protection**: The cineforum owner cannot be modified or disabled
3. **Self-Protection**: Users cannot disable themselves
4. **Password Hashing**: All passwords are hashed with bcrypt before storage
5. **Role Validation**: Only ADMIN and MEMBER roles can be assigned via the API
6. **Disabled Users**: Disabled users cannot access the cineforum or perform any actions
7. **Admin Visibility**: Admin links are only visible to users with ADMIN or OWNER role who are not disabled

## Navigation

The "Users" link has been added to the Admin dropdown menu in the cineforum header navigation. The entire Admin dropdown is only visible to users with ADMIN or OWNER role who are not disabled.

## Usage Example

1. Navigate to `/cineforum/[cineforumId]/admin/users` (only visible if you're an admin)
2. Fill in the invite form with user details
3. Click "Invite user"
4. The user will appear in the list below
5. Use the action buttons to:
   - Change user roles (Make admin/Make member)
   - Disable/Enable users
6. Disabled users appear with reduced opacity and a "Disabled" badge
7. Role change buttons are hidden for disabled users

## Future Enhancements

Potential improvements:

- Email notifications when users are invited (requires email server)
- Password reset functionality
- Bulk user import
- User activity logs
- More granular permissions system
