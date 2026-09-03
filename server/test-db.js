const pool = require('./db');

async function test() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    const [events] = await connection.query('SELECT * FROM event_system.events');
    console.log('✅ Events found:', events.length);
    console.log(events);
    
    connection.release();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit(0);
}

test();