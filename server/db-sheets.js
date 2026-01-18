const { getDoc } = require('./config/google-sheets');

class GoogleSheetsDatabase {
    constructor() {
        this.doc = null;
    }

    async init() {
        if (!this.doc) {
            this.doc = await getDoc();
        }
    }

    async getSheet(sheetTitle) {
        await this.init();
        return this.doc.sheetsByTitle[sheetTitle];
    }

    // --- Helper to convert row to object ---
    rowToObject(row, headers) {
        const obj = {};
        headers.forEach(h => {
            let val = row.get(h);
            // Try to recover types if possible (e.g. JSON strings)
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try { val = JSON.parse(val); } catch (e) { /* ignore */ }
            }
            obj[h] = val;
        });
        return obj;
    }

    async findAll(collection, options = {}) {
        if (collection !== 'students') {
            // Fallback/Generic for other potential collections if any
            const sheet = await this.getSheet(collection);
            if (!sheet) return [];
            const rows = await sheet.getRows();
            return rows.map(r => r.toObject());
        }

        // Specialized logic for 'students'
        await this.init();
        const studentSheet = this.doc.sheetsByTitle['students'];
        if (!studentSheet) return []; // Should exist

        const studentRows = await studentSheet.getRows();
        const headers = studentSheet.headerValues;
        const students = studentRows.map(row => this.rowToObject(row, headers));

        // If not joining, return flat students
        if (!options.join) {
            return students;
        }

        // Fetch related data
        const lessonSheet = this.doc.sheetsByTitle['lesson_records'];
        const memoSheet = this.doc.sheetsByTitle['memo_history'];

        let lessonRows = [];
        if (lessonSheet) lessonRows = await lessonSheet.getRows();

        let memoRows = [];
        if (memoSheet) memoRows = await memoSheet.getRows();

        // Attach relational data
        students.forEach(student => {
            student.lessonMemos = {};
            lessonRows.filter(r => r.get('studentId') === student.id).forEach(r => {
                student.lessonMemos[r.get('lessonId')] = {
                    growth: r.get('growth'),
                    challenges: r.get('challenges'),
                    instructor: r.get('instructor')
                };
            });

            student.memoHistory = memoRows
                .filter(r => r.get('studentId') === student.id)
                .map(r => ({
                    id: r.get('id'),
                    date: r.get('date'),
                    content: r.get('content'),
                    tag: r.get('tag')
                }));
        });

        return students;
    }

    async getLessonMemos(studentId) {
        await this.init();
        const lessonSheet = this.doc.sheetsByTitle['lesson_records'];
        if (!lessonSheet) return {};

        const rows = await lessonSheet.getRows();
        const studentRows = rows.filter(r => r.get('studentId') === String(studentId));

        const memos = {};
        studentRows.forEach(r => {
            memos[r.get('lessonId')] = {
                growth: r.get('growth'),
                challenges: r.get('challenges'),
                instructor: r.get('instructor')
            };
        });
        return memos;
    }

    async getMemoHistory(studentId) {
        await this.init();
        const memoSheet = this.doc.sheetsByTitle['memo_history'];
        if (!memoSheet) return [];

        const rows = await memoSheet.getRows();
        return rows
            .filter(r => r.get('studentId') === String(studentId))
            .map(r => ({
                id: r.get('id'),
                date: r.get('date'),
                content: r.get('content'),
                tag: r.get('tag')
            }));
    }

    async findById(collection, id) {
        const all = await this.findAll(collection, { join: true });
        return all.find(item => String(item.id) === String(id));
    }

    async create(collection, item) {
        if (collection !== 'students') {
            const sheet = await this.getSheet(collection);
            if (sheet) await sheet.addRow(item);
            return item;
        }

        const studentSheet = await this.getSheet('students');
        const headers = studentSheet.headerValues;
        const flatStudent = {};
        headers.forEach(h => {
            let val = item[h];
            if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
            flatStudent[h] = val || '';
        });

        await studentSheet.addRow(flatStudent);
        return item;
    }

    async update(collection, id, updates) {
        if (collection !== 'students') return null;

        const studentSheet = await this.getSheet('students');
        const lessonSheet = await this.getSheet('lesson_records');
        const memoSheet = await this.getSheet('memo_history');

        const sRows = await studentSheet.getRows();
        const sRow = sRows.find(r => String(r.get('id')) === String(id));

        if (!sRow) return null;

        const studentHeaders = studentSheet.headerValues;
        let studentChanged = false;

        for (const key of Object.keys(updates)) {
            if (studentHeaders.includes(key)) {
                let val = updates[key];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                sRow.set(key, val);
                studentChanged = true;
            }
        }
        if (studentChanged) await sRow.save();

        if (updates.lessonMemos) {
            const lRows = await lessonSheet.getRows();
            const studentLRows = lRows.filter(r => r.get('studentId') === String(id));

            for (const [lessonId, memoData] of Object.entries(updates.lessonMemos)) {
                const existingRow = studentLRows.find(r => r.get('lessonId') === String(lessonId));
                if (existingRow) {
                    existingRow.set('growth', memoData.growth || '');
                    existingRow.set('challenges', memoData.challenges || '');
                    existingRow.set('instructor', memoData.instructor || '');
                    await existingRow.save();
                } else {
                    await lessonSheet.addRow({
                        id: `${id}_${lessonId}`,
                        studentId: id,
                        lessonId: lessonId,
                        growth: memoData.growth || '',
                        challenges: memoData.challenges || '',
                        instructor: memoData.instructor || ''
                    });
                }
            }
        }

        if (updates.memoHistory) {
            const mRows = await memoSheet.getRows();
            const studentMRows = mRows.filter(r => r.get('studentId') === String(id));
            const newIds = updates.memoHistory.map(m => String(m.id));

            for (const row of studentMRows) {
                if (!newIds.includes(String(row.get('id')))) {
                    await row.delete();
                }
            }

            for (const memo of updates.memoHistory) {
                const existingRow = studentMRows.find(r => r.get('id') === String(memo.id));
                if (existingRow) {
                    if (existingRow.get('content') !== memo.content || existingRow.get('tag') !== memo.tag) {
                        existingRow.set('content', memo.content);
                        existingRow.set('tag', memo.tag);
                        await existingRow.save();
                    }
                } else {
                    await memoSheet.addRow({
                        id: memo.id,
                        studentId: id,
                        date: memo.date,
                        content: memo.content,
                        tag: memo.tag
                    });
                }
            }
        }

        return this.findById('students', id);
    }

    async delete(collection, id) {
        return false;
    }
}

module.exports = GoogleSheetsDatabase;
