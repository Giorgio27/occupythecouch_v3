# OccupyTheCouch v3

Collaborative movie selection and voting platform for cineforum communities.

## Tech Stack

- **Frontend:** React (Next.js)
- **Backend:** Node.js
- **Database:** PostgreSQL
- **ORM:** Prisma

---

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

## Contributing

Pull requests and suggestions are welcome! Please open an issue for major changes.

---

## License

MIT
