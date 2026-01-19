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

export default async function handler(req, res) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle['memo_history'];
        const { id: studentId } = req.query;

        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const history = rows
                .filter(r => String(r.get('studentId')) === String(studentId))
                .map(r => ({
                    id: r.get('id'),
                    date: r.get('date'),
                    content: r.get('content'),
                    tag: r.get('tag')
                }));
            res.json(history);
        } else if (req.method === 'POST') {
            const { memoHistory } = req.body; // Full array of memos

            if (!Array.isArray(memoHistory)) {
                return res.status(400).json({ error: 'memoHistory array is required' });
            }

            await sheet.loadHeaderRow();
            const headers = sheet.headerValues;
            if (!headers.includes('tag')) {
                const newHeaders = [...headers, 'tag'];
                await sheet.setHeaderRow(newHeaders);
            }

            const rows = await sheet.getRows();
            const studentRows = rows.filter(r => String(r.get('studentId')) === String(studentId));

            // Sync logic:
            // 1. Delete rows in sheet that are not in the new array
            for (const row of studentRows) {
                const stillExists = memoHistory.find(m => String(m.id) === String(row.get('id')));
                if (!stillExists) {
                    await row.delete();
                }
            }

            // 2. Update or add rows from the new array
            for (const memo of memoHistory) {
                const row = studentRows.find(r => String(r.get('id')) === String(memo.id));
                if (row) {
                    row.set('date', memo.date || '');
                    row.set('content', memo.content || '');
                    row.set('tag', memo.tag || '');
                    await row.save();
                } else {
                    await sheet.addRow({
                        studentId: String(studentId),
                        id: String(memo.id),
                        date: memo.date || '',
                        content: memo.content || '',
                        tag: memo.tag || ''
                    });
                }
            }

            res.json({ success: true });
        } else {
            res.status(405).end();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
