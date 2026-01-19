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

const STUDENT_HEADERS = [
    'id', 'name', 'status', 'rank', 'term', 'email', 'phone', 'dob',
    'fxtfId', 'fxtfPw', 'tradeHistory', 'trainingHistory', 'address',
    'noteName', 'outputUrl', 'goals', 'issues',
    'verificationProgress', 'tradeCompetition', 'hasToreTore', 'photoUrl'
];

const EXCLUDE_KEYS = ['lessonMemos', 'memoHistory'];

export default async function handler(req, res) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['students'];

        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const students = rows.map(row => {
                const obj = {};
                sheet.headerValues.forEach(h => {
                    let val = row.get(h);
                    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                        try { val = JSON.parse(val); } catch (e) { }
                    }
                    obj[h] = val;
                });
                return obj;
            });

            res.json({ students });
        } else if (req.method === 'POST') {
            const { id } = req.query;
            const updates = req.body;

            // --- Auto-Add Columns Logic ---
            await sheet.loadHeaderRow();
            const currentHeaders = sheet.headerValues;
            const newHeaders = [...currentHeaders];
            let headerChanged = false;

            Object.keys(updates).forEach(key => {
                if (!newHeaders.includes(key) && !EXCLUDE_KEYS.includes(key)) {
                    newHeaders.push(key);
                    headerChanged = true;
                }
            });

            if (headerChanged) {
                await sheet.setHeaderRow(newHeaders);
            }
            // ------------------------------

            const rows = await sheet.getRows();
            const row = rows.find(r => String(r.get('id')) === String(id));

            if (row) {
                Object.keys(updates).forEach(key => {
                    if (!EXCLUDE_KEYS.includes(key)) {
                        let val = updates[key];
                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                        row.set(key, val);
                    }
                });
                await row.save();
                res.json({ success: true, student: updates });
            } else {
                const newRow = { id: String(id) };
                Object.keys(updates).forEach(key => {
                    if (!EXCLUDE_KEYS.includes(key)) {
                        let val = updates[key];
                        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                        newRow[key] = val;
                    }
                });
                await sheet.addRow(newRow);
                res.json({ success: true, student: newRow });
            }
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
}
