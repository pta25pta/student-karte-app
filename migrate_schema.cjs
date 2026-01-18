const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// Config from environment or previous setup
const CREDENTIALS = {
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

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
  let oldSheet = doc.sheetsByTitle['students'];
  if (!oldSheet) {
    // If 'students' doesn't exist, maybe it was already migrated or explicitly named differently?
    // Let's assume 'students' is the one with the JSON blobs.
    // If user deleted it, code breaks. Assuming it exists as per screenshot.
    console.error("Could not find 'students' sheet!");
    return;
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
      studentRow['id'] = id;
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

  // 2. Rename old sheet to backup
  const backupTitle = `backup_json_${Date.now()}`;
  console.log(`Renaming old 'students' sheet to '${backupTitle}'...`);
  await oldSheet.updateProperties({ title: backupTitle });

  // 3. Create NEW sheets
  console.log('Creating new structured sheets...');
  
  const newStudentSheet = await doc.addSheet({ title: 'students', headerValues: STUDENT_HEADERS });
  const newLessonSheet = await doc.addSheet({ title: 'lesson_records', headerValues: LESSON_HEADERS });
  const newMemoSheet = await doc.addSheet({ title: 'memo_history', headerValues: MEMO_HEADERS });

  // 4. Write Data
  console.log('Writing students...');
  if (studentData.length > 0) await newStudentSheet.addRows(studentData);

  console.log('Writing lesson records...');
  // Batch write might trigger rate limits if huge, but 30-50 students is fine.
  if (lessonData.length > 0) await newLessonSheet.addRows(lessonData);

  console.log('Writing memo history...');
  if (memoData.length > 0) await newMemoSheet.addRows(memoData);

  console.log('Migration Complete!');
}

migrate().catch(console.error);
