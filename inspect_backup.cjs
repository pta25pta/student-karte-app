const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function readJson(path) {
    let raw = fs.readFileSync(path, 'utf8');
    raw = raw.replace(/^\uFEFF/, '');
    return JSON.parse(raw);
}

async function run() {
    let creds;
    try {
        const credPath = path.join(__dirname, 'server/service-account.json');
        creds = readJson(credPath);
    } catch (e) { console.error("Creds error", e); return; }

    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1JpNyxSorAjUJYj_MUk-N-PBtbqtq9VIiyT-f0tlbDII', jwt);
    await doc.loadInfo();

    const backupSheets = Object.keys(doc.sheetsByTitle).filter(k => k.startsWith('backup_json_'));
    if (backupSheets.length === 0) return;
    backupSheets.sort();
    const backupTitle = backupSheets[0]; // Use OLDER backup

    console.log("Inspecting:", backupTitle);
    const sheet = doc.sheetsByTitle[backupTitle];

    const rows = await sheet.getRows();
    console.log("Headers:", sheet.headerValues); // safe to access now

    if (rows.length > 0) {
        console.log("Row 1 Raw:", rows[0]._rawData);
        console.log("Row 1 'data':", rows[0].get('data'));
        // Try to find the column that looks like JSON
        sheet.headerValues.forEach(h => {
            const val = rows[0].get(h);
            if (typeof val === 'string' && val.startsWith('{')) {
                console.log(`POTENTIAL JSON COLUMN: '${h}'`);
            }
        });
    }
}

run().catch(console.error);
