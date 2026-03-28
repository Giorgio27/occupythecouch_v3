# 🗄️ Database Migration Scripts

Script per la migrazione dei dati da MongoDB (cineforum-v2) a PostgreSQL (occupythecouch_v3).

## 📋 Prerequisiti

Le dipendenze necessarie sono già installate in `package.json`:

- `tsx` - per eseguire TypeScript
- `@types/bcryptjs` - per il type checking
- `bcryptjs` - per l'hashing delle password
- `mongodb` - per l'export da MongoDB

## 🚀 Utilizzo

### Step 1: Pulire il database PostgreSQL (⚠️ ATTENZIONE: cancella tutti i dati!)

```bash
npm run db:clear
```

### Step 2: Esportare dati da MongoDB

```bash
npm run db:export
```

Oppure con URI MongoDB custom:

```bash
MONGODB_URI="mongodb+srv://user:pass@host/database" npm run db:export
```

Questo creerà il file `mongodb-export.json` nella directory `occupythecouch_v3/`.

### Step 3: Importare dati in PostgreSQL

```bash
npm run db:import
```

## 📝 Note

### Password utenti

Tutti gli utenti importati avranno la password: **`password`**

### Cineforum creato

Viene creato un cineforum chiamato **"OccupyTheCouch"** con tutti i dati migrati.

### TV Episodes

Gli episodi TV (identificati da `_type: "TvEpisode"` in MongoDB) vengono importati con i campi:

- `showId`
- `seasonNumber`
- `episodeNumber`

I film normali avranno questi campi a `null`.

### Mapping ruoli

- MongoDB `roles_mask & 1 !== 0` → PostgreSQL `role: "ADMIN"`
- Altrimenti → `role: "MEMBER"`

### Stato utenti

- MongoDB `is_active: false` → PostgreSQL `Membership.disabled: true`

## 🔄 Rollback

Se qualcosa va storto, puoi ripetere la procedura:

```bash
# 1. Pulisci database
npm run db:clear

# 2. Correggi eventuali problemi negli script

# 3. Ri-esegui import
npm run db:import
```

## ✅ Verifica

Dopo l'import, verifica i dati con Prisma Studio:

```bash
npx prisma studio
```

Controlla:

- ✅ Cineforum "OccupyTheCouch" creato
- ✅ Users importati con Membership
- ✅ Movies (inclusi TvEpisode con showId popolato)
- ✅ Rounds, Teams, Proposals
- ✅ Votes e Rankings

## 🛠️ Comandi disponibili

| Comando             | Descrizione                                         |
| ------------------- | --------------------------------------------------- |
| `npm run db:clear`  | Pulisce completamente il database PostgreSQL        |
| `npm run db:export` | Esporta dati da MongoDB in `mongodb-export.json`    |
| `npm run db:import` | Importa dati da `mongodb-export.json` in PostgreSQL |
