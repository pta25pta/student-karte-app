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
        const { id: studentId } = req.query;

        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const memos = {};
            rows
                .filter(r => String(r.get('studentId')) === String(studentId))
                .forEach(r => {
                    memos[r.get('lessonId')] = {
                        growth: r.get('growth'),
                        challenges: r.get('challenges'),
                        instructor: r.get('instructor'),
                        growthImages: r.get('growthImages') ? JSON.parse(r.get('growthImages')) : [],
                        challengesImages: r.get('challengesImages') ? JSON.parse(r.get('challengesImages')) : [],
                        instructorImages: r.get('instructorImages') ? JSON.parse(r.get('instructorImages')) : []
                    };
                });
            res.json(memos);
        } else if (req.method === 'POST') {
            const { lessonMemos } = req.body; // Map of lessonId -> { growth, challenges, instructor }

            if (!lessonMemos || typeof lessonMemos !== 'object') {
                return res.status(400).json({ error: 'lessonMemos object is required' });
            }

            // Ensure headers exist
            await sheet.loadHeaderRow();
            const headers = sheet.headerValues;
            const neededHeaders = ['growthImages', 'challengesImages', 'instructorImages'];
            let newHeaders = [...headers];
            let headerChanged = false;

            neededHeaders.forEach(h => {
                if (!newHeaders.includes(h)) {
                    newHeaders.push(h);
                    headerChanged = true;
                }
            });

            if (headerChanged) {
                await sheet.setHeaderRow(newHeaders);
            }

            const rows = await sheet.getRows();
            const studentRows = rows.filter(r => String(r.get('studentId')) === String(studentId));

            // For each memo in the request, update or add
            for (const [lessonId, memo] of Object.entries(lessonMemos)) {
                const row = studentRows.find(r => String(r.get('lessonId')) === String(lessonId));
                if (row) {
                    // Only update fields that are explicitly provided (not undefined)
                    if (memo.growth !== undefined) row.set('growth', memo.growth || '');
                    if (memo.challenges !== undefined) row.set('challenges', memo.challenges || '');
                    if (memo.instructor !== undefined) row.set('instructor', memo.instructor || '');
                    if (memo.growthImages !== undefined) row.set('growthImages', JSON.stringify(memo.growthImages || []));
                    if (memo.challengesImages !== undefined) row.set('challengesImages', JSON.stringify(memo.challengesImages || []));
                    if (memo.instructorImages !== undefined) row.set('instructorImages', JSON.stringify(memo.instructorImages || []));
                    await row.save();
                } else {
                    if (memo.growth || memo.challenges || memo.instructor || (memo.growthImages && memo.growthImages.length) || (memo.challengesImages && memo.challengesImages.length) || (memo.instructorImages && memo.instructorImages.length)) {
                        const compositeId = String(studentId) + '_' + String(lessonId);
                        await sheet.addRow({
                            id: compositeId,
                            studentId: String(studentId),
                            lessonId: String(lessonId),
                            growth: memo.growth || '',
                            challenges: memo.challenges || '',
                            instructor: memo.instructor || '',
                            growthImages: JSON.stringify(memo.growthImages || []),
                            challengesImages: JSON.stringify(memo.challengesImages || []),
                            instructorImages: JSON.stringify(memo.instructorImages || [])
                        });
                    }
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
