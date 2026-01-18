// Vercel Serverless Function for Lesson Records API
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '1JpNyxSorAjUJYj_MUk-N-PBtbqtq9VIiyT-f0tlbDII';

async function getDoc() {
  const creds = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
  
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

async function getSheet(doc) {
  let sheet = doc.sheetsByTitle['lessons'];
  if (!sheet) {
    // Create sheet with headers for lesson records
    sheet = await doc.addSheet({ 
      title: 'lessons', 
      headerValues: ['studentId', 'eventId', 'growth', 'challenges', 'instructor', 'updatedAt'] 
    });
  }
  return sheet;
}

export default async function handler(req, res) {
  try {
    const doc = await getDoc();
    const sheet = await getSheet(doc);
    const { studentId } = req.query;
    
    if (req.method === 'GET') {
      // Get all lesson records for a student
      const rows = await sheet.getRows();
      const lessons = rows
        .filter(row => row.get('studentId') === studentId)
        .reduce((acc, row) => {
          acc[row.get('eventId')] = {
            growth: row.get('growth') || '',
            challenges: row.get('challenges') || '',
            instructor: row.get('instructor') || '',
          };
          return acc;
        }, {});
      
      res.json({ lessons });
    } else if (req.method === 'POST') {
      const { eventId, growth, challenges, instructor } = req.body;
      
      const rows = await sheet.getRows();
      const existingRow = rows.find(r => 
        r.get('studentId') === studentId && r.get('eventId') === eventId
      );
      
      if (existingRow) {
        existingRow.set('growth', growth || '');
        existingRow.set('challenges', challenges || '');
        existingRow.set('instructor', instructor || '');
        existingRow.set('updatedAt', new Date().toISOString());
        await existingRow.save();
      } else {
        await sheet.addRow({
          studentId,
          eventId,
          growth: growth || '',
          challenges: challenges || '',
          instructor: instructor || '',
          updatedAt: new Date().toISOString()
        });
      }
      
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Lessons API Error:', error);
    res.status(500).json({ error: error.message });
  }
}