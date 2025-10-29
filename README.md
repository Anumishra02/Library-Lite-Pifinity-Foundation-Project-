## Library Lite

A full-stack TypeScript/React + Node.js library management system demonstrating:

- React frontend with TypeScript and Bootstrap
- Node.js/Express backend with PostgreSQL
- Book management (add, lend, return, waitlist)
- Member tracking
- OpenLibrary integration for book population
- Testing with Jest and Supertest

### Quick Start

1. Prerequisites:

   - Node.js 14+
   - PostgreSQL 12+
   - Git

2. Clone and install:

   ```bash
   git clone <repo-url>
   cd library-lite
   ```

3. Setup database:

   ```bash
   # Start PostgreSQL and create database
   createdb library_lite  # or use pgAdmin

   # Configure backend
   cd backend
   cp .env.example .env   # edit with your DB credentials
   npm install
   npm run init-db
   ```

4. Start backend:

   ```bash
   cd backend
   npm run dev  # runs on http://localhost:5002
   ```

5. Start frontend (new terminal):
   ```bash
   cd frontend
   npm install
   npm start   # runs on http://localhost:3001
   ```

### Features

#### 📚 Book Population

The system can populate books from either:

1. OpenLibrary API (live data with cover images)
2. Local samples (offline fallback)

Try it:

```bash
# PowerShell
$body = @{ genre = 'fiction'; limit = 6 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5002/api/populate -Method POST -Body $body -ContentType 'application/json'

# curl
curl -X POST http://localhost:5002/api/populate \
     -H "Content-Type: application/json" \
     -d "{\"genre\":\"fiction\",\"limit\":6}"
```

Example response:

```json
{
  "message": "Populated library with 6 books (genre=fiction)",
  "source": "openlibrary",
  "books": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "tags": ["fiction", "classic"],
      "cover_url": "https://covers.openlibrary.org/b/id/12345-M.jpg"
    }
  ]
}
```

#### 🧪 Development

Run tests:

```bash
cd backend
npm test
```

Key files:

- `frontend/src/components/Catalog.tsx` - Main UI component
- `backend/server.js` - Express server + API routes
- `frontend/src/services/libraryService.ts` - API client/business logic

### Screenshots

![Populate Books](docs/populate-books.png)
_Populate dialog showing OpenLibrary integration_

![Book List](docs/book-list.png)
_Main catalog with cover images and tags_
