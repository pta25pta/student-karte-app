const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
// Import both for migration support
const LocalDatabase = require('./db');
const GoogleSheetsDatabase = require('./db-sheets');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google Sheets DB
const db = new GoogleSheetsDatabase();

// Local DB for migration reference
const localDataDir = process.env.DATA_DIR || __dirname;
const localDbPath = path.join(localDataDir, 'database.json');
const localDb = new LocalDatabase(localDbPath);

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for images

// --- Data Migration Logic ---
async function migrateDataIfNeeded() {
  try {
    console.log('Checking for data migration...');
    // Check if Sheets is empty
    const remoteStudents = await db.findAll('students');
    if (remoteStudents.length === 0) {
      console.log('Remote DB is empty. Checking local data...');
      const localStudents = localDb.findAll('students');
      
      if (localStudents.length > 0) {
        console.log(`Migrating ${localStudents.length} students to Google Sheets...`);
        for (const student of localStudents) {
          await db.create('students', student);
          console.log(`Migrated: ${student.name}`);
        }
        console.log('Migration completed!');
      } else {
        console.log('No local data to migrate.');
      }
    } else {
      console.log('Remote DB has data. Skipping migration.');
    }
  } catch (e) {
    console.error('Migration check failed:', e);
  }
}

// Perform migration on startup (non-blocking)
migrateDataIfNeeded();

// --- API Routes (Async/Await updated) ---

// POST: Login authentication
app.post('/api/auth', async (req, res) => {
  const { email, password } = req.body;
  // Simple check for now, can be moved to env vars later
  if (email === 'pta25pta@gmail.com' && password === 'pta2025pta44') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// GET: All students
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.findAll('students');
    res.json({ students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await db.findById('students', req.params.id);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Update or create student
app.post('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    let student = await db.findById('students', id);
    if (student) {
      student = await db.update('students', id, updates);
    } else {
      student = await db.create('students', { id, ...updates });
    }
    
    res.json({ success: true, student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Start server (Only if running directly, not in Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
  });
}

// Export for Vercel
module.exports = app;

