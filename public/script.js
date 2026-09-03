// public/script.js

const API_URL = 'http://localhost:5000/api';
let currentUser = null;

// ============ PAGE MANAGEMENT ============
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

// ============ LOGIN ============
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      // Show appropriate page based on role
      if (currentUser.role === 'admin') {
        loadAdminPage();
        showPage('adminPage');
      } else {
        loadEventsPage();
        showPage('eventsPage');
      }
    } else {
      alert('❌ Invalid credentials');
    }
  } catch (err) {
    alert('❌ Login failed: ' + err.message);
  }
});

// ============ LOGOUT ============
document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('user');
  document.getElementById('loginForm').reset();
  showPage('loginPage');
});

document.getElementById('logoutBtn2').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('user');
  document.getElementById('loginForm').reset();
  showPage('loginPage');
});

// ============ LOAD EVENTS PAGE ============
async function loadEventsPage() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';
    
    events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
        <p><strong>Venue:</strong> ${event.venue}</p>
        <p>${event.description || 'No description'}</p>
        <div class="price">₹${parseFloat(event.price).toFixed(2)}</div>
        <form class="booking-form" onsubmit="bookTicket(event, ${event.id})">
          <input type="number" min="1" max="10" value="1" required>
          <button type="submit">Book Now</button>
        </form>
      `;
      eventsList.appendChild(card);
    });
  } catch (err) {
    alert('Failed to load events: ' + err.message);
  }
}

// ============ BOOK TICKET ============
async function bookTicket(e, eventId) {
  e.preventDefault();
  
  const tickets = e.target.querySelector('input[type="number"]').value;
  
  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        user_name: currentUser.username,
        tickets: parseInt(tickets)
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert(`✅ Booking confirmed! Booking ID: ${data.bookingId}`);
    } else {
      alert('❌ Booking failed: ' + data.error);
    }
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

// ============ ADMIN PAGE ============
async function loadAdminPage() {
  loadAdminEvents();
  loadAnalytics();
}

async function loadAdminEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    
    const tbody = document.getElementById('adminEventsList');
    tbody.innerHTML = '';
    
    events.forEach(event => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${event.name}</td>
        <td>${new Date(event.date).toLocaleDateString()}</td>
        <td>${event.venue}</td>
        <td>₹${parseFloat(event.price).toFixed(2)}</td>
        <td>
          <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    alert('Failed to load events: ' + err.message);
  }
}

// ============ CREATE EVENT ============
document.getElementById('createEventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('eventName').value;
  const date = document.getElementById('eventDate').value;
  const venue = document.getElementById('eventVenue').value;
  const price = document.getElementById('eventPrice').value;
  const description = document.getElementById('eventDescription').value;
  
  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date, venue, price, description })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert('✅ Event created successfully!');
      e.target.reset();
      loadAdminEvents();
    } else {
      alert('❌ Failed to create event: ' + data.error);
    }
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
});

// ============ DELETE EVENT ============
async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;
  
  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert('✅ Event deleted!');
      loadAdminEvents();
      loadAnalytics();
    } else {
      alert('❌ Failed to delete event');
    }
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

// ============ ANALYTICS ============
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_URL}/analytics`);
    const analytics = await res.json();
    
    const tbody = document.getElementById('analyticsTable');
    tbody.innerHTML = '';
    
    analytics.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.booking_count || 0}</td>
        <td>${item.total_tickets_sold || 0}</td>
        <td>₹${parseFloat(item.total_revenue || 0).toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load analytics:', err.message);
  }
}

// ============ CHECK IF ALREADY LOGGED IN ============
window.addEventListener('load', () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    
    if (currentUser.role === 'admin') {
      loadAdminPage();
      showPage('adminPage');
    } else {
      loadEventsPage();
      showPage('eventsPage');
    }
  } else {
    showPage('loginPage');
  }
});