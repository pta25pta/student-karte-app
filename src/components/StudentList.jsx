import { useState, useMemo } from 'react'

export function StudentList({ students, studentStats = {}, onSelectStudent, selectedId, style }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [selectedTerm, setSelectedTerm] = useState(1); // Default to Term 1

    // Get available terms from students
    const availableTerms = useMemo(() => {
        // Cast to Number for unique set and sorting
        const terms = [...new Set(students.map(s => Number(s.term || 1)))].sort((a, b) => a - b);
        return terms;
    }, [students]);

    // Process and sort/filter students
    const processedStudents = useMemo(() => {
        let result = students.map(s => ({
            ...s,
            stats: studentStats[s.id] || null
        }));

        // Filter by term first - use Number cast for comparison
        result = result.filter(s => Number(s.term || 1) === selectedTerm);

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
            const term = Number(s.term || 1);
            counts[term] = (counts[term] || 0) + 1;
        });
        return counts;
    }, [students]);

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
            <h3 style={{ marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                生徒リスト
            </h3>

            {/* Term Selector Dropdown - Clean White */}
            <div style={{ marginBottom: '0.75rem' }}>
                <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card, white)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    {availableTerms.map(term => (
                        <option key={term} value={term}>
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
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card, white)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
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
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card, white)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
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
                <FilterButton label="要注意" active={filterBy === 'lowPerformance'} onClick={() => setFilterBy('lowPerformance')} disabled={!hasSyncedData} color="#EF4444" />
            </div>

            {/* Student List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {processedStudents.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
                        該当する生徒がいません
                    </div>
                )}
                {processedStudents.map(student => {
                    const stats = student.stats;
                    // const isLowPerformance = stats && stats.winRate < 60;
                    const hasNotSubmitted = stats && stats.prediction === null;
                    const isSelected = selectedId === student.id;

                    return (
                        <div
                            key={student.id}
                            onClick={() => onSelectStudent(student)}
                            style={{
                                padding: '0.6rem 0.75rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--bg-highlight, #EFF6FF)' : 'transparent',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                                borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                                transition: 'all 0.1s',
                                color: 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem' // Gap between icon and text
                            }}
                            onMouseEnter={e => {
                                if (!isSelected) e.currentTarget.style.background = 'var(--bg-input, #F9FAFB)';
                            }}
                            onMouseLeave={e => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {/* Icon Avatar */}
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input, #F3F4F6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {student.photoUrl ? (
                                    <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 'bold' }}>
                                        {student.name.charAt(0)}
                                    </span>
                                )}
                            </div>

                            {/* Content Column */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: isSelected ? '600' : '500', fontSize: '0.9rem' }}>
                                        {student.name}
                                        {student.nickname && <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '0.85em', fontWeight: 'normal' }}>{student.nickname}</span>}
                                    </div>

                                    {stats && !stats.error && (
                                        <div style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem' }}>
                                            <span style={{
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: '4px',
                                                background: stats.winRate >= 60 ? 'var(--status-success-bg, #ECFDF5)' : 'var(--status-danger-bg, #FEF2F2)',
                                                color: stats.winRate >= 60 ? '#059669' : '#DC2626',
                                                fontWeight: '500'
                                            }}>
                                                {stats.winRate?.toFixed(0)}%
                                            </span>

                                            {typeof stats.rank === 'number' && (
                                                <span style={{
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '4px',
                                                    background: stats.rank <= 3 ? 'var(--status-warning-bg, #FFFBEB)' : 'var(--bg-input, #F3F4F6)',
                                                    color: stats.rank <= 3 ? '#D97706' : '#6B7280',
                                                    fontWeight: '500'
                                                }}>
                                                    {stats.rank}位
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {hasNotSubmitted && (
                                        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>未提出</span>
                                    )}
                                </div>

                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                    <span>{student.status}</span>
                                    {stats && stats.prediction !== undefined && stats.prediction !== null && (
                                        <span>
                                            今日: {stats.prediction === true ? '🔴' : stats.prediction === false ? '🔵' : stats.prediction === 'skip' ? '⏸️' : ''}
                                        </span>
                                    )}
                                </div>
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
                    padding: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '0.5rem',
                    background: 'var(--bg-input, #F9FAFB)',
                    borderRadius: '6px'
                }}>
                    ↑「全員同期」でデータ取得
                </div>
            )}
        </div>
    )
}

function FilterButton({ label, active, onClick, disabled, color }) {
    const activeBg = color || 'var(--primary)';
    const activeColor = 'white';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1,
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                border: active ? 'none' : '1px solid var(--border-color)',
                background: active ? activeBg : 'var(--bg-card, white)',
                color: active ? activeColor : 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                fontWeight: active ? '500' : 'normal'
            }}
        >
            {label}
        </button>
    );
}
