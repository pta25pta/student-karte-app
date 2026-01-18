const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Config from environment or local file
let CREDENTIALS = {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};

if (!CREDENTIALS.email || !CREDENTIALS.key) {
    try {
        const credPath = path.join(__dirname, 'server/service-account.json');
        if (fs.existsSync(credPath)) {
            let raw = fs.readFileSync(credPath, 'utf8'); raw = raw.replace(/^\uFEFF/, '');
            const fileCreds = JSON.parse(raw);
            CREDENTIALS = {
                email: fileCreds.client_email,
                key: fileCreds.private_key
            };
            console.log("Loaded credentials from service-account.json");
        }
    } catch (e) {
        console.warn("Could not load service-account.json", e);
    }
}

const SHEET_ID = '1JpNyxSorAjUJYj_MUk-N-PBtbqtq9VIiyT-f0tlbDII';

// New Schemas
const STUDENT_HEADERS = [
    'id', 'name', 'status', 'rank', 'term', 'email', 'phone', 'dob',
    'fxtfId', 'fxtfPw', 'tradeHistory', 'trainingHistory', 'address',
    'noteName', 'outputUrl', 'goals', 'issues',
    'verificationProgress', 'tradeCompetition', 'hasToreTore', 'photoUrl'
];

const LESSON_HEADERS = ['id', 'studentId', 'lessonId', 'growth', 'challenges', 'instructor'];
const MEMO_HEADERS = ['id', 'studentId', 'date', 'content', 'tag'];

async function migrate() {
    console.log('Starting migration...');

    const jwt = new JWT({
        email: CREDENTIALS.email,
        key: CREDENTIALS.key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    console.log(`Connected to sheet: ${doc.title}`);

    // 1. Read existing data
    // FORCE USE OF VALID BACKUP
    let oldSheet = doc.sheetsByTitle['backup_json_1768739161926'];
    if (!oldSheet) {
        console.error("Critical: Backup source not found!");
        console.log("Available sheets:", Object.keys(doc.sheetsByTitle));
        // Try to find ANY generic backup
        const keys = Object.keys(doc.sheetsByTitle);
        const backups = keys.filter(k => k.startsWith('backup_json_')).sort();
        if (backups.length > 0) {
            console.log("Using oldest backup:", backups[0]);
            oldSheet = doc.sheetsByTitle[backups[0]];
        } else {
            return;
        }
    } else {
        console.log("Using verified backup source:", oldSheet.title);
    }

    const rows = await oldSheet.getRows();
    console.log(`Found ${rows.length} existing student rows.`);

    const studentData = [];
    const lessonData = [];
    const memoData = [];

    rows.forEach(row => {
        try {
            const id = row.get('id');
            const json = row.get('data');
            if (!json) return;

            const data = JSON.parse(json);

            // Prepare Student Row
            const studentRow = {};
            STUDENT_HEADERS.forEach(h => {
                let val = data[h];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val); // Fallback for complex fields not normalized
                studentRow[h] = val || '';
            });
            // Ensure ID is set
            studentRow['id'] = id || data.id;
            studentData.push(studentRow);

            // Extract Lessons
            if (data.lessonMemos) {
                Object.entries(data.lessonMemos).forEach(([lessonId, memo]) => {
                    const growth = typeof memo === 'string' ? memo : (memo.growth || '');
                    const challenges = typeof memo === 'string' ? '' : (memo.challenges || '');
                    const instructor = typeof memo === 'string' ? '' : (memo.instructor || '');

                    lessonData.push({
                        id: `${id}_${lessonId}`,
                        studentId: id,
                        lessonId: lessonId,
                        growth,
                        challenges,
                        instructor
                    });
                });
            }

            // Extract Memos
            if (Array.isArray(data.memoHistory)) {
                data.memoHistory.forEach(m => {
                    memoData.push({
                        id: m.id,
                        studentId: id,
                        date: m.date,
                        content: m.content,
                        tag: m.tag
                    });
                });
            }

        } catch (e) {
            console.error('Error parsing row:', e);
        }
    });

    console.log(`Parsed Data:
  - Students: ${studentData.length}
  - Lesson Records: ${lessonData.length}
  - Memos: ${memoData.length}`);

    // 3. Create NEW sheets if they don't exist
    // Note: We do NOT rename the backup. It stays as source.
    console.log('Creating new structured sheets (if needed)...');

    let newStudentSheet = doc.sheetsByTitle['students'];
    if (!newStudentSheet) {
        newStudentSheet = await doc.addSheet({ title: 'students', headerValues: STUDENT_HEADERS });
    } else {
        console.log("'students' sheet already exists. Clearing...");
        await newStudentSheet.clear();
        await newStudentSheet.setHeaderRow(STUDENT_HEADERS);
    }

    let newLessonSheet = doc.sheetsByTitle['lesson_records'];
    if (!newLessonSheet) {
        newLessonSheet = await doc.addSheet({ title: 'lesson_records', headerValues: LESSON_HEADERS });
    } else {
        console.log("'lesson_records' sheet already exists. Clearing...");
        await newLessonSheet.clear();
        await newLessonSheet.setHeaderRow(LESSON_HEADERS);
    }

    let newMemoSheet = doc.sheetsByTitle['memo_history'];
    if (!newMemoSheet) {
        newMemoSheet = await doc.addSheet({ title: 'memo_history', headerValues: MEMO_HEADERS });
    } else {
        console.log("'memo_history' sheet already exists. Clearing...");
        await newMemoSheet.clear();
        await newMemoSheet.setHeaderRow(MEMO_HEADERS);
    }

    // 4. Write Data
    console.log('Writing students...');
    if (studentData.length > 0) await newStudentSheet.addRows(studentData);

    console.log('Writing lesson records...');
    if (lessonData.length > 0) await newLessonSheet.addRows(lessonData);

    console.log('Writing memo history...');
    if (memoData.length > 0) await newMemoSheet.addRows(memoData);

    console.log('Migration Complete!');
}

migrate().catch(console.error);
