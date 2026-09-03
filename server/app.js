// server/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
app.use(express.static('public'));

// ============ ROUTES ============

// 1. LOGIN ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [users] = await pool.query(
      'SELECT id, username, role FROM event_system.users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL EVENTS
app.get('/api/events', async (req, res) => {
  try {
    const [events] = await pool.query(
      'SELECT * FROM event_system.events ORDER BY date ASC'
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE EVENT (ADMIN ONLY)
app.post('/api/events', async (req, res) => {
  const { name, date, venue, price, description } = req.body;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO event_system.events (name, date, venue, price, description) VALUES (?, ?, ?, ?, ?)',
      [name, date, venue, price, description]
    );
    
    res.status(201).json({ 
      message: 'Event created', 
      eventId: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. DELETE EVENT (ADMIN ONLY)
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query(
      'DELETE FROM event_system.events WHERE id = ?',
      [id]
    );
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CREATE BOOKING
app.post('/api/bookings', async (req, res) => {
  const { event_id, user_name, tickets } = req.body;
  
  try {
    // Verify event exists
    const [event] = await pool.query(
      'SELECT price FROM event_system.events WHERE id = ?',
      [event_id]
    );
    
    if (event.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const total_cost = event[0].price * tickets;
    
    const [result] = await pool.query(
      'INSERT INTO event_system.bookings (event_id, user_name, tickets, total_cost) VALUES (?, ?, ?, ?)',
      [event_id, user_name, tickets, total_cost]
    );
    
    res.status(201).json({ 
      message: 'Booking confirmed', 
      bookingId: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET ALL BOOKINGS (WITH EVENT DETAILS)
app.get('/api/bookings', async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.id, b.user_name, e.name AS event_name, b.tickets, 
              e.price, b.total_cost, b.created_at
       FROM event_system.bookings b
       JOIN event_system.events e ON b.event_id = e.id
       ORDER BY b.created_at DESC`
    );
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET ANALYTICS (REVENUE PER EVENT)
app.get('/api/analytics', async (req, res) => {
  try {
    const [analytics] = await pool.query(
      `SELECT e.id, e.name, COUNT(b.id) AS booking_count, 
              SUM(b.tickets) AS total_tickets_sold, 
              SUM(b.total_cost) AS total_revenue
       FROM event_system.events e
       LEFT JOIN event_system.bookings b ON e.id = b.event_id
       GROUP BY e.id, e.name
       ORDER BY total_revenue DESC`
    );
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});