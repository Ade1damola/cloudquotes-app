// Import the packages we need
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Create Express app - this is our web server
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - helps our app understand different types of data
app.use(cors()); // lets frontend talk to backend
app.use(bodyParser.json()); // helps read JSON data

// Database connection - connects to PostgreSQL
// using environment variables (these come from Docker/Terraform)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cloudquotes',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
});

// Test database connection when server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('✅ Successfully connected to database!');
    release();
  }
});

// Initialize database tables and add sample data
async function setupDatabase() {
  try {
    // Create quotes table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create favorites table to track user favorites
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER REFERENCES quotes(id),
        user_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if we have quotes, if not add sample quotes
    const result = await pool.query('SELECT COUNT(*) FROM quotes');
    if (result.rows[0].count === '0') {
      // Add some cool cloud and tech quotes
      await pool.query(`
        INSERT INTO quotes (text, author, category) VALUES
        ('The cloud is about how you do computing, not where you do computing.', 'Paul Maritz', 'cloud'),
        ('There is no cloud, it''s just someone else''s computer.', 'Anonymous', 'cloud'),
        ('Code is like humor. When you have to explain it, it''s bad.', 'Cory House', 'programming'),
        ('First, solve the problem. Then, write the code.', 'John Johnson', 'programming'),
        ('Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', 'Martin Fowler', 'programming'),
        ('The best thing about a boolean is even if you are wrong, you are only off by a bit.', 'Anonymous', 'programming'),
        ('Infrastructure as Code is not about automation, it''s about documentation.', 'Yevgeniy Brikman', 'devops'),
        ('In the cloud, you don''t buy servers, you buy compute time.', 'Werner Vogels', 'cloud'),
        ('Simplicity is the soul of efficiency.', 'Austin Freeman', 'programming'),
        ('Make it work, make it right, make it fast.', 'Kent Beck', 'programming'),
        ('Cloud computing is a great equalizer.', 'Vivek Kundra', 'cloud'),
        ('The only way to go fast is to go well.', 'Robert C. Martin', 'programming'),
        ('Docker is not about containers, it''s about packaging and shipping.', 'Solomon Hykes', 'devops'),
        ('Automation is good, so long as you know exactly where to put the machine off switch.', 'Terry Pratchett', 'devops'),
        ('The cloud is for everyone. The cloud is a democracy.', 'Marc Benioff', 'cloud')
      `);
      console.log('✅ Sample quotes added to database');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// API Routes (these are the endpoints our frontend will call)

// Health check - just confirms API is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'CloudQuotes API is running!',
    timestamp: new Date().toISOString()
  });
});

// GET random quote - returns one random quote from database
app.get('/api/quotes/random', async (req, res) => {
  try {
    // SQL query to get a random quote
    const result = await pool.query(
      'SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No quotes found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching random quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// GET all quotes - returns all quotes (optional, for admin view)
app.get('/api/quotes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotes ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET quotes by category
app.get('/api/quotes/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      'SELECT * FROM quotes WHERE category = $1 ORDER BY RANDOM() LIMIT 1',
      [category]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No quotes found in this category' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching quote by category:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// POST new quote (allows users to submit their own quotes)
app.post('/api/quotes', async (req, res) => {
  try {
    const { text, author, category } = req.body;
    
    // Basic validation
    if (!text || !author) {
      return res.status(400).json({ error: 'Quote text and author are required' });
    }

    const result = await pool.query(
      'INSERT INTO quotes (text, author, category) VALUES ($1, $2, $3) RETURNING *',
      [text, author, category || 'general']
    );
    
    res.status(201).json({ 
      message: 'Quote added successfully!',
      quote: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding quote:', error);
    res.status(500).json({ error: 'Failed to add quote' });
  }
});

// POST favorite a quote
app.post('/api/favorites', async (req, res) => {
  try {
    const { quote_id, user_name } = req.body;
    
    if (!quote_id || !user_name) {
      return res.status(400).json({ error: 'Quote ID and user name are required' });
    }

    const result = await pool.query(
      'INSERT INTO favorites (quote_id, user_name) VALUES ($1, $2) RETURNING *',
      [quote_id, user_name]
    );
    
    res.status(201).json({ 
      message: 'Quote favorited!',
      favorite: result.rows[0]
    });
  } catch (error) {
    console.error('Error favoriting quote:', error);
    res.status(500).json({ error: 'Failed to favorite quote' });
  }
});

// GET favorite count for a quote
app.get('/api/favorites/count/:quoteId', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const result = await pool.query(
      'SELECT COUNT(*) FROM favorites WHERE quote_id = $1',
      [quoteId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching favorite count:', error);
    res.status(500).json({ error: 'Failed to fetch favorite count' });
  }
});

// GET statistics about quotes
app.get('/api/stats', async (req, res) => {
  try {
    const quotesCount = await pool.query('SELECT COUNT(*) FROM quotes');
    const favoritesCount = await pool.query('SELECT COUNT(*) FROM favorites');
    const categories = await pool.query('SELECT DISTINCT category FROM quotes');
    
    res.json({
      total_quotes: parseInt(quotesCount.rows[0].count),
      total_favorites: parseInt(favoritesCount.rows[0].count),
      categories: categories.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start the server and setup database
app.listen(PORT, async () => {
  console.log(`🚀 CloudQuotes backend running on port ${PORT}`);
  await setupDatabase();
});