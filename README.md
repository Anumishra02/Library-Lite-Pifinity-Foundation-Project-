## Library Lite

A full-stack TypeScript/React + Node.js library management system demonstrating:

- React frontend with TypeScript and Bootstrap
- Node.js/Express backend with PostgreSQL
- Book management (add, lend, return, waitlist)
- Member tracking
- OpenLibrary integration for book population
- Testing with Jest and Supertest

### Quick Start


## Prerequisites

- **Node.js 14+** (16+ recommended)
- **PostgreSQL 12+**
- **Git**

## Installation

### Clone and setup:
```bash
git clone https://github.com/Anumishra02/Library-Lite-Pifinity-Foundation-Project-.git
cd Library-Lite-Pifinity-Foundation-Project-
```
3. Setup backend


   ```bash
   cd backend

   # Create environment file
   cp .env.example .env

   # Edit the .env file with your database credentials
   # Use any text editor to update these values:
   # DB_USER=postgres
   # DB_PASSWORD=password
   # DB_NAME=library_lite

   npm install
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
   npm start   # runs on http://localhost:3000
   ```

Environment Configuration
backend/.env file:
```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=library_lite
DB_PASSWORD=password
DB_PORT=5432
PORT=5002
```
Now initialize and start your backend:
```bash
npm start
```

If successful, you should see:
```bash
Connected to PostgreSQL database
✅ Database tables initialized
🚀 Backend server running on port 5002
📊 Health check: http://localhost:5002/api/health
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
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```
Troubleshooting
Common Issues:
Database Connection Errors:

Verify PostgreSQL is running: pg_isready

Check .env file has correct credentials

Ensure library_lite database exists

Port Conflicts:

bash
# Kill processes on common ports
```bash
npx kill-port 5002  # Backend
npx kill-port 3000  # Frontend
```
CORS Errors:

Ensure frontend runs on http://localhost:3000

Backend CORS allows ports 3000-3009

OpenLibrary API Issues:

Check internet connectivity

API falls back to local samples if unreachable

Health Checks:
Backend: http://localhost:5002/api/health

Frontend: http://localhost:3000

Key files:

- `frontend/src/components/Catalog.tsx` - Main UI component
- `backend/server.js` - Express server + API routes
- `frontend/src/services/libraryService.ts` - API client/business logic


