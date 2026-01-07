import { useState, useEffect } from 'react';
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
  const [studentStats, setStudentStats] = useState({});
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Bulk sync all students
  const handleBulkSync = async () => {
    if (isBulkSyncing) return;
    
    setIsBulkSyncing(true);
    setSyncProgress({ current: 0, total: mockStudents.length });
    
    const newStats = {};
    
    // Fetch in batches of 5 to avoid overwhelming the API
    for (let i = 0; i < mockStudents.length; i++) {
      const student = mockStudents[i];
      try {
        const stats = await ExternalDataService.fetchPredictionStats(student.id);
        newStats[student.id] = stats;
      } catch (err) {
        console.error('Failed to sync ' + student.name, err);
        newStats[student.id] = { error: true };
      }
      setSyncProgress({ current: i + 1, total: mockStudents.length });
    }
    
    setStudentStats(newStats);
    setIsBulkSyncing(false);
  };

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Auto-Sync on launch
  useEffect(() => {
    const autoSync = localStorage.getItem('autoSync') === 'true';
    if (autoSync) {
      // Use setTimeout to avoid synchronous state update in effect
      setTimeout(() => handleBulkSync(), 0);
    }
  }, []);

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
    <div className="w-full h-full" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)' }}>
      
      {/* HEADER Nav */}
      <header style={{ 
        height: '60px', 
        borderBottom: '1px solid var(--glass-border)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 1.5rem',
        background: 'rgba(20, 20, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleSidebar} style={{ color: 'white', fontSize: '1.2rem', padding: '0.5rem' }}>
            ☰
          </button>
          <div onClick={goHome} style={{ fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span className="text-gradient">Student Karte</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Bulk Sync Button */}
          <button 
            onClick={handleBulkSync}
            disabled={isBulkSyncing}
            style={{ 
              color: 'white',
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isBulkSyncing ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isBulkSyncing ? (
              <span>同期中... {syncProgress.current}/{syncProgress.total}</span>
            ) : (
              <span>↻ 全員同期</span>
            )}
          </button>
          
          <button onClick={goSchedule} style={{ 
            color: currentView === 'schedule' ? 'white' : 'var(--text-muted)', 
            fontWeight: currentView === 'schedule' ? 'bold' : 'normal',
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: currentView === 'schedule' ? 'rgba(255,255,255,0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            スケジュール
          </button>
          <button onClick={goSettings} style={{ 
            color: currentView === 'settings' ? 'white' : 'var(--text-muted)', 
            fontWeight: currentView === 'settings' ? 'bold' : 'normal',
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: currentView === 'settings' ? 'rgba(255,255,255,0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}>
            設定
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{ 
          position: 'absolute',
          top: 0, 
          left: 0, 
          bottom: 0,
          width: '320px', 
          zIndex: 50,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'var(--bg-dark)',
          borderRight: '1px solid var(--glass-border)',
          boxShadow: '4px 0 15px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign:'right', padding:'0.5rem' }}>
             <button onClick={() => setIsSidebarOpen(false)} style={{ color:'var(--text-muted)' }}>✕ 閉じる</button>
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
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:40 }}
          />
        )}

        {/* VIEW CONTAINER */}
        <div style={{ flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
          {currentView === 'home' && (
             <HomeView 
               students={mockStudents} 
               studentStats={studentStats}
               onNavigate={(view) => {
                 if (view === 'settings') goSettings();
                 if (view === 'student_list') setIsSidebarOpen(true);
               }}
             />
          )}
          {currentView === 'schedule' && <ScheduleView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'student' && selectedStudent && (
             <StudentDetailView student={selectedStudent} initialStats={studentStats[selectedStudent.id]} />
          )}
          {currentView === 'student' && !selectedStudent && (
             <HomeView 
               students={mockStudents} 
               studentStats={studentStats}
               onNavigate={(view) => {
                 if (view === 'settings') goSettings();
                 if (view === 'student_list') setIsSidebarOpen(true);
               }}
             />
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
