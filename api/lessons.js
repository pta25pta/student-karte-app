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
        const sheet = doc.sheetsByTitle['lesson_records'];
        const { studentId } = req.query;

        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const lessons = rows
                .filter(row => String(row.get('studentId')) === String(studentId))
                .reduce((acc, row) => {
                    acc[row.get('lessonId')] = {
                        growth: row.get('growth') || '',
                        challenges: row.get('challenges') || '',
                        instructor: row.get('instructor') || '',
                    };
                    return acc;
                }, {});

            res.json({ lessons });
        } else if (req.method === 'POST') {
            const { lessonId, growth, challenges, instructor } = req.body;

            const rows = await sheet.getRows();
            const existingRow = rows.find(r =>
                String(r.get('studentId')) === String(studentId) && String(r.get('lessonId')) === String(lessonId)
            );

            if (existingRow) {
                existingRow.set('growth', growth || '');
                existingRow.set('challenges', challenges || '');
                existingRow.set('instructor', instructor || '');
                await existingRow.save();
            } else {
                await sheet.addRow({
                    id: `${studentId}_${lessonId}`,
                    studentId: String(studentId),
                    lessonId: String(lessonId),
                    growth: growth || '',
                    challenges: challenges || '',
                    instructor: instructor || ''
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
