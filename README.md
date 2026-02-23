# OccupyTheCouch v3

Collaborative movie selection and voting platform for cineforum communities.

## Tech Stack

- **Frontend:** React (Next.js)
- **Backend:** Node.js
- **Database:** PostgreSQL
- **ORM:** Prisma

## Project Structure Overview

This project uses a Next.js Pages Router architecture with a clear separation between client, server, and shared code.

### 📁 **`components/`**

Contains all React components organized by feature and purpose:

- **`components/ui/`**: Reusable UI primitives from **shadcn/ui** (button, card, dialog, input, etc.). These are low-level, unstyled components that follow the shadcn design system.
- **`components/cineforum/`**: Feature-specific components for cineforum functionality:
  - `proposal/`: Components for proposal creation, voting, and results display
  - `oscars/`: Components for the Oscars voting feature
  - `common/`: Shared components like `EmptyState` and `LoadingCard`
- **`components/header/`**: Navigation and header components
- **`components/home/`**: Landing page and authentication components
- **Root-level components**: Layout wrappers (`Layout.tsx`, `CineforumLayout.tsx`, `Header.tsx`, `Footer.tsx`)

### 📁 **`pages/`**

Next.js Pages Router structure containing **both page components and API routes**:

- **`pages/cineforum/[cineforumId]/`**: Dynamic routes for cineforum pages
  - `index.tsx`: Main cineforum page with proposals
  - `oscars.tsx`: Oscars voting page
  - `admin/`: Admin-only pages (users, rounds, teams, proposals management)
- **`pages/auth/`**: Authentication pages (signin, signup)
- **`pages/api/`**: Backend API endpoints (Next.js API routes)
  - `api/auth/`: NextAuth.js authentication endpoints
  - `api/cineforum/`: All cineforum-related API endpoints
  - `api/cineforums/`: Cineforum creation endpoints

### 📁 **`lib/`**

Shared business logic, utilities, and type definitions organized by execution context:

#### **`lib/client/`**

Client-side code that runs in the browser:

- **`https.ts`**: HTTP client utilities (`jsonFetch` wrapper)
- **`utils.ts`**: Client-side utility functions
- **`cineforum/`**: API client functions for fetching/mutating cineforum data
- **`contexts/`**: React Context providers (e.g., `CineforumContext`)
- **`hooks/`**: Custom React hooks (e.g., `useAdminAccess`)

#### **`lib/server/`**

Server-side code that runs only on the backend:

- **`cineforum-layout-props.ts`**: Helper for `getServerSideProps` to handle auth and membership checks
- **`external/`**: Third-party API integrations (TMDB, OMDB, IMDb, Telegram)
- **`ranking/`**: Voting algorithm implementations (Schulze method)
- **`rounds/`**: Business logic for round management and closing

#### **`lib/shared/`**

Code shared between client and server:

- **`types/`**: TypeScript type definitions and DTOs used across the application

### 📁 **`types/`**

Global TypeScript type augmentations:

- **`next-auth.d.ts`**: NextAuth.js type extensions for custom session properties

### 📁 **`prisma/`**

Database schema and migrations:

- **`schema.prisma`**: Prisma schema defining the database structure

### 📁 **`docs/`**

Project documentation:

- Context usage guides
- Feature setup instructions
- User management documentation

### 📁 **`styles/`**

Global CSS styles:

- **`globals.css`**: Tailwind CSS imports and global styles

### 📁 **`public/`**

Static assets (images, icons)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Giorgio27/occupythecouch_v3.git
   cd occupythecouch_v3
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your database credentials and secrets.
4. **Set up the database:**
   - Make sure PostgreSQL is running and accessible.

---

## Prisma Development Workflow

When your data model is changing frequently, you can use Prisma in prototype mode to keep your database and schema in sync instantly.

### Typical workflow

After editing `prisma/schema.prisma`:

```bash
npx prisma db push        # Sync schema changes to the database (no migrations)
npx prisma generate       # Regenerate the Prisma Client
npx prisma studio         # Open Prisma Studio to inspect data
```

This updates your local (or dev) database structure without creating migration files — perfect while experimenting.

Once your schema is stable and you’re ready to track database history:

```bash
npx prisma migrate dev --name init
```

This command creates and applies the first migration and sets a clean baseline for future changes.

### Summary Table

| Stage         | Command                              | Purpose                     |
| ------------- | ------------------------------------ | --------------------------- |
| Prototyping   | `npx prisma db push`                 | Instantly sync schema to DB |
| Schema stable | `npx prisma migrate dev --name init` | Create versioned migration  |
| Production    | `npx prisma migrate deploy`          | Apply committed migrations  |

---

## Architecture Notes & Concerns

### Current State Analysis

#### ✅ **What's Working Well**

- **Clear separation of concerns**: Client, server, and shared code are properly isolated
- **Type safety**: Shared types in `lib/shared/types/` ensure consistency across layers
- **Reusable components**: shadcn/ui provides a solid foundation for UI consistency
- **Server-side helpers**: `getCineforumLayoutProps` reduces boilerplate in page components

#### ⚠️ **Architectural Concerns**

**1. `lib/server/` Mixed Responsibilities**

The `lib/server/` directory contains code used in two different contexts:

- **API Routes** (`pages/api/`): Traditional backend endpoints
- **Server-Side Rendering** (`getServerSideProps` in page components)

**Current situation:**

- `lib/server/cineforum-layout-props.ts` → Used in SSR (getServerSideProps)
- `lib/server/rounds/index.ts` → Used in API routes
- `lib/server/external/` → Used in both API routes and potentially SSR

**Is this correct?**
✅ **Yes, this is acceptable** in Next.js architecture. Both API routes and `getServerSideProps` run on the server, so sharing server-side code between them is valid. However, consider:

- **Naming clarity**: The directory name `lib/server/` accurately reflects that this code runs server-side
- **Import restrictions**: Ensure this code never gets imported into client-side components (Next.js will error if you try)
- **Future consideration**: If the project grows significantly, you might split into `lib/api/` (API-specific logic) and `lib/ssr/` (SSR-specific logic), but this is not necessary now

**2. API Route Organization**

API routes follow a deeply nested structure (`pages/api/cineforum/[cineforumId]/admin/proposals/[proposalId]/close.ts`). This is standard Next.js convention but can become verbose.

**3. Type Definitions Location**

- `lib/shared/types/` contains DTOs and shared types
- `types/` contains global type augmentations (NextAuth)

✅ This separation is logical and follows best practices.

### Recommendations

1. **Document server-side code usage**: Add JSDoc comments to `lib/server/` modules indicating whether they're used in API routes, SSR, or both
2. **Consider barrel exports**: Use index files to simplify imports from `lib/server/`
3. **Validate client/server boundaries**: Use ESLint rules or build-time checks to prevent accidental server code imports in client components
4. **Keep `lib/shared/` pure**: Ensure shared types have no runtime dependencies on client or server code

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue for major changes.

---

## License

MIT
