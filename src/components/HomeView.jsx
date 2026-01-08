import { useState, useEffect, useMemo } from 'react';

export function HomeView({ students = [], studentStats = {}, onNavigate }) {
  // --- Data Processing -----------------------------------------
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [alertThreshold, setAlertThreshold] = useState(50); // Term filter for alerts
  
  // Real data calculations
  const dashboardData = useMemo(() => {
    // 1. Basic Counts
    const activeCount = students.length;
    const term1Count = students.filter(s => (s.term || 1) === 1).length;

    // 2. Performance Stats
    let totalWinRate = 0;
    let countWithStats = 0;
    let lowPerformanceStudents = [];
    let noDataStudents = [];

    students.forEach(s => {
      const stat = studentStats[s.id];
      // Check if stat exists and has valid winRate
      if (stat && !stat.error && stat.winRate !== undefined) {
         const rate = parseFloat(stat.winRate) || 0;
         const count = stat.totalPredictions || 0;
         
         // Only count stats if they have actually played
         if (count > 0) {
             totalWinRate += rate;
             countWithStats++;
         }

         // Alert Logic: Low Win Rate (Dynamic Threshold)
         if (rate < alertThreshold && count > 0) {
            lowPerformanceStudents.push({ ...s, currentWinRate: rate, type: 'low_win_rate' });
         }
      }
    });

    const avgWinRate = countWithStats > 0 ? (totalWinRate / countWithStats).toFixed(1) + '%' : '-';
    
    // Combine Alerts - Only include students WITH data who have low performance
    // Get unique terms
    const uniqueTerms = [...new Set(students.map(s => s.term || 1))].sort((a,b) => a - b);

    const alerts = [
        ...lowPerformanceStudents
    ].sort((a, b) => (a.currentWinRate || 0) - (b.currentWinRate || 0));

    return {
      activeCount,
      term1Count,
      avgWinRate,
      alerts,
      uniqueTerms
    };
  }, [students, studentStats, alertThreshold]);

  // Schedule Logic (Next 3 Events)
  useEffect(() => {
    try {
      const savedSchedule = localStorage.getItem('scheduleData');
      if (savedSchedule) {
        const schedule = JSON.parse(savedSchedule);
        const now = new Date();
        const allEvents = schedule.flatMap(t => t.events || []);
        
        // Show events for current month
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthEvents = allEvents
          .map(e => ({ ...e, dateObj: new Date(e.start || e.date) }))
          .filter(e => e.dateObj.getMonth() === currentMonth && e.dateObj.getFullYear() === currentYear)
          .sort((a, b) => a.dateObj - b.dateObj);
        setUpcomingEvents(monthEvents);
      }
    } catch (e) {
      console.error('Failed to load schedule', e);
    }
  }, []);

  const filteredAlerts = selectedTerm === 'all' 
    ? dashboardData.alerts 
    : dashboardData.alerts.filter(a => (a.term || 1) === parseInt(selectedTerm));

  return (
    <div className="h-full w-full animate-fade-in" style={{ paddingRight: '0.5rem', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* MAIN: Split View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem', minHeight: '300px' }}>
           
           {/* LEFT: Priority Alerts Panel */}
           <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '0.75rem 1rem', background: '#F9FAFB', borderBottom: '1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                 <h2 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                   🚨 要注意生徒
                   {dashboardData.alerts.length > 0 && (
                     <span style={{ background: '#EF4444', color: 'white', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px' }}>{dashboardData.alerts.length}</span>
                   )}
                 </h2>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                     <option value="all">全期</option>
                     {dashboardData.uniqueTerms.map(t => <option key={t} value={t}>{t}期</option>)}
                   </select>
                                      <div style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                     <span>勝率</span>
                     <input 
                       type="number" 
                       min="0" 
                       max="100" 
                       value={alertThreshold} 
                       onChange={(e) => setAlertThreshold(Number(e.target.value))} 
                       style={{ width:'40px', padding:'0.1rem', borderRadius:'4px', border:'1px solid var(--border-color)', textAlign:'center' }}
                     />
                     <span>%未満</span>
                   </div>
                 </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                                  {filteredAlerts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {filteredAlerts.map(s => (
                         <div key={s.id} style={{ 
                           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                           padding: '0.75rem', borderRadius: '6px', border: '1px solid #E5E7EB',
                           background: '#FFFFFF'
                         }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{s.name}</div>
                               <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ID: {s.id}</div>
                            </div>
                            <div>
                               {s.type === 'low_win_rate' && (
                                 <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: '4px' }}>
                                   勝率 {s.currentWinRate}%
                                 </span>
                               )}
                               {s.type === 'no_data' && (
                                 <span style={{ fontSize: '0.8rem', color: '#6B7280', background: '#E5E7EB', padding: '2px 8px', borderRadius: '4px' }}>
                                   データなし
                                 </span>
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                 ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#10B981', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
                       <span style={{ fontSize: '1.5rem' }}>🎉</span>
                       <span>アラートはありません。全員順調です！</span>
                    </div>
                 )}
              </div>
           </div>

           {/* RIGHT: Compact Schedule */}
           <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '0.75rem 1rem', background: '#F9FAFB', borderBottom: '1px solid var(--border-color)' }}>
                 <h2 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>📅 今月の予定</h2>
              </div>
              <div style={{ flex: 1, padding: '0.5rem' }}>
                 {upcomingEvents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {upcomingEvents.map((evt, i) => (
                          <div key={i} onClick={() => onNavigate && onNavigate('schedule')} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>
                             <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                               {new Date(evt.start || evt.date).toLocaleDateString()} {new Date(evt.start || evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </div>
                             <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{evt.title}</div>
                             {evt.type && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{evt.type}</div>}
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>予定なし</div>)}
              </div>
              {/* Simple Actions */}
              <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns:'1fr', gap:'0.5rem' }}>
                  <button 
                    onClick={() => onNavigate && onNavigate('schedule')}
                    className="btn"
                    style={{ background: 'white', border: '1px solid var(--border-color)', color:'var(--text-main)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}
                  >
                    <span>📅</span> スケジュール管理へ
                  </button>
              </div>
           </div>
        
        </div>

        {/* BOTTOM: Compact Quick Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
           <CompactButton icon="📝" label="生徒リスト" onClick={() => onNavigate && onNavigate('student_list')} />
           <CompactButton icon="⚙️" label="システム設定" onClick={() => onNavigate && onNavigate('settings')} />
           <CompactButton icon="🔄" label="データ同期" onClick={() => document.getElementById('btn-sync-all')?.click()} />
        </div>

      </div>
    </div>
  );
}

// Sub-components
function CompactButton({ icon, label, onClick }) {
    return (
        <button 
          onClick={onClick}
          className="card" 
          style={{ 
              padding: '0.75rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              fontWeight: '500',
              color: 'var(--text-main)',
              flex: '1',
              justifyContent: 'center',
              minWidth: '150px'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}



















