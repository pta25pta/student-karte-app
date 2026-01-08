import { useState, useEffect, useCallback } from 'react';
import { StudentList } from './components/StudentList';
import { StudentDetailView } from './components/StudentDetailView';
import { HomeView } from './components/HomeView';
import { ScheduleView } from './components/ScheduleView';
import { SettingsView } from './components/SettingsView';
import { mockStudents } from './data/mockData';
import { ExternalDataService } from './services/ExternalDataService';

function App() {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('home');

    // Centralized student stats storage
    const [studentStats, setStudentStats] = useState(() => {
        try {
            const saved = localStorage.getItem('studentStats');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Failed to parse studentStats', e);
            return {};
        }
    });
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
    const [lastSynced, setLastSynced] = useState(() => {
        try {
            const saved = localStorage.getItem('lastSynced');
            return saved ? new Date(saved) : null;
        } catch (e) {
            console.error('Failed to parse lastSynced', e);
            return null;
        }
    });

    // Toast Notification State
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // Bulk sync all students
    const handleBulkSync = useCallback(async () => {
        if (isBulkSyncing) return;

        setIsBulkSyncing(true);
        setSyncProgress({ current: 0, total: mockStudents.length });
        addToast('全員同期を開始しました', 'info');

        const newStats = {};
        const BATCH_SIZE = 3;

        // Fetch in batches to improve speed while respecting API limits
        for (let i = 0; i < mockStudents.length; i += BATCH_SIZE) {
            const batch = mockStudents.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (student) => {
                try {
                    const stats = await ExternalDataService.fetchPredictionStats(student.id);
                    newStats[student.id] = stats;
                } catch (err) {
                    console.error('Failed to sync ' + student.name, err);
                    newStats[student.id] = { error: true };
                }
            }));

            setSyncProgress({
                current: Math.min(i + BATCH_SIZE, mockStudents.length),
                total: mockStudents.length
            });
        }

        setStudentStats(newStats);
        setLastSynced(new Date());
        setIsBulkSyncing(false);
        addToast('全員同期が完了しました', 'success');
    }, [isBulkSyncing, addToast]);

    // Load theme on mount - Force 'light' for Modern Clean
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }, []);

    // Auto-Sync on launch
    useEffect(() => {
        const autoSync = localStorage.getItem('autoSync') === 'true';
        if (autoSync) {
            setTimeout(() => handleBulkSync(), 0);
        }
    }, [handleBulkSync]);

    const handleSelect = (student) => {
        setSelectedStudent(student);
        setIsSidebarOpen(false);
        setCurrentView('student');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const goHome = () => {
        setSelectedStudent(null);
        setCurrentView('home');
        setIsSidebarOpen(false);
    };

    const goSchedule = () => {
        setSelectedStudent(null);
        setCurrentView('schedule');
        setIsSidebarOpen(false);
    };

    const goSettings = () => {
        setSelectedStudent(null);
        setCurrentView('settings');
        setIsSidebarOpen(false);
    };

    return (
        <div className="w-full h-full" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)' }}>

            {/* HEADER Nav - Modern Clean: White with border */}
            <header style={{
                height: '60px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1.5rem',
                background: 'var(--bg-card)',
                zIndex: 100,
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={toggleSidebar} style={{ color: 'var(--text-main)', fontSize: '1.2rem', padding: '0.5rem' }}>
                        ☰
                    </button>
                    <div onClick={goHome} style={{ fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                        <span>Student Karte</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Last Synced Label */}
                    {lastSynced && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                            最終更新: {lastSynced.getHours().toString().padStart(2, '0')}:{lastSynced.getMinutes().toString().padStart(2, '0')}
                        </div>
                    )}

                    {/* Bulk Sync Button */}
                    <button
                        onClick={handleBulkSync}
                        disabled={isBulkSyncing}
                        className="btn-primary"
                        style={{
                            opacity: isBulkSyncing ? 0.8 : 1
                        }}
                    >
                        {isBulkSyncing ? (
                            <span>同期中... {syncProgress.current}/{syncProgress.total}</span>
                        ) : (
                            <span>↻ 全員同期</span>
                        )}
                    </button>

                    <button onClick={goSchedule} style={{
                        color: currentView === 'schedule' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: currentView === 'schedule' ? '600' : 'normal',
                        fontSize: '0.9rem',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: currentView === 'schedule' ? '#EFF6FF' : 'transparent',
                        transition: 'all 0.2s'
                    }}>
                        スケジュール
                    </button>
                    <button onClick={goSettings} style={{
                        color: currentView === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: currentView === 'settings' ? '600' : 'normal',
                        fontSize: '0.9rem',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: currentView === 'settings' ? '#EFF6FF' : 'transparent',
                        transition: 'all 0.2s'
                    }}>
                        設定
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

                {/* SIDEBAR - Modern Clean: White with border */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '320px',
                    zIndex: 50,
                    transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'var(--bg-sidebar)',
                    borderRight: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ textAlign: 'right', padding: '0.5rem' }}>
                        <button onClick={() => setIsSidebarOpen(false)} style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>✕ 閉じる</button>
                    </div>
                    <StudentList
                        students={mockStudents}
                        studentStats={studentStats}
                        onSelectStudent={handleSelect}
                        selectedId={selectedStudent?.id}
                        style={{ height: 'calc(100% - 40px)', width: '100%', border: 'none' }}
                    />
                </div>

                {/* OVERLAY BACKDROP */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }}
                    />
                )}

                {/* VIEW CONTAINER */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: 'var(--bg-main)' }}>
                    {currentView === 'home' && (
                        <HomeView
                            students={mockStudents}
                            studentStats={studentStats}
                            onNotify={addToast}
                            onNavigate={(view, data) => {
                                if (view === 'settings') goSettings();
                                if (view === 'student_list') setIsSidebarOpen(true);
                                if (view === 'schedule') goSchedule();
                                if (view === 'student_detail' && data) handleSelect(data);
                            }}
                        />
                    )}
                    {currentView === 'schedule' && <ScheduleView />}
                    {currentView === 'settings' && <SettingsView />}
                    {currentView === 'student' && selectedStudent && (
                        <StudentDetailView
                            student={selectedStudent}
                            initialStats={studentStats[selectedStudent.id]}
                            onNotify={addToast}
                        />
                    )}
                    {currentView === 'student' && !selectedStudent && (
                        <HomeView
                            students={mockStudents}
                            studentStats={studentStats}
                            onNotify={addToast}
                            onNavigate={(view, data) => {
                                if (view === 'settings') goSettings();
                                if (view === 'student_list') setIsSidebarOpen(true);
                                if (view === 'schedule') goSchedule();
                                if (view === 'student_detail' && data) handleSelect(data);
                            }}
                        />
                    )}
                </div>

            </div>

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' && '✅'}
                        {toast.type === 'error' && '⚠️'}
                        {toast.type === 'info' && 'ℹ️'}
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;



