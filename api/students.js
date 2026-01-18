// Vercel Serverless Function for Students API
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
  let sheet = doc.sheetsByTitle['students'];
  if (!sheet) {
    sheet = await doc.addSheet({ title: 'students', headerValues: ['id', 'data'] });
  }
  return sheet;
}

export default async function handler(req, res) {
  try {
    const doc = await getDoc();
    const sheet = await getSheet(doc);
    
    if (req.method === 'GET') {
      const rows = await sheet.getRows();
      const students = rows.map(row => {
        try {
          const data = JSON.parse(row.get('data'));
          return { ...data, id: row.get('id') };
        } catch (e) {
          return null;
        }
      }).filter(item => item !== null);
      
      res.json({ students });
    } else if (req.method === 'POST') {
      const { id } = req.query;
      const updates = req.body;
      
      const rows = await sheet.getRows();
      const row = rows.find(r => String(r.get('id')) === String(id));
      
      if (row) {
        const currentData = JSON.parse(row.get('data'));
        const newData = { ...currentData, ...updates };
        row.set('data', JSON.stringify(newData));
        await row.save();
        res.json({ success: true, student: newData });
      } else {
        const newStudent = { id, ...updates };
        await sheet.addRow({ id: String(id), data: JSON.stringify(newStudent) });
        res.json({ success: true, student: newStudent });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}