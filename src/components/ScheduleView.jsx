import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

export function ScheduleView() {
  const initialEventsTerm1 = [
    { id: '1', date: '2025-12-21', title: '事前準備会', description: '20:00~22:00', memo: '' },
    { id: '2', date: '2026-01-10', title: '全体講義', description: '第1回 10:00~12:00', memo: '' },
    { id: '3', date: '2026-01-17', title: '実践ワーク', description: '第2回 10:00~12:00', memo: '' },
    { id: '4', date: '2026-01-20', title: '朝会', description: '第3回 07:30~(20-30分)', memo: '' },
    { id: '5', date: '2026-01-21', title: '朝会', description: '第3回 07:30~(20-30分)', memo: '' },
    { id: '6', date: '2026-01-22', title: '朝会', description: '第3回 07:30~(20-30分)', memo: '' },
    { id: '7', date: '2026-01-31', title: 'お茶会', description: '第4回 20:00~22:00', memo: '' },
    { id: '8', date: '2026-02-03', title: '朝会', description: '第5回 07:30~(20-30分)', memo: '' },
    { id: '9', date: '2026-02-04', title: '朝会', description: '第5回 07:30~(20-30分)', memo: '' },
    { id: '10', date: '2026-02-05', title: '朝会', description: '第5回 07:30~(20-30分)', memo: '' },
    { id: '11', date: '2026-02-07', title: '全体講義', description: '第6回 14:00~16:00', memo: '' },
    { id: '12', date: '2026-02-14', title: '実践ワーク', description: '第7回 14:00~16:00', memo: '' },
    { id: '13', date: '2026-02-23', title: 'トレード解析', description: '第8回 20:30~22:30', memo: '' },
    { id: '14', date: '2026-02-28', title: 'お茶会', description: '第9回 14:00~16:00', memo: '' },
    { id: '15', date: '2026-03-07', title: '全体講義', description: '第10回 14:00~16:00', memo: '' },
    { id: '16', date: '2026-03-14', title: '実践ワーク', description: '第11回 14:00~16:00', memo: '' },
    { id: '17', date: '2026-03-23', title: 'トレード解析', description: '第12回 20:30~22:30', memo: '' },
    { id: '18', date: '2026-03-28', title: 'お茶会', description: '第13回 14:00~16:00', memo: '' },
    { id: '19', date: '2026-04-04', title: '全体講義', description: '第14回 14:00~16:00', memo: '' },
    { id: '20', date: '2026-04-11', title: '実践ワーク', description: '第15回 14:00~16:00', memo: '' },
    { id: '21', date: '2026-04-20', title: 'トレード解析', description: '第16回 20:30~22:30', memo: '' },
    { id: '22', date: '2026-04-25', title: 'お茶会', description: '第17回 14:00~16:00', memo: '' },
    { id: '23', date: '2026-05-02', title: '全体講義', description: '第18回 14:00~16:00', memo: '' },
    { id: '24', date: '2026-05-09', title: '実践ワーク', description: '第19回 14:00~16:00', memo: '' },
    { id: '25', date: '2026-05-18', title: 'トレード解析', description: '第20回 20:30~22:30', memo: '' },
    { id: '26', date: '2026-05-30', title: 'お茶会', description: '第21回 14:00~16:00', memo: '' },
    { id: '27', date: '2026-06-06', title: '全体講義', description: '第22回 14:00~16:00', memo: '' },
    { id: '28', date: '2026-06-13', title: '実践ワーク', description: '第23回 14:00~16:00', memo: '' },
    { id: '29', date: '2026-06-22', title: 'トレード解析', description: '第24回 20:30~22:30', memo: '' },
    { id: '30', date: '2026-06-27', title: 'お茶会', description: '第25回 14:00~16:00', memo: '' },
    { id: '31', date: '2026-07-04', title: '全体講義', description: '第26回 14:00~16:00', memo: '' },
    { id: '32', date: '2026-07-11', title: '実践ワーク', description: '第27回 14:00~16:00', memo: '' },
    { id: '33', date: '2026-07-20', title: 'トレード解析', description: '第28回 20:30~22:30', memo: '' },
    { id: '34', date: '2026-07-25', title: 'お茶会', description: '第29回 14:00~16:00', memo: '' },
    { id: '35', date: '2026-08-01', title: '全体講義', description: '第30回 14:00~16:00', memo: '' },
    { id: '36', date: '2026-08-08', title: '実践ワーク', description: '第31回 14:00~16:00', memo: '' },
    { id: '37', date: '2026-08-17', title: 'トレード解析', description: '第32回 20:30~22:30', memo: '' },
    { id: '38', date: '2026-08-29', title: 'お茶会', description: '第33回 14:00~16:00', memo: '' }
  ];

  const [terms, setTerms] = useState(() => {
    const saved = localStorage.getItem('scheduleData');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: '第1期生', events: initialEventsTerm1 },
      { id: 2, name: '第2期生', events: [] }
    ];
  });
  const [selectedTermId, setSelectedTermId] = useState(1);
  
  useEffect(() => {
    localStorage.setItem('scheduleData', JSON.stringify(terms));
  }, [terms]);

  const [newDate, setNewDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingMemoId, setEditingMemoId] = useState(null);
  const [memoText, setMemoText] = useState('');

  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');

  const today = new Date();
  today.setHours(0,0,0,0);

  const getEventStyle = (dateStr) => {
      const eventDate = new Date(dateStr);
      if (eventDate < today) {
          return {
              opacity: 0.5,
              filter: 'grayscale(100%)'
          };
      }
      return {};
  };

  const currentTerm = terms.find(t => t.id === selectedTermId);
  const currentEvents = currentTerm ? currentTerm.events : [];

  const updateTermEvents = (termId, newEvents) => {
      setTerms(terms.map(t => t.id === termId ? { ...t, events: newEvents } : t));
  };

  const handleAddTerm = () => {
      const nextId = Math.max(...terms.map(t => t.id)) + 1;
      const newTerm = {
          id: nextId,
          name: '第' + nextId + '期生',
          events: []
      };
      setTerms([...terms, newTerm]);
      setSelectedTermId(nextId);
  };

  const handleDeleteTerm = (termId) => {
      const termToDelete = terms.find(t => t.id === termId);
      if (!termToDelete) return;

      if (termToDelete.events.length > 0) {
          if (!window.confirm('この期にはイベントが登録されています。本当に削除しますか？')) {
              return;
          }
      }

      if (terms.length <= 1) {
          alert('最後の1つは削除できません');
          return;
      }

      const newTerms = terms.filter(t => t.id !== termId);
      setTerms(newTerms);
      if (selectedTermId === termId) {
          setSelectedTermId(newTerms[0].id);
      }
  };

  const handleDelete = (id) => {
    if (window.confirm('このイベントを削除しますか？')) {
      const updatedEvents = currentEvents.filter(e => e.id !== id);
      updateTermEvents(selectedTermId, updatedEvents);
    }
  };

  const handleSaveMemo = (id) => {
      const updatedEvents = currentEvents.map(e => e.id === id ? { ...e, memo: memoText } : e);
      updateTermEvents(selectedTermId, updatedEvents);
      setEditingMemoId(null);
      setMemoText('');
  };

  const openMemoEditor = (ev) => {
      setEditingMemoId(ev.id);
      setMemoText(ev.memo || '');
  };

  const handleManualAdd = () => {
    if (!newDate || !newTitle) {
      alert('日付とタイトルは必須です');
      return;
    }
    const newEvent = {
      id: Date.now().toString(),
      date: newDate,
      title: newTitle,
      description: newDesc,
      memo: ''
    };
    updateTermEvents(selectedTermId, [...currentEvents, newEvent]);
    setNewDate('');
    setNewTitle('');
    setNewDesc('');
    setIsFormOpen(false);
    alert(currentTerm.name + 'にイベントを追加しました');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await Tesseract.recognize(
        file,
        'jpn', 
        { logger: m => console.log(m) }
      );
      setOcrText(result.data.text);
    } catch (err) {
      console.error(err);
      alert('画像読み取りに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleParseAndAdd = () => {
    const lines = ocrText.split(/\r?\n/);
    const newEvents = [];
    const dateRegex = /(\d{4}\/\d{1,2}\/\d{1,2})/; 

    lines.forEach(line => {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
         const dateStr = dateMatch[1].replace(/\//g, '-');
         let remaining = line.replace(dateMatch[0], '').trim();
         remaining = remaining.replace(/\(.\)/, '').trim();
         remaining = remaining.replace(/\d{1,2}:\d{2}.{1,3}\d{1,2}:\d{2}/, '').trim();
         
         if (remaining) {
             newEvents.push({
                 id: Date.now() + Math.random(),
                 date: dateStr,
                 title: remaining,
                 description: 'Image Imported',
                 memo: ''
             });
         }
      }
    });

    if (newEvents.length > 0) {
        updateTermEvents(selectedTermId, [...currentEvents, ...newEvents]);
        setOcrText('');
        alert(newEvents.length + ' 件のイベントを追加しました！');
    } else {
        alert('日付を含むイベントが見つかりませんでした。テキストを手動で調整してください。');
    }
  };

  const parseEventDisplay = (ev) => {
      const fullText = ev.description || '';
      const match = fullText.match(/(第\d+回)/);
      let badge = null;
      let text = fullText;

      if (match) {
          badge = match[1];
          text = fullText.replace(match[0], '').trim();
      }

      return { badge, text };
  };

  return (
    <div className="h-full w-full flex-col gap-md" style={{ overflowY: 'auto' }}>
      
      {/* Term Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems:'center' }}>
          {terms.map(term => (
              <div key={term.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setSelectedTermId(term.id)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: selectedTermId === term.id ? '1px solid var(--primary)' : '1px solid transparent',
                        background: selectedTermId === term.id ? 'var(--primary-d)' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontWeight: selectedTermId === term.id ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        paddingRight: '1.8rem' // Space for delete
                    }}
                  >
                      {term.name}
                  </button>
                  <button
                     onClick={(e) => { e.stopPropagation(); handleDeleteTerm(term.id); }}
                     style={{
                         position: 'absolute',
                         right: '5px',
                         top: '50%',
                         transform: 'translateY(-50%)',
                         background: 'transparent',
                         border: 'none',
                         color: 'rgba(255,255,255,0.4)',
                         fontSize: '0.8rem',
                         cursor: 'pointer',
                         padding: '0 4px'
                     }}
                     title='この期を削除'
                     onMouseEnter={(e) => e.target.style.color = '#ff6b6b'}
                     onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
                  >
                     ✕
                  </button>
              </div>
          ))}
          <button 
             onClick={handleAddTerm}
             style={{ 
                 padding: '0.5rem 0.8rem', 
                 borderRadius: '50%', 
                 background: 'var(--glass-border)', 
                 border: 'none', 
                 color: 'white',
                 cursor: 'pointer' 
             }}
             title="期の追加"
          >
             +
          </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }} className="text-gradient">{currentTerm ? currentTerm.name : ''} スケジュール</h2>
        <button 
          className="btn-primary" 
          onClick={() => setIsFormOpen(!isFormOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isFormOpen ? 'キャンセル' : '+ イベント追加'}
        </button>
      </div>
      
      {/* Manual Entry Form */}
      {isFormOpen && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>日付</label>
            <input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
          </div>
          <div style={{ flex: 2, minWidth: '200px' }}>
             <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>タイトル</label>
             <input 
              type="text" 
              placeholder="イベント名"
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
          </div>
          <div style={{ flex: 3, minWidth: '200px' }}>
             <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>詳細 (時間など)</label>
             <input 
              type="text" 
              placeholder="10:00~12:00 etc"
              value={newDesc} 
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white' }}
            />
          </div>
          <button 
            onClick={handleManualAdd}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '0.6rem 1.5rem', 
              borderRadius: '4px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            保存 (現在の期)
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 300px', gap: '2rem' }}>
        
        {/* LEFT: Calendar/List */}
        <div className="glass-panel" style={{ padding: '1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display:'flex', justifyContent:'space-between' }}>
            <span>今後の予定</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>合計: {currentEvents.length}</span>
          </h3>
          
          {currentEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>予定はありません</p>
          ) : (
            currentEvents.sort((a,b) => new Date(a.date) - new Date(b.date)).map(ev => {
              const { badge, text } = parseEventDisplay(ev);
              return (
                <div 
                  key={ev.id} 
                  className="card" 
                  style={{ 
                     padding: '1rem', 
                     background: 'rgba(255,255,255,0.03)', 
                     position: 'relative',
                     transition: 'opacity 0.3s',
                     ...getEventStyle(ev.date)
                  }}
                >
                  <button 
                    onClick={() => handleDelete(ev.id)}
                    style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      right: '1rem', 
                      color: '#ff6b6b', 
                      opacity: 0.5, 
                      cursor: 'pointer',
                      fontSize: '0.9rem' 
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0.5}
                    title="削除"
                  >
                    🗑
                  </button>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    
                    {/* Date Box */}
                    <div style={{ 
                      background: 'var(--primary)', 
                      color: 'white', 
                      padding: '0.5rem', 
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      minWidth: '80px',
                      marginTop: '0.25rem'
                    }}>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{ev.date.split('-')[0] || ''}</div>
                      <div style={{ fontWeight: 'bold' }}>{ev.date.substring(5) || ev.date}</div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontWeight: 'bold', margin:0 }}>
                              {badge && <span style={{ color: 'var(--primary-l)', marginRight: '0.25rem' }}>〈{badge}〉</span>}
                              {ev.title}
                          </h4>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{text}</p>
                      
                      {/* Memo Section */}
                      <div style={{ marginTop: '0.5rem' }}>
                          {editingMemoId === ev.id ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <textarea 
                                      value={memoText}
                                      onChange={(e) => setMemoText(e.target.value)}
                                      autoFocus
                                      style={{ 
                                          flex: 1, 
                                          background: 'rgba(0,0,0,0.3)', 
                                          border: '1px solid var(--primary)', 
                                          borderRadius: '4px',
                                          color: 'white',
                                          padding: '0.5rem',
                                          fontSize: '0.9rem',
                                          resize: 'none',
                                          height: '60px'
                                      }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <button 
                                          onClick={() => handleSaveMemo(ev.id)}
                                          className="btn-primary" 
                                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                      >
                                          保存
                                      </button>
                                      <button 
                                          onClick={() => setEditingMemoId(null)}
                                          style={{ 
                                              padding: '0.25rem 0.5rem', 
                                              fontSize: '0.8rem',
                                              background: 'transparent',
                                              border: '1px solid var(--glass-border)',
                                              color: 'white',
                                              borderRadius: '4px',
                                              cursor: 'pointer' 
                                          }}
                                      >
                                          取消
                                      </button>
                                  </div>
                              </div>
                          ) : (
                              <div 
                                  onClick={() => openMemoEditor(ev)}
                                  style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.5rem',
                                      cursor: 'pointer', 
                                      opacity: 0.7, 
                                      fontSize: '0.85rem',
                                      transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = 1}
                                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                              >
                                  <span style={{ fontSize: '1rem' }}>📝</span>
                                  {ev.memo ? (
                                      <span style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{ev.memo}</span>
                                  ) : (
                                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>メモを追加...</span>
                                  )}
                              </div>
                          )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: Tools (OCR) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>画像の読み込み (OCR)</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
               現在選択中の <strong>{currentTerm?.name}</strong> に追加されます。
               スケジュールの画像をアップロードすると、文字認識(OCR)で内容を読み取ります。
             </p>
             
             <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '1rem', width: '100%' }} />
             
             {loading && <div style={{ color: 'var(--primary-l)' }}>スキャン中... (時間がかかります)</div>}
             
             {ocrText && (
               <div style={{ animation: 'fadeIn 0.5s' }}>
                 <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>読み取り結果 (編集可能):</label>
                 <textarea 
                   value={ocrText} 
                   onChange={(e) => setOcrText(e.target.value)}
                   style={{ 
                     width: '100%', 
                     height: '150px', 
                     background: 'rgba(0,0,0,0.3)', 
                     border: '1px solid var(--glass-border)', 
                     color: 'white', 
                     padding: '0.5rem',
                     marginBottom: '0.5rem' 
                   }} 
                 />
                 <button className="btn-primary w-full" onClick={handleParseAndAdd}>
                   {currentTerm?.name} に追加する
                 </button>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
