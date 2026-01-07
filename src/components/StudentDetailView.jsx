import React, { useState, useEffect, useRef } from 'react';
import { ExternalDataService } from '../services/ExternalDataService';

export function StudentDetailView({ student, initialStats }) {
  const [localStudent, setLocalStudent] = useState(student);
  const [predictionStats, setPredictionStats] = useState(initialStats || null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  
  useEffect(() => {
    setLocalStudent(student);
    setPredictionStats(initialStats || null);
  }, [student, initialStats]);

  const handleUpdate = (field, value) => {
    const updated = { ...localStudent, [field]: value };
    setLocalStudent(updated);
    // eslint-disable-next-line
    student[field] = value; 
  };



  const handleAddMemo = (content, tag) => {
    if (!content.trim()) return;
    const newMemo = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('ja-JP'),
        content: content,
        tag: tag || null
    };
    const newHistory = [...(localStudent.memoHistory || []), newMemo];
    handleUpdate('memoHistory', newHistory);
  };

  const handleDeleteMemo = (memoId) => {
    if (!window.confirm('このメモを削除してもよろしいですか？')) return;
    const newHistory = (localStudent.memoHistory || []).filter(m => m.id !== memoId);
    handleUpdate('memoHistory', newHistory);
  };

  const handleFetchPredictionStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await ExternalDataService.fetchPredictionStats(localStudent.id, selectedMonth.year, selectedMonth.month);
      setPredictionStats(stats);
      handleUpdate('dailyPrediction', stats.prediction === true);
    } catch (err) {
      console.error(err);
      alert('データの取得に失敗しました');
    } finally {
      setLoadingStats(false);
    }
  };

  // Re-fetch when month changes
  useEffect(() => {
    if (predictionStats) {
      handleFetchPredictionStats();
    }
  }, [selectedMonth]);

  return (
    <div className="h-full w-full" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>
      
      {/* TOP ROW */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
         {/* Left Column - Profile & Stats */}
         <div style={{ width: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            <ProfileCard student={localStudent} />
            <PredictionStatsCard 
              stats={predictionStats} 
              loading={loadingStats}
              onSync={handleFetchPredictionStats}
            />
         </div>

         {/* Middle Column - Monthly History */}
         <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto' }}>
            <MonthlyHistoryCard 
              stats={predictionStats} 
              loading={loadingStats} 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
         </div>

         {/* Right Column - Other Info */}
         <div style={{ width: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CredentialsCard student={localStudent} />
            <DiscordCard student={localStudent} />
            <StatusSection student={localStudent} onUpdate={handleUpdate} predictionStats={predictionStats} />
         </div>
      </div>

      {/* BOTTOM ROW: Memo */}
      <div className="glass-panel" style={{ height: '200px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-l)', fontWeight:'bold', fontSize: '0.9rem' }}>講師メモ</h3>
        <MemoSection 
           history={localStudent.memoHistory || []} 
           onAdd={handleAddMemo} 
           onDelete={handleDeleteMemo}
        />
      </div>

    </div>
  );
}

// Helper function to get prediction display info
function getPredictionDisplay(prediction) {
  if (prediction === true) {
    return { text: '陽線', icon: '🔴', color: '#4ade80' };
  } else if (prediction === false) {
    return { text: '陰線', icon: '🔵', color: '#60a5fa' };
  } else if (prediction === 'skip') {
    return { text: '見送', icon: '⏸️', color: '#fbbf24' };
  } else {
    return { text: '未提出', icon: '⚪', color: '#9ca3af' };
  }
}

function getResultStyle(result) {
  if (result === '○') return { color: '#4ade80', fontWeight: 'bold' };
  if (result === '×') return { color: '#f87171', fontWeight: 'bold' };
  return { color: '#9ca3af' };
}

// Generate days for a specific month
function generateMonthDays(year, month) {
  const now = new Date();
  const today = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Get number of days in the specified month
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Special case: January 2026 starts from 12th (classes start on 10th)
  const startDay = (year === 2026 && month === 1) ? 12 : 1;
  
  const days = [];
  for (let day = startDay; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // For current month, only show days up to today
    if (year === currentYear && month === currentMonth && day > today) continue;
    
    days.push({
      day: day,
      dateLabel: month + '月' + day + '日',
      pair: null,
      prediction: null,
      result: 'ー'
    });
  }
  return days;
}

// Get available months (from Jan 2026 to current month)
function getAvailableMonths() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const months = [];
  // Start from January 2026
  const startYear = 2026;
  const startMonth = 1;
  
  for (let year = startYear; year <= currentYear; year++) {
    const start = (year === startYear) ? startMonth : 1;
    const end = (year === currentYear) ? currentMonth : 12;
    
    for (let month = start; month <= end; month++) {
      months.push({ year, month, label: year + '年' + month + '月' });
    }
  }
  
  return months;
}

// Monthly History Card
function MonthlyHistoryCard({ stats, loading, selectedMonth, onMonthChange }) {
  const availableMonths = getAvailableMonths();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: 'var(--text-muted)' }}>読み込み中...</div>
      </div>
    );
  }

  // Generate base calendar for selected month
  const baseDays = generateMonthDays(selectedMonth.year, selectedMonth.month);
  
  // Merge with actual history data if available
  const historyData = stats?.history || [];
  const historyMap = {};
  historyData.forEach(item => {
    historyMap[item.day] = item;
  });
  
  const mergedDays = baseDays.map(baseDay => {
    if (historyMap[baseDay.day]) {
      return historyMap[baseDay.day];
    }
    return baseDay;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📅 予測履歴</span>
        </h3>
        
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => {
              const idx = availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month);
              if (idx > 0) {
                const prev = availableMonths[idx - 1];
                onMonthChange({ year: prev.year, month: prev.month });
              }
            }}
            disabled={availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === 0}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === 0 ? 0.3 : 1
            }}
          >
            ◀
          </button>
          
          <select
            value={selectedMonth.year + '-' + selectedMonth.month}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              onMonthChange({ year, month });
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {availableMonths.map(m => (
              <option key={m.year + '-' + m.month} value={m.year + '-' + m.month} style={{ background: '#1a1a2e', color: 'white' }}>
                {m.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              const idx = availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month);
              if (idx < availableMonths.length - 1) {
                const next = availableMonths[idx + 1];
                onMonthChange({ year: next.year, month: next.month });
              }
            }}
            disabled={availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === availableMonths.length - 1}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === availableMonths.length - 1 ? 0.3 : 1
            }}
          >
            ▶
          </button>
          
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {mergedDays.length}営業日
          </span>
        </div>
      </div>

      {!stats ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div>左の「同期」ボタンを押して</div>
            <div>データを取得してください</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'var(--bg-dark)' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 'normal' }}>日付</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'normal' }}>通貨ペア</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'normal' }}>予測</th>
                <th style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'normal' }}>結果</th>
              </tr>
            </thead>
            <tbody>
              {mergedDays.map((item, index) => {
                const predDisplay = getPredictionDisplay(item.prediction);
                const resultStyle = getResultStyle(item.result);
                return (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span style={{ color: 'white' }}>{item.dateLabel}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                      {item.pair ? (
                        <span style={{ 
                          background: 'rgba(255,255,255,0.1)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          {item.pair}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ 
                        color: predDisplay.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {predDisplay.icon} {predDisplay.text}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontSize: '1.1rem', ...resultStyle }}>
                      {item.result || 'ー'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PredictionStatsCard({ stats, loading, onSync }) {
  return (
    <div className="card glass-panel" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>📊 予測成績</h3>
        <button 
          onClick={onSync}
          disabled={loading}
          style={{
            background: 'var(--primary)',
            border: 'none',
            color: 'white',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          {loading ? '読込中...' : '↻ 同期'}
        </button>
      </div>

      {!stats ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
          「同期」を押してデータを取得
        </div>
      ) : stats.error ? (
        <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '1rem 0' }}>
          データ取得エラー
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {(() => {
            const display = getPredictionDisplay(stats.prediction);
            return (
              <div style={{ 
                background: 'rgba(255,255,255,0.05)',
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid ' + display.color + '40'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>今日の予測</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: display.color }}>
                  {display.icon} {display.text}
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <StatBox label="勝率" value={(stats.winRate || 0).toFixed(1) + '%'} highlight={stats.winRate >= 60} />
            <StatBox label="順位" value={stats.rank + ' / ' + stats.totalRank + '位'} highlight={stats.rank <= 3} />
            <StatBox label="正解" value={stats.correctPredictions + ' / ' + stats.totalPredictions} />
            <StatBox 
              label="回答率" 
              value={(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const today = now.getDate();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const startDay = (year === 2026 && month === 0) ? 12 : 1;
                let businessDays = 0;
                for (let d = startDay; d <= Math.min(today, daysInMonth); d++) {
                  const dayOfWeek = new Date(year, month, d).getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
                }
                const submitted = stats.totalPredictions || 0;
                const rate = businessDays > 0 ? (submitted / businessDays * 100) : 0;
                return rate.toFixed(0) + '%';
              })()} 
              highlight={(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const today = now.getDate();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const startDay = (year === 2026 && month === 0) ? 12 : 1;
                let businessDays = 0;
                for (let d = startDay; d <= Math.min(today, daysInMonth); d++) {
                  const dayOfWeek = new Date(year, month, d).getDay();
                  if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
                }
                const submitted = stats.totalPredictions || 0;
                return businessDays > 0 ? (submitted / businessDays * 100) >= 80 : false;
              })()} 
            />
          </div>

        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(var(--primary-h), 100, 50, 0.15)' : 'rgba(255,255,255,0.05)',
      padding: '0.5rem',
      borderRadius: '6px',
      textAlign: 'center',
      border: highlight ? '1px solid var(--primary)' : '1px solid transparent'
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: highlight ? 'var(--primary-l)' : 'white' }}>{value}</div>
    </div>
  );
}

function MemoSection({ history, onAdd, onDelete }) {
    const [text, setText] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);
    const scrollRef = useRef(null);

    const tags = [
        { id: 'action', label: '要対応', className: 'memo-tag-action' },
        { id: 'done', label: '完了', className: 'memo-tag-done' },
        { id: 'info', label: '情報', className: 'memo-tag-info' },
        { id: 'important', label: '重要', className: 'memo-tag-important' }
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleSubmit = () => {
        onAdd(text, selectedTag);
        setText('');
        setSelectedTag(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    };

    const getTagInfo = (tagId) => {
        return tags.find(t => t.id === tagId);
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <div 
                ref={scrollRef}
                style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.75rem',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}
            >
                {history.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>メモなし</div>
                )}
                {history.map(memo => {
                    const tagInfo = memo.tag ? getTagInfo(memo.tag) : null;
                    return (
                        <div key={memo.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{memo.date}</span>
                                    {tagInfo && (
                                        <span className={'memo-tag ' + tagInfo.className}>{tagInfo.label}</span>
                                    )}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{memo.content}</div>
                            </div>
                            <button 
                                onClick={() => onDelete(memo.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ff6b6b', opacity: 0.6, cursor: 'pointer', fontSize: '0.75rem' }}
                            >🗑</button>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '220px' }}>
                {/* Tag selector */}
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                            className={'memo-tag ' + tag.className}
                            style={{
                                cursor: 'pointer',
                                border: selectedTag === tag.id ? '1px solid white' : '1px solid transparent',
                                opacity: selectedTag === tag.id ? 1 : 0.6
                            }}
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メモ... (Ctrl+Enter)"
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem',
                        color: 'inherit',
                        resize: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.85rem'
                    }}
                />
                <button onClick={handleSubmit} className="btn-primary" style={{ padding: '0.4rem' }}>追加</button>
            </div>
        </div>
    );
}

function StatusSection({ student, onUpdate }) {
  return (
    <div className="card glass-panel" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>ステータス</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <StatusRow 
          label="検証進捗" 
          value={student.verificationProgress} 
          active={student.verificationProgress !== '未着手'}
        />
        <StatusRow 
          label="大会参加" 
          value={student.tradeCompetition ? '参加中' : '不参加'} 
          active={student.tradeCompetition}
          onClick={() => onUpdate('tradeCompetition', !student.tradeCompetition)}
        />
        <StatusRow 
          label="トレトレ" 
          value={student.hasToreTore ? '有り' : '無し'} 
          active={student.hasToreTore}
        />
      </div>
    </div>
  );
}

function StatusRow({ label, value, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.4rem 0.6rem',
        background: active ? 'rgba(var(--primary-h), 100, 50, 0.1)' : 'rgba(255,255,255,0.03)',
        borderRadius: '4px',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: active ? 'var(--primary-l)' : 'white' }}>{value}</span>
    </div>
  );
}

function ProfileCard({ student }) {
  return (
    <div className="card glass-panel" style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.75rem', border: '3px solid var(--primary)' }}>
        <img src={student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{student.name}</h2>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{student.status}</div>
      
      <div style={{ textAlign: 'left', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <InfoRow label="生年月日" value={student.dob} />
        <InfoRow label="トレード歴" value={student.tradeHistory} />
        <InfoRow label="スクール歴" value={student.trainingHistory} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function CredentialsCard({ student }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="card glass-panel" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>FXTF ログイン</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display:'block' }}>ID</span>
          <div style={{ fontFamily: 'monospace' }}>{student.fxtfId}</div>
        </div>
        <div 
          onClick={() => setShowPw(!showPw)}
          style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display:'block' }}>PW ({showPw ? '隠す' : '表示'})</span>
          <div style={{ fontFamily: 'monospace' }}>{showPw ? student.fxtfPw : '••••••'}</div>
        </div>
      </div>
    </div>
  );
}

function DiscordCard({ student }) {
  return (
    <div className="card glass-panel" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Discord</h3>
      <div style={{ fontSize: '0.85rem', color: 'var(--primary-l)' }}>@{student.discordName}</div>
    </div>
  );
}

