const request = require('supertest');
const { app, initDb } = require('../server');

beforeAll(async () => {
  // Ensure DB tables exist before running tests
  await initDb();
});

afterAll(async () => {
  // Close DB pool to allow Jest to exit cleanly
  const { pool } = require('../server');
  try {
    await pool.end();
  } catch (err) {
    // ignore
  }
});

// Mock axios for OpenLibrary API calls
jest.mock('axios');
const axios = require('axios');

describe('POST /api/populate', () => {
  const mockOpenLibraryResponse = {
    data: {
      works: [
        {
          title: 'Test Book',
          authors: [{ name: 'Test Author' }],
          subject: ['fiction', 'test'],
          cover_id: '12345',
          key: '/works/OL12345W'
        }
      ]
    }
  };

  beforeEach(() => {
    // Reset axios mock before each test
    jest.resetAllMocks();
  });

  test('returns message and books array for a genre with OpenLibrary data', async () => {
    // Mock successful OpenLibrary API call
    axios.get.mockResolvedValueOnce(mockOpenLibraryResponse);

    const res = await request(app)
      .post('/api/populate')
      .send({ genre: 'fiction', limit: 1 })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('books');
    expect(res.body).toHaveProperty('source', 'openlibrary');
    expect(Array.isArray(res.body.books)).toBe(true);

    // Verify book has expected fields
    const book = res.body.books[0];
    expect(book).toHaveProperty('title', 'Test Book');
    expect(book).toHaveProperty('author', 'Test Author');
    expect(book).toHaveProperty('cover_id', '12345');
    expect(book).toHaveProperty('cover_url');
    expect(book.cover_url).toContain('12345');
  });

  test('falls back to local samples when OpenLibrary fails', async () => {
    // Mock failed OpenLibrary API call
    axios.get.mockRejectedValueOnce(new Error('API error'));

    const res = await request(app)
      .post('/api/populate')
      .send({ genre: 'fiction' })
      .set('Accept', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('source', 'local');
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.books.length).toBeGreaterThan(0);
  });
});
