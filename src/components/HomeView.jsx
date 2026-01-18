import { useState, useEffect, useMemo } from 'react';

export function HomeView({ students = [], studentStats = {}, onNavigate }) {
  // --- Data Processing -----------------------------------------
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [alertThreshold, setAlertThreshold] = useState(50); // Term filter for alerts
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [memoText, setMemoText] = useState('');

  const handleSaveMemo = () => {
    if (!selectedEvent) return;

    try {
      const savedSchedule = localStorage.getItem('scheduleData');
      if (savedSchedule) {
        let schedule = JSON.parse(savedSchedule);
        // Deep update: iterate all terms to find and update the event
        // Note: Event IDs must be unique. If not, this might update multiple or wrong ones.
        // Assumption: HomeView.jsx loads 'scheduleData' same as ScheduleView.

        let updated = false;
        schedule = schedule.map(term => ({
          ...term,
          events: term.events.map(ev => {
            if (ev.id === selectedEvent.id) {
              updated = true;
              return { ...ev, memo: memoText };
            }
            return ev;
          })
        }));

        if (updated) {
          localStorage.setItem('scheduleData', JSON.stringify(schedule));

          // Update local state 'upcomingEvents' to reflect change immediately
          setUpcomingEvents(prev => prev.map(ev =>
            ev.id === selectedEvent.id ? { ...ev, memo: memoText } : ev
          ));

          alert('メモを保存しました');
          setSelectedEvent(null);
        } else {
          alert('イベントが見つかりませんでした');
        }
      }
    } catch (e) {
      console.error('Save failed', e);
      alert('保存に失敗しました');
    }
  };


  // Real data calculations
  const dashboardData = useMemo(() => {
    // 1. Basic Counts
    const activeCount = students.length;
    const term1Count = students.filter(s => Number(s.term || 1) === 1).length;

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
    const uniqueTerms = [...new Set(students.map(s => Number(s.term || 1)))].sort((a, b) => a - b);

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
        const allEvents = schedule.flatMap(t => t.events || [])
          .map(e => ({ ...e, dateObj: new Date(e.start || e.date) }))
          .sort((a, b) => a.dateObj - b.dateObj);

        // Filter future only
        const todayZero = new Date();
        todayZero.setHours(0, 0, 0, 0);

        const futureEvents = allEvents.filter(e => {
          const d = new Date(e.dateObj);
          d.setHours(0, 0, 0, 0);
          return d >= todayZero;
        });

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthEvents = futureEvents.filter(e =>
          e.dateObj.getMonth() === currentMonth &&
          e.dateObj.getFullYear() === currentYear
        );

        // Logic: specific request "When 2 or less remain, add from next month one by one"
        // Target total seems to be ~3 for UI balance (implied)
        let finalEvents = [...thisMonthEvents];

        if (thisMonthEvents.length < 6) {
          const nextEvents = futureEvents.filter(e =>
            (e.dateObj.getFullYear() > currentYear) ||
            (e.dateObj.getFullYear() === currentYear && e.dateObj.getMonth() > currentMonth)
          );
          // Fill until we have 3 total
          const fillCount = 6 - thisMonthEvents.length;
          if (fillCount > 0) {
            const fillers = nextEvents.slice(0, fillCount).map(e => ({ ...e, isNextMonth: true }));
            finalEvents = [...finalEvents, ...fillers];
          }
        }

        setUpcomingEvents(finalEvents);
      }
    } catch (e) {
      console.error('Failed to load schedule', e);
    }
  }, []);

  const filteredAlerts = selectedTerm === 'all'
    ? dashboardData.alerts
    : dashboardData.alerts.filter(a => Number(a.term || 1) === parseInt(selectedTerm));

  return (
    <div className="h-full w-full animate-fade-in" style={{ paddingRight: '0.5rem', overflowY: 'auto' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* MAIN: Split View */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem', minHeight: '300px' }}>

          {/* LEFT: Priority Alerts Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-input, #F9FAFB)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>勝率</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    style={{ width: '40px', padding: '0.1rem', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center' }}
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
                      background: 'var(--bg-card, #FFFFFF)'
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
                <div style={{ padding: '2rem', textAlign: 'center', color: '#10B981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎉</span>
                  <span>アラートはありません。全員順調です！</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Compact Schedule */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-input, #F9FAFB)', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>📅 今月の予定</h2>
            </div>
            <div style={{ flex: 1, padding: '0.5rem' }}>
              {upcomingEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {upcomingEvents.map((evt, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedEvent(evt);
                        setMemoText(evt.memo || '');
                      }}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: evt.memo ? 'var(--bg-highlight, #EFF6FF)' : 'var(--bg-card, white)', // Highlight if memo exists
                        opacity: evt.isNextMonth ? 0.5 : 1, // Dim next month items
                        transition: 'all 0.2s'
                      }}
                      className="hover:shadow-md"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                          {new Date(evt.start || evt.date).toLocaleDateString()}
                        </div>
                        {evt.memo && <span style={{ fontSize: '0.8rem' }}>📝</span>}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{evt.title}</div>
                      {(evt.description || evt.type) && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{evt.description || evt.type}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>予定なし</div>)}
            </div>

            {/* Memo Editor Modal */}
            {selectedEvent && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }} onClick={() => setSelectedEvent(null)}>
                <div
                  style={{
                    background: 'var(--bg-card, white)', borderRadius: '8px', padding: '1.5rem',
                    width: '90%', maxWidth: '500px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{selectedEvent.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {new Date(selectedEvent.start || selectedEvent.date).toLocaleDateString()} {selectedEvent.description || ""}
                  </p>

                  <textarea
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder="メモを入力してください..."
                    style={{
                      width: '100%', minHeight: '150px', padding: '0.75rem',
                      border: '1px solid var(--border-color)', borderRadius: '6px',
                      marginBottom: '1rem', fontSize: '0.95rem', resize: 'vertical'
                    }}
                    autoFocus
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card, white)' }}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSaveMemo}
                      className="btn-primary"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Simple Actions */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
              <button
                onClick={() => onNavigate && onNavigate('schedule')}
                className="btn"
                style={{ background: 'var(--bg-card, white)', border: '1px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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




















