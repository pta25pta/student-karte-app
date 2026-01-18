const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const StudentService = {
    async getAllStudents() {
        try {
            const res = await fetch(API_BASE + '/students');
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            return data.students || [];
        } catch (err) {
            console.error('API Error:', err);
            return [];
        }
    },

    async getStudentById(id) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(id));
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            return null;
        }
    },

    async updateStudent(student) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(student.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });

            if (!res.ok) throw new Error('Failed to update student');
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    },

    async getLessonMemos(id) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(id) + '/lesson-memos');
            if (!res.ok) return {};
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            return {};
        }
    },

    async updateLessonMemos(studentId, lessonMemos) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(studentId) + '/lesson-memos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonMemos })
            });

            if (!res.ok) throw new Error('Failed to update lesson memos');
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    },

    async getMemoHistory(id) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(id) + '/memo-history');
            if (!res.ok) return [];
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            return [];
        }
    },

    async updateMemoHistory(studentId, memoHistory) {
        try {
            const res = await fetch(API_BASE + '/students/' + encodeURIComponent(studentId) + '/memo-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memoHistory })
            });

            if (!res.ok) throw new Error('Failed to update memo history');
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }
};
