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
        const { id } = req.query; // studentId

        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const history = rows
                .filter(r => String(r.get('studentId')) === String(id))
                .map(r => ({
                    id: r.get('id'),
                    date: r.get('date'),
                    content: r.get('content'),
                    tag: r.get('tag')
                }));
            res.json(history);
        } else {
            res.status(405).end();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
