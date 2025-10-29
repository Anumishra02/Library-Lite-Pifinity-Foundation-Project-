const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5002;

// ✅ Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001','http://localhost:3002', 'http://localhost:3003','http://localhost:3004', 'http://localhost:3005','http://localhost:3006','http://localhost:3007','http://localhost:3008','http://localhost:3009'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'library_lite',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// ✅ Database connection checks
pool.on('connect', () => console.log('Connected to PostgreSQL database'));
pool.on('error', (err) => {
  console.error('Database connection error:', err);
  console.error('Database config:', {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'library_lite',
    port: process.env.DB_PORT || 5432
  });
});

// ✅ Initialize database tables
const initDb = async () => {
  try {
    // Drop and recreate books table to ensure schema is up to date
    await pool.query(`DROP TABLE IF EXISTS books CASCADE`);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) UNIQUE NOT NULL,
        author VARCHAR(255) NOT NULL,
        tags TEXT[],
        cover_id VARCHAR(255),
        open_library_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, member_id)
      );
    `);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// ✅ Add a book
app.post('/api/books', async (req, res) => {
  const { title, author, tags } = req.body;

  try {
    const duplicate = await pool.query(
      'SELECT id FROM books WHERE LOWER(title) = LOWER($1)',
      [title]
    );
    ////here made change  on duplicateCheck.rows.length
    //from duplicate.rows.length
    if (duplicate.rows.length > 0)
      return res.status(400).json({ error: 'Book with this title already exists' });

    const result = await pool.query(
      'INSERT INTO books (title, author, tags) VALUES ($1, $2, $3) RETURNING *',
      [title, author, tags || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// ✅ Add a member (with duplicate check)
app.post('/api/members', async (req, res) => {
  const { firstName, lastName } = req.body;

  try {
    const duplicate = await pool.query(
      'SELECT id FROM members WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2)',
      [firstName, lastName]
    );
    if (duplicate.rows.length > 0)
      return res.status(400).json({ error: 'Member with this name already exists' });

    const result = await pool.query(
      'INSERT INTO members (first_name, last_name) VALUES ($1, $2) RETURNING *',
      [firstName, lastName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ✅ Get all books (now includes waitlist_count)
app.get('/api/books', async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT 
        b.*,
        CASE 
          WHEN l.id IS NOT NULL AND l.return_date IS NULL THEN 'on-loan'
          ELSE 'available'
        END AS status,
        l.due_date,
        m.first_name AS loaned_to_first_name,
        m.last_name AS loaned_to_last_name,
        COUNT(w.id) AS waitlist_count
      FROM books b
      LEFT JOIN loans l ON b.id = l.book_id AND l.return_date IS NULL
      LEFT JOIN members m ON l.member_id = m.id
      LEFT JOIN waitlist w ON b.id = w.book_id
    `;

    const params = [];
    if (search) {
      query += ' WHERE LOWER(b.title) LIKE LOWER($1)';
      params.push(`%${search}%`);
    }

    query += ' GROUP BY b.id, l.id, m.id ORDER BY b.title';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// ✅ Get all members with active loans
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        COALESCE(
          json_agg(
            CASE 
              WHEN l.id IS NOT NULL AND l.return_date IS NULL THEN
                json_build_object(
                  'loan_id', l.id,
                  'book_title', b.title,
                  'due_date', l.due_date
                )
              ELSE NULL
            END
          ) FILTER (WHERE l.id IS NOT NULL AND l.return_date IS NULL),
          '[]'
        ) AS active_loans
      FROM members m
      LEFT JOIN loans l ON m.id = l.member_id AND l.return_date IS NULL
      LEFT JOIN books b ON l.book_id = b.id
      GROUP BY m.id
      ORDER BY m.last_name, m.first_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ✅ Lend a book (handles waitlist)
app.post('/api/loans', async (req, res) => {
  const { bookId, memberId } = req.body;

  try {
    const bookCheck = await pool.query(`
      SELECT 
        b.id,
        CASE 
          WHEN l.id IS NOT NULL AND l.return_date IS NULL THEN false
          ELSE true
        END AS available
      FROM books b
      LEFT JOIN loans l ON b.id = l.book_id AND l.return_date IS NULL
      WHERE b.id = $1
    `, [bookId]);

    if (bookCheck.rows.length === 0)
      return res.status(404).json({ error: 'Book not found' });

    const available = bookCheck.rows[0].available;

    if (!available) {
      try {
        await pool.query('INSERT INTO waitlist (book_id, member_id) VALUES ($1, $2)', [bookId, memberId]);
        return res.json({ message: 'Book is currently on loan. You have been added to the waitlist.' });
      } catch (err) {
        if (err.code === '23505')
          return res.status(400).json({ error: 'You are already on the waitlist for this book' });
        throw err;
      }
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await pool.query('INSERT INTO loans (book_id, member_id, due_date) VALUES ($1, $2, $3)', [bookId, memberId, dueDate]);
    res.json({ message: 'Book loaned successfully', dueDate: dueDate.toISOString().split('T')[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process loan' });
  }
});

// ✅ Return a book (auto-loan FIFO logic)
// ✅ Return a book (fixed version)
app.post('/api/loans/return', async (req, res) => {
  const { bookId } = req.body;

  try {
    // 1️⃣ Mark the book as returned (set return_date)
    await pool.query(
      `UPDATE loans 
       SET return_date = CURRENT_DATE 
       WHERE book_id = $1 AND return_date IS NULL`,
      [bookId]
    );

    // 2️⃣ Check if anyone is waiting (FIFO = order by joined_date)
    const waitlistResult = await pool.query(
      `SELECT member_id 
       FROM waitlist 
       WHERE book_id = $1 
       ORDER BY joined_date ASC 
       LIMIT 1`,
      [bookId]
    );

    if (waitlistResult.rows.length > 0) {
      const nextMemberId = waitlistResult.rows[0].member_id;

      // 3️⃣ Assign book to the next member
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      await pool.query(
        `INSERT INTO loans (book_id, member_id, due_date) 
         VALUES ($1, $2, $3)`,
        [bookId, nextMemberId, dueDate]
      );

      // 4️⃣ Remove that member from the waitlist
      await pool.query(
        `DELETE FROM waitlist 
         WHERE book_id = $1 AND member_id = $2`,
        [bookId, nextMemberId]
      );

      res.json({
        message: `Book automatically loaned to next member in waitlist (Member ID: ${nextMemberId})`,
      });
    } else {
      // 5️⃣ No one waiting → book now available
      res.json({ message: 'Book returned and marked as available.' });
    }
  } catch (err) {
    console.error('Error in returning book:', err);
    res.status(500).json({ error: 'Failed to process return.' });
  }
});


// ✅ Get waitlist for a book
app.get('/api/books/:bookId/waitlist', async (req, res) => {
  const { bookId } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        w.*, m.first_name, m.last_name
      FROM waitlist w
      JOIN members m ON w.member_id = m.id
      WHERE w.book_id = $1
      ORDER BY w.joined_date ASC
    `, [bookId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// ✅ Overdue report - FIXED VERSION
app.get('/api/reports/overdue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.title,
        b.author,
        m.first_name,
        m.last_name,
        l.due_date,
        EXTRACT(DAY FROM (CURRENT_DATE - l.due_date))::integer as days_overdue
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.return_date IS NULL 
      AND l.due_date < CURRENT_DATE
      ORDER BY days_overdue DESC, l.due_date
    `);
    
    console.log(`📊 Overdue report: ${result.rows.length} records found`);
    res.json(result.rows);
  } catch (err) {
    console.error('Overdue report error:', err);
    res.status(500).json({ error: 'Failed to generate overdue report' });
  }
});

// ✅ Top books report - FIXED VERSION
app.get('/api/reports/top-books', async (req, res) => {
  const { limit = 5 } = req.query;
  
  try {
    const result = await pool.query(`
      WITH loan_counts AS (
        SELECT 
          book_id,
          COUNT(*) as total_loans
        FROM loans
        GROUP BY book_id
      )
      SELECT 
        b.title,
        b.author,
        COALESCE(lc.total_loans, 0) as checkout_count
      FROM books b
      LEFT JOIN loan_counts lc ON b.id = lc.book_id
      ORDER BY checkout_count DESC, b.title ASC
      LIMIT $1;
    `, [parseInt(limit)]);
    
    console.log(`📊 Top books report: ${result.rows.length} records found`);
    res.json(result.rows);
  } catch (err) {
    console.error('Top books report error:', err);
    res.status(500).json({ error: 'Failed to generate top books report' });
  }
});

// Simple cache with TTL for Open Library responses
const cache = {
  data: new Map(),
  ttl: 1000 * 60 * 60, // 1 hour TTL
  set: function(key, value) {
    this.data.set(key, {
      value,
      timestamp: Date.now()
    });
  },
  get: function(key) {
    const item = this.data.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }
};

// ✅ Populate library (fetch from Open Library API with caching)
app.post('/api/populate', async (req, res) => {
  const { genre = 'general', limit = 8 } = req.body || {};

  // Local fallback samples (used if external API fails)
  const samples = {
    fiction: [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', tags: ['fiction', 'classic'] },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', tags: ['fiction', 'classic'] }
    ],
    science: [
      { title: 'A Brief History of Time', author: 'Stephen Hawking', tags: ['science', 'physics'] },
      { title: 'The Selfish Gene', author: 'Richard Dawkins', tags: ['science', 'biology'] }
    ],
    general: [
      { title: 'Clean Code', author: 'Robert C. Martin', tags: ['programming', 'best-practices'] },
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', tags: ['programming', 'career'] }
    ]
  };

  // Helper: try to fetch from Open Library subject endpoint (with caching)
  const fetchFromOpenLibrary = async (subject, max) => {
    const cacheKey = `${subject}:${max}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cache hit for:', cacheKey);
      return cached;
    }

    try {
      const url = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=${max}`;
      const resp = await axios.get(url, { timeout: 5000 });
      if (!resp.data || !Array.isArray(resp.data.works)) return [];

      const mapped = resp.data.works.map((w) => ({
        title: w.title,
        author: (w.authors && w.authors[0] && w.authors[0].name) || 'Unknown',
        tags: Array.isArray(w.subject) ? w.subject.slice(0, 5) : [],
        cover_id: w.cover_id ? w.cover_id.toString() : null,
        open_library_key: w.key || null
      }));

      cache.set(cacheKey, mapped);
      return mapped;
    } catch (err) {
      console.warn('OpenLibrary fetch failed:', err.message || err);
      return [];
    }
  };

  let toInsert = [];

  // Try external API first
  const externalResults = await fetchFromOpenLibrary(genre.toLowerCase(), limit);
  if (externalResults.length > 0) {
    toInsert = externalResults;
  } else {
    // fallback to local sample set
    toInsert = samples[genre] || samples.general;
  }

  try {
    const added = [];
    for (const b of toInsert) {
      const result = await pool.query(
        `INSERT INTO books (title, author, tags, cover_id, open_library_key) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (title) DO UPDATE 
         SET tags = $3,
             cover_id = COALESCE($4, books.cover_id),
             open_library_key = COALESCE($5, books.open_library_key)
         RETURNING *`,
        [b.title, b.author, b.tags || [], b.cover_id, b.open_library_key]
      );
      if (result.rows && result.rows[0]) {
        const book = result.rows[0];
        // Add cover URL if we have a cover_id
        if (book.cover_id) {
          book.cover_url = `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`;
        }
        added.push(book);
      }
    }

    res.json({ 
      message: `Populated library with ${toInsert.length} books (genre=${genre})`,
      source: externalResults.length > 0 ? 'openlibrary' : 'local',
      books: added 
    });
  } catch (err) {
    console.error('Populate error:', err);
    res.status(500).json({ error: 'Failed to populate library' });
  }
});

// ✅ Start server
// Exported initializer for tests or external runners
async function startServer() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`🚀 Backend server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

// If run directly, start the server. This makes the app importable for tests.
if (require.main === module) {
  startServer();
}

module.exports = { app, initDb, pool };
