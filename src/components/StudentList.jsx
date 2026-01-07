import { useState, useMemo } from 'react'

export function StudentList({ students, studentStats = {}, onSelectStudent, selectedId, style }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState(1); // Default to Term 1

  // Get available terms from students
  const availableTerms = useMemo(() => {
    const terms = [...new Set(students.map(s => s.term || 1))].sort((a, b) => a - b);
    return terms;
  }, [students]);

  // Process and sort/filter students
  const processedStudents = useMemo(() => {
    let result = students.map(s => ({
      ...s,
      stats: studentStats[s.id] || null
    }));

    // Filter by term first
    result = result.filter(s => (s.term || 1) === selectedTerm);

    // Filter by search term
    if (searchTerm) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterBy === 'notSubmitted') {
      result = result.filter(s => {
        if (!s.stats) return true;
        return s.stats.prediction === null;
      });
    } else if (filterBy === 'lowPerformance') {
      result = result.filter(s => {
        if (!s.stats) return false;
        return s.stats.winRate < 60;
      });
    }

    // Sort
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    } else if (sortBy === 'winRate') {
      result.sort((a, b) => {
        const aRate = a.stats?.winRate || 0;
        const bRate = b.stats?.winRate || 0;
        return bRate - aRate;
      });
    } else if (sortBy === 'accuracy') {
      result.sort((a, b) => {
        const aAcc = a.stats?.accuracy || 0;
        const bAcc = b.stats?.accuracy || 0;
        return bAcc - aAcc;
      });
    } else if (sortBy === 'rank') {
      result.sort((a, b) => {
        const aRank = typeof a.stats?.rank === 'number' ? a.stats.rank : 999;
        const bRank = typeof b.stats?.rank === 'number' ? b.stats.rank : 999;
        return aRank - bRank;
      });
    }

    return result;
  }, [students, studentStats, searchTerm, sortBy, filterBy, selectedTerm]);

  const hasSyncedData = Object.keys(studentStats).length > 0;

  // Count students per term
  const termCounts = useMemo(() => {
    const counts = {};
    students.forEach(s => {
      const term = s.term || 1;
      counts[term] = (counts[term] || 0) + 1;
    });
    return counts;
  }, [students]);

  return (
    <div className="glass-panel" style={{ width: '320px', height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column', ...style }}>
      <h3 style={{ marginBottom: '0.75rem', fontWeight: 'bold', fontSize: '1rem' }}>
        生徒リスト
      </h3>

      {/* Term Selector Dropdown */}
      <div style={{ marginBottom: '0.75rem' }}>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '0.4rem',
            borderRadius: '4px',
            border: '1px solid #444',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          {availableTerms.map(term => (
            <option key={term} value={term} style={{ background: '#1a1a2e', color: 'white' }}>
              {term}期生 ({termCounts[term] || 0}名)
            </option>
          ))}
        </select>
      </div>
      
      {/* Search */}
      <input 
        type="text" 
        placeholder="名前で検索..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '0.75rem',
          borderRadius: '4px',
          border: '1px solid #444',
          background: 'rgba(0,0,0,0.2)',
          color: 'white',
          fontSize: '0.85rem'
        }}
      />

      {/* Sort & Filter Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            flex: 1,
            padding: '0.4rem',
            borderRadius: '4px',
            border: '1px solid #444',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            fontSize: '0.8rem'
          }}
        >
          <option value="name">名前順</option>
          <option value="winRate" disabled={!hasSyncedData}>勝率順</option>
          <option value="accuracy" disabled={!hasSyncedData}>的中率順</option>
          <option value="rank" disabled={!hasSyncedData}>順位順</option>
        </select>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
        <FilterButton label="全員" active={filterBy === 'all'} onClick={() => setFilterBy('all')} />
        <FilterButton label="未提出" active={filterBy === 'notSubmitted'} onClick={() => setFilterBy('notSubmitted')} disabled={!hasSyncedData} />
        <FilterButton label="要注意" active={filterBy === 'lowPerformance'} onClick={() => setFilterBy('lowPerformance')} disabled={!hasSyncedData} color="#f87171" />
      </div>

      {/* Student List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {processedStudents.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            該当する生徒がいません
          </div>
        )}
        {processedStudents.map(student => {
          const stats = student.stats;
          const isLowPerformance = stats && stats.winRate < 60;
          const hasNotSubmitted = stats && stats.prediction === null;
          
          return (
            <div 
              key={student.id}
              onClick={() => onSelectStudent(student)}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedId === student.id ? 'var(--primary)' : 'transparent',
                border: selectedId === student.id 
                  ? '1px solid var(--primary-l)' 
                  : isLowPerformance 
                    ? '1px solid rgba(248, 113, 113, 0.5)' 
                    : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{student.name}</div>
                
                {stats && !stats.error && (
                  <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem' }}>
                    <span style={{
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: stats.winRate >= 60 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                      color: stats.winRate >= 60 ? '#4ade80' : '#f87171'
                    }}>
                      {stats.winRate?.toFixed(0)}%
                    </span>
                    
                    {typeof stats.rank === 'number' && (
                      <span style={{
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: stats.rank <= 3 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: stats.rank <= 3 ? '#fbbf24' : 'white'
                      }}>
                        {stats.rank}位
                      </span>
                    )}
                  </div>
                )}
                
                {hasNotSubmitted && (
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>未提出</span>
                )}
              </div>
              
              <div style={{ fontSize: '0.75rem', opacity: 0.7, display:'flex', justifyContent:'space-between', marginTop: '0.2rem' }}>
                <span>{student.status}</span>
                {stats && stats.prediction !== undefined && stats.prediction !== null && (
                  <span>
                    今日: {stats.prediction === true ? '🔴' : stats.prediction === false ? '🔵' : stats.prediction === 'skip' ? '⏸️' : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasSyncedData && (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '0.75rem', 
          padding: '0.5rem',
          borderTop: '1px solid var(--glass-border)',
          marginTop: '0.5rem'
        }}>
          ↑「全員同期」でデータ取得
        </div>
      )}
    </div>
  )
}

function FilterButton({ label, active, onClick, disabled, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '0.35rem 0.5rem',
        borderRadius: '4px',
        border: 'none',
        background: active ? (color || 'var(--primary)') : 'rgba(255,255,255,0.05)',
        color: active ? 'white' : 'var(--text-muted)',
        fontSize: '0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
}
