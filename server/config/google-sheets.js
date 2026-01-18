const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Config
const SPREADSHEET_ID = '1JpNyxSorAjUJYj_MUk-N-PBtbqtq9VIiyT-f0tlbDII';

let creds;

// Priority: Environment Variables (Vercel) -> Local File (Dev)
if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
  creds = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix newlines in Env vars
  };
} else {
  // Fallback to local file
  try {
    const credPath = path.join(__dirname, '../service-account.json');
    if (fs.existsSync(credPath)) {
      const raw = fs.readFileSync(credPath, 'utf8');
      creds = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('No local service-account.json found');
  }
}

if (!creds) {
  console.error('CRITICAL: No Google Sheets credentials found. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY or provide service-account.json');
}

const serviceAccountAuth = new JWT({
  email: creds ? creds.client_email : '',
  key: creds ? creds.private_key : '',
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

async function getDoc() {
  await doc.loadInfo();
  return doc;
}

module.exports = { getDoc };
