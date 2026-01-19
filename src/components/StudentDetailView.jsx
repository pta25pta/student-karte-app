import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StudentService } from '../services/StudentService';
import { ExternalDataService } from '../services/ExternalDataService';
import { ScenarioPanel } from './ScenarioPanel';
import { useModal } from './Modal';

export function StudentDetailView({ student, initialStats, onNotify }) {
  const [ModalComponent, showConfirm, showAlert] = useModal();
  const [localStudent, setLocalStudent] = useState(student);
  const [predictionStats, setPredictionStats] = useState(initialStats || null);
  const [scenarioData, setScenarioData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'lessons'
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    setLocalStudent(student);
    setPredictionStats(initialStats || null);
  }, [student, initialStats]);

  // Fetch extra details if missing (Corrected)
  useEffect(() => {
    const shouldFetch = !student.lessonMemos || !student.memoHistory;
    if (shouldFetch && student.id) {
      const fetchDetails = async () => {
        setLoadingDetails(true);
        try {
          const [memos, history] = await Promise.all([
            StudentService.getLessonMemos(student.id),
            StudentService.getMemoHistory(student.id)
          ]);
          setLocalStudent(prev => ({
            ...prev,
            lessonMemos: memos || {},
            memoHistory: history || []
          }));
        } catch (err) {
          console.error('Failed to fetch student details', err);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [student.id]);

  const handleUpdate = async (field, value, silent = false) => {
    const updated = { ...localStudent, [field]: value };
    setLocalStudent(updated);
    // Optimistic update
    student[field] = value;

    // API Call
    try {
      if (field === 'lessonMemos') {
        await StudentService.updateLessonMemos(localStudent.id, value);
      } else if (field === 'memoHistory') {
        await StudentService.updateMemoHistory(localStudent.id, value);
      } else {
        await StudentService.updateStudent(updated);
      }

      if (!silent && onNotify) onNotify('保存しました', 'success');
    } catch (err) {
      console.error('Failed to save update', err);
      if (onNotify) onNotify('保存に失敗しました', 'error');
    }
  };

  const handleFetchPredictionStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await ExternalDataService.fetchPredictionStats(localStudent.id, selectedMonth.year, selectedMonth.month);
      const scenarios = await ExternalDataService.fetchScenarioData(localStudent.id);
      setScenarioData(scenarios);
      setPredictionStats(stats);
      handleUpdate('dailyPrediction', stats.prediction === true);
      if (onNotify) onNotify('データの同期が完了しました', 'success');
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('データの取得に失敗しました', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Re-fetch when month changes
  useEffect(() => {
    if (predictionStats) {
      handleFetchPredictionStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  return (
    <div className="h-full w-full animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>

      {/* PERSISTENT HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <input
          type="file"
          accept="image/*"
          id="photo-upload"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Resize and compress image
            const reader = new FileReader();
            reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 150; // Icon size
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                  }
                } else {
                  if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.8 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                handleUpdate('photoUrl', dataUrl);
              };
              img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
          }}
        />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <label
            htmlFor="photo-upload"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 0 0 1px var(--primary)',
              cursor: 'pointer',
              display: 'block'
            }}
            title="クリックして写真を変更"
          >
            <img src={localStudent.photoUrl} alt={localStudent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </label>
          {(() => {
            const rank = localStudent.rank || 'C';
            const ranks = [
              { id: 'S', color: '#F59E0B' },
              { id: 'A', color: '#3B82F6' },
              { id: 'B', color: '#10B981' },
              { id: 'C', color: '#9CA3AF' },
            ];
            const currentRank = ranks.find(r => r.id === rank) || ranks[3];
            return (
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '22px', height: '22px',
                background: currentRank.color, color: 'white',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 'bold',
                border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {rank}
              </div>
            );
          })()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
              {localStudent.name}
            </h2>
            {/* Nickname Display in Header */}
            {(localStudent.noteName || localStudent.nickname) && (
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                {localStudent.nickname || localStudent.noteName}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', background: 'var(--bg-input, #F3F4F6)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
              {localStudent.status}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span>ID: {localStudent.fxtfId}</span>
              <span>{localStudent.dob}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span>📈 トレード歴: {localStudent.tradeHistory}年</span>
              <span>🎓 トレーニング歴: {localStudent.trainingHistory}年</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleFetchPredictionStats}
          disabled={loadingStats}
          className="btn-primary"
          style={{ opacity: loadingStats ? 0.7 : 1, padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
        >
          {loadingStats ? '同期中...' : '🔄 データ同期'}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <TabButton label="📋 カルテ情報" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        <TabButton label="📖 授業記録" active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} />
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'profile' ? (
          <StudentProfileTab
            student={localStudent}
            predictionStats={predictionStats}
            scenarioData={scenarioData}
            loadingStats={loadingStats}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onUpdate={handleUpdate}
            onNotify={onNotify}
            showConfirm={showConfirm}
          />
        ) : (
          <StudentLessonTab
            student={localStudent}
            onUpdate={handleUpdate}

            onNotify={onNotify}
            showConfirm={showConfirm}
            showAlert={showAlert}
          />
        )}
      </div>
      {ModalComponent}
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        border: 'none',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        fontWeight: active ? 'bold' : 'normal',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '0.95rem'
      }}
    >
      {label}
    </button>
  );
}

// ----------------------------------------------------------------------
// TAB 1: PROFILE
// ----------------------------------------------------------------------
function StudentProfileTab({ student, predictionStats, scenarioData, loadingStats, selectedMonth, onMonthChange, onUpdate, showConfirm }) {
  const handleAddMemo = (content, tag) => {
    if (!content.trim()) return;
    const newMemo = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ja-JP'),
      content: content,
      tag: tag || null
    };
    const newHistory = [...(student.memoHistory || []), newMemo];
    onUpdate('memoHistory', newHistory);
  };

  const handleDeleteMemo = async (memoId) => {
    if (!await showConfirm('このメモを削除してもよろしいですか？', { type: 'confirm', confirmStyle: 'danger', confirmText: '削除', title: '削除の確認' })) return;
    const newHistory = (student.memoHistory || []).filter(m => m.id !== memoId);
    onUpdate('memoHistory', newHistory);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left Column - Profile & Stats (Fixed 280px) */}
        <div style={{ flex: '0 0 280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
          <ProfileCard student={student} onUpdate={onUpdate} />
          <PersonalInfoPanel student={student} />
          <PredictionStatsCard stats={predictionStats} loading={loadingStats} />
        </div>

        {/* Middle Section - Three equal panels */}
        <div style={{ flex: 1, display: 'flex', gap: '1rem', minWidth: 0 }}>
          {/* Scenario Panel - Left */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <ScenarioPanel
              selectedDate={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() }}
              scenarioData={scenarioData}
            />
          </div>

          {/* Prediction History Card - Center */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto', minWidth: 0 }}>
            <MonthlyHistoryCard
              stats={predictionStats}
              loading={loadingStats}
              selectedMonth={selectedMonth}
              onMonthChange={onMonthChange}
            />
          </div>

          {/* Goals Panel - Right */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto', minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎯</span> 目標・課題
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>スクールで学びたいこと</div>
                <div style={{ background: 'var(--bg-input, #F9FAFB)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.6', flex: 1, overflowY: 'auto' }}>
                  {student.goals || '未記入'}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: '600', color: '#EF4444', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🔥 自身の課題</div>
                <div style={{ background: 'var(--bg-input, #F9FAFB)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.6', flex: 1, overflowY: 'auto' }}>
                  {student.issues || '未記入'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Narrow stack of small panels */}
        <div style={{ flex: '0 0 220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <OutputUrlCard student={student} onUpdate={onUpdate} />
          <CredentialsCard student={student} onUpdate={onUpdate} />
          <StatusSection student={student} onUpdate={onUpdate} predictionStats={predictionStats} />
        </div>
      </div>

      {/* BOTTOM ROW: Memo */}
      <div className="card" style={{ height: '220px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>講師メモ (全体)</h3>
        <MemoSection
          history={student.memoHistory || []}
          onAdd={handleAddMemo}
          onDelete={handleDeleteMemo}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TAB 2: LESSONS (New Interface)
// ----------------------------------------------------------------------
function LessonMemoField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '100px',
          resize: 'vertical',
          padding: '0.75rem',
          fontSize: '0.95rem',
          lineHeight: '1.5',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          background: 'var(--bg-card, white)',
          color: 'var(--text-main)',
          fontFamily: 'inherit',
          outline: 'none'
        }}
      />
    </div>
  );
}

function StudentLessonTab({ student, onUpdate, onNotify }) {
  const events = useMemo(() => {
    const saved = localStorage.getItem('scheduleData');
    if (saved) {
      const allTerms = JSON.parse(saved);
      if (Array.isArray(allTerms)) {
        const termId = Number(student.term || 1);
        const termData = allTerms.find(t => Number(t.id) === termId);
        if (termData) {
          return termData.events || [];
        }
      }
    }
    return [];
  }, [student.term]);

  const [selectedEventId, setSelectedEventId] = useState(() => {
    if (events.length > 0) return events[0].id;
    return null;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleMemoChange = (field, val) => {
    if (!selectedEventId) return;
    const currentMemos = student.lessonMemos || {};
    const currentEventMemo = currentMemos[selectedEventId] || { growth: '', challenges: '', instructor: '' };
    const updatedEventMemo = { ...currentEventMemo, [field]: val };
    const newMemos = { ...currentMemos, [selectedEventId]: updatedEventMemo };
    onUpdate('lessonMemos', newMemos);
  };

  const [localMemo, setLocalMemo] = useState({ growth: '', challenges: '', instructor: '' });
  const [hasDraft, setHasDraft] = useState(false);

  // Draft key for localStorage
  const getDraftKey = (eventId) => `draft_lesson_${student.id}_${eventId}`;

  // Load saved data OR draft on event change
  useEffect(() => {
    if (selectedEvent) {
      const draftKey = getDraftKey(selectedEventId);
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        // Load draft if exists
        try {
          const draft = JSON.parse(savedDraft);
          setLocalMemo(draft);
          setHasDraft(true);
        } catch (e) {
          localStorage.removeItem(draftKey);
          setHasDraft(false);
        }
      } else {
        // Load from API data
        const memoData = (student.lessonMemos || {})[selectedEventId];
        if (!memoData) {
          setLocalMemo({ growth: '', challenges: '', instructor: '' });
        } else if (typeof memoData === 'string') {
          setLocalMemo({ growth: memoData, challenges: '', instructor: '' });
        } else {
          setLocalMemo({
            growth: memoData.growth || '',
            challenges: memoData.challenges || '',
            instructor: memoData.instructor || ''
          });
        }
        setHasDraft(false);
      }
    } else {
      setLocalMemo({ growth: '', challenges: '', instructor: '' });
      setHasDraft(false);
    }
  }, [selectedEventId, student.lessonMemos, selectedEvent, student.id]);

  // Save draft to localStorage on change (debounced)
  const draftTimeoutRef = useRef(null);
  // Helper to check if draft has actual content
  const draftHasContent = (draft) => {
    if (!draft) return false;
    return !!(draft.growth || draft.challenges || draft.instructor);
  };

  const handleLocalChange = (field, val) => {
    const newMemo = { ...localMemo, [field]: val };
    setLocalMemo(newMemo);

    // Only mark as draft if there's actual content
    const hasContent = draftHasContent(newMemo);
    setHasDraft(hasContent);

    // Debounced save to localStorage (or remove if empty)
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      const draftKey = getDraftKey(selectedEventId);
      if (hasContent) {
        localStorage.setItem(draftKey, JSON.stringify(newMemo));
      } else {
        localStorage.removeItem(draftKey);
      }
    }, 300);
  };

  const handleSaveMemo = async () => {
    if (!selectedEventId) return;
    const currentMemos = student.lessonMemos || {};
    const newMemos = { ...currentMemos, [selectedEventId]: { ...localMemo } };
    await onUpdate('lessonMemos', newMemos);

    // Clear draft after successful save
    const draftKey = getDraftKey(selectedEventId);
    localStorage.removeItem(draftKey);
    setHasDraft(false);

    if (onNotify) onNotify('授業記録を保存しました', 'success');
  };

  // Parse "第X回" logic
  const getLessonNo = (ev) => {
    const match = ev.description?.match(/(第\d+回)/);
    return match ? match[1] : null;
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
      {/* Left: List */}
      <div className="card" style={{ width: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>授業一覧</div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {events.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>予定なし</div>
          ) : (
            [...events].sort((a, b) => new Date(a.date) - new Date(b.date)).map(ev => {
              const lessonNo = getLessonNo(ev);
              const isSelected = ev.id === selectedEventId;
              const memoData = (student.lessonMemos || {})[ev.id];
              const hasMemo = memoData && (typeof memoData === 'string' ? memoData : (memoData.growth || memoData.challenges || memoData.instructor));
              const eventDraftKey = `draft_lesson_${student.id}_${ev.id}`;
              const eventDraftRaw = localStorage.getItem(eventDraftKey);
              let hasEventDraft = false;
              if (eventDraftRaw) {
                try {
                  const parsed = JSON.parse(eventDraftRaw);
                  hasEventDraft = !!(parsed.growth || parsed.challenges || parsed.instructor);
                } catch (e) { hasEventDraft = false; }
              }

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : 'white',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {ev.date}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {lessonNo && <span style={{ background: isSelected ? 'var(--primary)' : '#4B5563', color: 'white', fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px' }}>{lessonNo}</span>}
                    {ev.title}
                  </div>
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {hasEventDraft && <span style={{ fontSize: '0.55rem', color: '#F59E0B', background: '#FEF3C7', padding: '1px 4px', borderRadius: '3px' }}>✏️下書き</span>}
                    {hasMemo && !hasEventDraft && <span style={{ fontSize: '0.6rem' }}>📝</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Editor */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedEvent ? (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input, #F9FAFB)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                {getLessonNo(selectedEvent) && (
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', background: 'var(--bg-card, white)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    {getLessonNo(selectedEvent)}
                  </span>
                )}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{selectedEvent.title}</h2>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                📅 {selectedEvent.date} {(selectedEvent.description || '').replace(/(第\d+回)/, '')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'white' }}>
              {hasDraft && (
                <span style={{ fontSize: '0.75rem', color: '#F59E0B', background: '#FEF3C7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  ✏️ 下書きあり
                </span>
              )}
              {!hasDraft && <span />}
              <button
                onClick={handleSaveMemo}
                className="btn-primary"
                style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                💾 授業記録を保存
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem', overflowY: 'auto' }}>
              <LessonMemoField
                label="生徒本人の成長"
                value={localMemo.growth}
                onChange={(val) => handleLocalChange('growth', val)}
                placeholder="生徒の成長・良かった点を記入..."
              />
              <LessonMemoField
                label="課題"
                value={localMemo.challenges}
                onChange={(val) => handleLocalChange('challenges', val)}
                placeholder="今後の課題・改善点を記入..."
              />
              <LessonMemoField
                label="講師メモ"
                value={localMemo.instructor}
                onChange={(val) => handleLocalChange('instructor', val)}
                placeholder="講師としてのメモ・覚え書きを記入..."
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            左のリストから授業を選択してください
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS (Unchanged mostly)
// ----------------------------------------------------------------------
// Helper function to get prediction display info
function getPredictionDisplay(prediction) {
  if (prediction === true) {
    return { text: '陽線', icon: '🔴', color: '#10B981' };
  } else if (prediction === false) {
    return { text: '陰線', icon: '🔵', color: '#3B82F6' };
  } else if (prediction === 'skip') {
    return { text: '見送', icon: '⏸️', color: '#F59E0B' };
  } else {
    return { text: '未提出', icon: '⚪', color: '#9CA3AF' };
  }
}

function getResultStyle(result) {
  if (result === '○') return { color: '#10B981', fontWeight: 'bold' };
  if (result === '×') return { color: '#EF4444', fontWeight: 'bold' };
  return { color: '#9CA3AF' };
}

// Generate days for a specific month
function generateMonthDays(year, month) {
  const now = new Date();
  const today = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDay = (year === 2026 && month === 1) ? 12 : 1;

  const days = [];
  for (let day = startDay; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
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

function getAvailableMonths() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const months = [];
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

function MonthlyHistoryCard({ stats, loading, selectedMonth, onMonthChange }) {
  const availableMonths = getAvailableMonths();

  // Skeleton Loader for History
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
          <div className="skeleton" style={{ width: '100px', height: '24px' }}></div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ width: '100%', height: '40px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  const baseDays = generateMonthDays(selectedMonth.year, selectedMonth.month);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
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
              background: 'var(--bg-card, white)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === 0 ? 0.3 : 1
            }}
          >
            ?
          </button>

          <select
            value={selectedMonth.year + '-' + selectedMonth.month}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              onMonthChange({ year, month });
            }}
            style={{
              background: 'var(--bg-card, white)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {availableMonths.map(m => (
              <option key={m.year + '-' + m.month} value={m.year + '-' + m.month}>
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
              background: 'var(--bg-card, white)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: availableMonths.findIndex(m => m.year === selectedMonth.year && m.month === selectedMonth.month) === availableMonths.length - 1 ? 0.3 : 1
            }}
          >
            ?
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
              <tr style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card, white)' }}>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>日付</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>通貨ペア</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>予測</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>結果</th>
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
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>{item.dateLabel}</span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                      {item.pair ? (
                        <span style={{
                          background: 'var(--bg-input, #F3F4F6)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          color: 'var(--text-main)'
                        }}>
                          {item.pair}
                        </span>
                      ) : (
                        <span style={{ color: '#D1D5DB' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center' }}>
                      <span style={{
                        color: predDisplay.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: '500'
                      }}>
                        {predDisplay.icon} {predDisplay.text}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem', textAlign: 'center', fontSize: '1.1rem', ...resultStyle }}>
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

function PredictionStatsCard({ stats, loading }) {
  // Removed onSync prop since it's now in the header
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>📊 予測成績</h3>
      </div>

      {loading ? (
        // Skeleton logic for Prediction Card
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '6px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '6px' }}></div>
            ))}
          </div>
        </div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0', fontSize: '0.9rem' }}>
          同期してデータを取得
        </div>
      ) : stats.error ? (
        <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '1rem 0' }}>
          データ取得エラー
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {(() => {
            const display = getPredictionDisplay(stats.prediction);
            return (
              <div style={{
                background: 'var(--bg-input, #F9FAFB)',
                padding: '0.75rem',
                borderRadius: '6px',
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>今日の予測</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: display.color, marginTop: '0.2rem' }}>
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
      background: highlight ? '#ECFDF5' : 'white',
      padding: '0.5rem',
      borderRadius: '6px',
      textAlign: 'center',
      border: highlight ? '1px solid #A7F3D0' : '1px solid var(--border-color)'
    }}>
      <div style={{ fontSize: '0.7rem', color: highlight ? '#065F46' : 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: highlight ? '#059669' : 'var(--text-main)' }}>{value}</div>
    </div>
  );
}

function MemoSection({ history, onAdd, onDelete }) {
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const scrollRef = useRef(null);

  const tags = (() => {
    const defaultTags = [
      { id: 'action', label: '要対応', color: '#EF4444' },
      { id: 'done', label: '完了', color: '#10B981' },
      { id: 'info', label: '情報', color: '#3B82F6' },
      { id: 'important', label: '重要', color: '#F59E0B' }
    ];
    try {
      const saved = localStorage.getItem('customTags');
      return saved ? JSON.parse(saved) : defaultTags;
    } catch { return defaultTags; }
  })();

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
    <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-input, #F9FAFB)',
          borderRadius: '6px',
          padding: '0.75rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {history.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.85rem', marginTop: '1rem' }}>メモなし</div>
        )}
        {history.map(memo => {
          const tagInfo = memo.tag ? getTagInfo(memo.tag) : null;
          return (
            <div key={memo.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{memo.date}</span>
                  {tagInfo && (
                    <span className='memo-tag' style={{ background: tagInfo.color + '20', color: tagInfo.color, border: '1px solid ' + tagInfo.color + '40' }}>{tagInfo.label}</span>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>{memo.content}</div>
              </div>
              <button
                onClick={() => onDelete(memo.id)}
                style={{ background: 'transparent', border: 'none', color: '#EF4444', opacity: 0.6, cursor: 'pointer', fontSize: '0.75rem' }}
              >🗑️</button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '220px' }}>
        {/* Tag selector */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
              className='memo-tag'
              style={{
                background: tag.color + '20',
                color: tag.color,
                cursor: 'pointer',
                border: selectedTag === tag.id ? ('1px solid ' + tag.color) : ('1px solid ' + tag.color + '40'),
                opacity: selectedTag === tag.id ? 1 : 0.6,
                transition: 'all 0.1s'
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
          placeholder="講師メモを入力... (Ctrl+Enter)"
          style={{
            flex: 1,
            background: 'var(--bg-card, white)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.5rem',
            color: 'var(--text-main)',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '0.85rem'
          }}
        />
        <button onClick={handleSubmit} className="btn-primary" style={{ padding: '0.4rem' }}>追加</button>
      </div>
    </div >
  );
}

function StatusSection({ student, onUpdate }) {
  // predictionStats can be used here if needed, but for now just showing static/local data
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>ステータス</h3>
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
        background: active ? 'var(--bg-highlight, #EFF6FF)' : 'var(--bg-card, white)',
        borderRadius: '4px',
        cursor: onClick ? 'pointer' : 'default',
        border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)'
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: active ? 'var(--primary)' : 'var(--text-main)' }}>{value}</span>
    </div>
  );
}

function ProfileCard({ student, onUpdate }) {
  const [isEditingRank, setIsEditingRank] = useState(false);
  const rank = student.rank || 'C';

  const ranks = [
    { id: 'S', color: '#F59E0B', label: 'S' },
    { id: 'A', color: '#3B82F6', label: 'A' },
    { id: 'B', color: '#10B981', label: 'B' },
    { id: 'C', color: '#9CA3AF', label: 'C' },
  ];

  const currentRank = ranks.find(r => r.id === rank) || ranks[3];

  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 0.75rem' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 0 0 2px var(--primary)' }}>
          <img src={student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div
          onClick={() => setIsEditingRank(!isEditingRank)}
          style={{
            position: 'absolute', bottom: '-4px', right: '-4px',
            width: '28px', height: '28px',
            background: currentRank.color, color: 'white',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 'bold',
            border: '2px solid white', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title="ランクを変更"
        >
          {currentRank.label}
        </div>
        {isEditingRank && (
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-card, white)', border: '1px solid var(--border-color)', borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 10,
            display: 'flex', gap: '0.25rem', marginTop: '0.5rem'
          }}>
            {ranks.map(r => (
              <button key={r.id} onClick={() => { if (onUpdate) onUpdate('rank', r.id); setIsEditingRank(false); }}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: r.color, color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >{r.label}</button>
            ))}
          </div>
        )}
      </div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{student.name}</h2>
      {student.nickname && (
        <div style={{
          color: '#6B7280',
          fontSize: '0.85rem',
          marginBottom: '0.25rem',
          fontWeight: '500'
        }}>
          {student.nickname}
        </div>
      )}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{student.status}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
      <span style={{ color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text-main)', textAlign: 'left' }}>{value}</span>
    </div>
  );
}

function PersonalInfoPanel({ student }) {
  const formatAddress = (addr) => {
    if (!addr) return '-';
    // Match standard pattern like "〒123-4567 "
    const regex = /(\d{3}-\d{4})(?:\s|　)+/;
    const match = addr.match(regex);
    if (match) {
      return (
        <span>
          {addr.slice(0, match.index + match[1].length).replace('〒', '〒 ')}
          <br />
          {addr.slice(match.index + match[0].length)}
        </span>
      );
    }
    // Fallback if formatting differs significantly
    return addr;
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>個人情報</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
        <InfoRow label="生年月日" value={student.dob} />
        <InfoRow label="年齢" value={calculateAge(student.dob)} />
        <InfoRow label="Eメール" value={student.email} />
        <InfoRow label="住所" value={formatAddress(student.address)} />
        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
        <InfoRow label="トレード歴" value={student.tradeHistory + '年'} />
        <InfoRow label="トレーニング歴" value={student.trainingHistory + '年'} />
      </div>
    </div>
  );
}

function calculateAge(dob) {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970) + '歳';
}

function GoalsPanel({ student }) {
  return (
    <div className="card" style={{ padding: '1rem', flex: 1, overflowY: 'auto', minHeight: '250px' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-main)', position: 'sticky', top: 0, background: 'var(--bg-card, white)' }}>目標・課題</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>🎓 スクールで学びたいこと</div>
          <div style={{ background: 'var(--bg-input, #F9FAFB)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', maxHeight: '100px', overflowY: 'auto', lineHeight: '1.5' }}>
            {student.goals || '未記入'}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: '#EF4444', marginBottom: '0.4rem', fontSize: '0.95rem' }}>🔥 自身の課題</div>
          <div style={{ background: 'var(--bg-input, #F9FAFB)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', maxHeight: '100px', overflowY: 'auto', lineHeight: '1.5' }}>
            {student.issues || '未記入'}
          </div>
        </div>
      </div>
    </div>
  );
}
function CredentialsCard({ student, onUpdate }) {
  // Convert old single ID/PW to array if needed
  const accounts = Array.isArray(student.fxtfAccounts) ? student.fxtfAccounts : (
    student.fxtfId ? [{ id: Date.now(), name: 'メイン', loginId: student.fxtfId, password: student.fxtfPw }] : []
  );

  const [isEditing, setIsEditing] = useState(false);
  const [localAccounts, setLocalAccounts] = useState(accounts);

  const handleAdd = () => {
    setLocalAccounts([...localAccounts, { id: Date.now(), name: '', loginId: '', password: '' }]);
  };

  const handleChange = (id, field, value) => {
    setLocalAccounts(localAccounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  };

  const handleDelete = (id) => {
    setLocalAccounts(localAccounts.filter(acc => acc.id !== id));
  };

  const handleSave = () => {
    onUpdate('fxtfAccounts', localAccounts);
    // Also update legacy fields for backward compatibility if needed, using the first account
    if (localAccounts.length > 0) {
      onUpdate('fxtfId', localAccounts[0].loginId);
      onUpdate('fxtfPw', localAccounts[0].password);
    }
    setIsEditing(false);
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>FXTF ログイン</h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: 'transparent' }}>✏️</button>
        ) : (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={handleSave} style={{ fontSize: '0.8rem', cursor: 'pointer', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px' }}>✔️</button>
            <button onClick={() => setIsEditing(false)} style={{ fontSize: '0.8rem', cursor: 'pointer', background: 'var(--bg-input, #F3F4F6)', color: 'black', border: 'none', borderRadius: '4px', padding: '2px 6px' }}>❌</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
        {localAccounts.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>アカウントなし</div>}

        {localAccounts.map((acc, index) => (
          <div key={acc.id} style={{ background: 'var(--bg-input, #F9FAFB)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    placeholder="アカウント名"
                    value={acc.name || ''}
                    onChange={(e) => handleChange(acc.id, 'name', e.target.value)}
                    style={{ padding: '0.2rem', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', width: '100px' }}
                  />
                  <button onClick={() => handleDelete(acc.id)} style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}>🗑️</button>
                </div>
                <input
                  placeholder="ログインID"
                  value={acc.loginId}
                  onChange={(e) => handleChange(acc.id, 'loginId', e.target.value)}
                  style={{ padding: '0.3rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                />
                <input
                  placeholder="パスワード"
                  value={acc.password}
                  onChange={(e) => handleChange(acc.id, 'password', e.target.value)}
                  style={{ padding: '0.3rem', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                />
              </div>
            ) : (
              <AccountDisplay acc={acc} index={index + 1} />
            )}
          </div>
        ))}

        {isEditing && (
          <button onClick={handleAdd} style={{ width: '100%', padding: '0.4rem', border: '1px dashed var(--border-color)', background: 'var(--bg-card, white)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px' }}>
            + アカウント追加
          </button>
        )}
      </div>
    </div>
  );
}

function AccountDisplay({ acc, index }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.3rem' }}>{acc.name || 'アカウント ' + index}</div>
      <div style={{ fontFamily: 'monospace', color: 'var(--text-main)', marginBottom: '0.2rem', fontSize: '0.8rem' }}>ID: {acc.loginId}</div>
      <div
        onClick={() => setShow(!show)}
        style={{ fontFamily: 'monospace', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}
      >
        <span>PW: {show ? acc.password : '••••••'}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>{show ? '隠す' : '表示'}</span>
      </div>
    </div>
  );
}

function currentIndex(i) { return i + 1; }



function OutputUrlCard({ student, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(student.outputUrl || '');
  const [nickname, setNickname] = useState(student.nickname || '');

  const handleSave = () => {
    onUpdate('outputUrl', url);
    onUpdate('nickname', nickname);
    setIsEditing(false);
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Note / ブログ / ニックネーム</h3>
        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setUrl(student.outputUrl || '');
              setNickname(student.nickname || '');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              padding: '0.2rem'
            }}
            title="編集"
          >
            ✏️
          </button>
        )}
      </div>

      {
        isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力"
              style={{
                width: '100%',
                padding: '0.3rem',
                fontSize: '0.85rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URLを入力"
              style={{
                width: '100%',
                padding: '0.3rem',
                fontSize: '0.85rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setUrl(student.outputUrl || '');
                  setNickname(student.nickname || '');
                }}
                title="キャンセル"
                style={{
                  background: 'var(--bg-input, #F3F4F6)',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.3rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                title="保存"
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.3rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {student.nickname && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>
                {student.nickname}
              </div>
            )}
            {student.outputUrl ? (
              <a
                href={student.outputUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.85rem',
                  color: '#3B82F6',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                🔗 <span style={{ textDecoration: 'underline' }}>リンクを開く</span>
              </a>
            ) : (
              !student.nickname && (
                <div
                  onClick={() => setIsEditing(true)}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    border: '1px dashed var(--border-color)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}
                >
                  + 追加
                </div>
              )
            )}
          </div>
        )
      }
    </div >
  );
}
















