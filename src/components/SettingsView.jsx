import React, { useState, useEffect } from 'react';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [autoTheme, setAutoTheme] = useState(localStorage.getItem('autoTheme') === 'true');
  const [darkStartHour, setDarkStartHour] = useState(parseInt(localStorage.getItem('darkStartHour') || '18'));
  const [darkEndHour, setDarkEndHour] = useState(parseInt(localStorage.getItem('darkEndHour') || '6'));
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');

  const [apiUrl, setApiUrl] = useState(localStorage.getItem('gasApiUrl') || 'https://script.google.com/macros/s/AKfycbyYGrCBZ7fiMxIdhPyGckDIOkc9RA8Op5xyUFk01eTDhO9pxVPurTpd1Bu-nJMguQlz/exec');
  
  const getDefaultRanks = () => [
    { id: 'S', label: 'S', color: '#F59E0B' },
    { id: 'A', label: 'A', color: '#3B82F6' },
    { id: 'B', label: 'B', color: '#10B981' },
    { id: 'C', label: 'C', color: '#9CA3AF' },
  ];
  const [rankSettings, setRankSettings] = useState(() => {
    const saved = localStorage.getItem('rankSettings');
    return saved ? JSON.parse(saved) : getDefaultRanks();
  });

  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#3B82F6');
  const [scheduleMaxItems, setScheduleMaxItems] = useState(parseInt(localStorage.getItem('scheduleMaxItems') || '6'));
  const [defaultTerm, setDefaultTerm] = useState(parseInt(localStorage.getItem('defaultTerm') || '1'));
  const [alertThresholdDefault, setAlertThresholdDefault] = useState(parseInt(localStorage.getItem('alertThresholdDefault') || '50'));

  const getDefaultTags = () => [
    { id: 'action', label: '要対応', color: '#EF4444' },
    { id: 'done', label: '完了', color: '#10B981' },
    { id: 'info', label: '情報', color: '#3B82F6' },
    { id: 'important', label: '重要', color: '#F59E0B' }
  ];
  const [customTags, setCustomTags] = useState(() => {
    const saved = localStorage.getItem('customTags');
    return saved ? JSON.parse(saved) : getDefaultTags();
  });
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  useEffect(() => { localStorage.setItem('gasApiUrl', apiUrl); }, [apiUrl]);
  useEffect(() => { localStorage.setItem('rankSettings', JSON.stringify(rankSettings)); }, [rankSettings]);
  useEffect(() => { 
    localStorage.setItem('primaryColor', primaryColor);
    document.documentElement.style.setProperty('--primary', primaryColor);
  }, [primaryColor]);
  useEffect(() => { localStorage.setItem('scheduleMaxItems', scheduleMaxItems.toString()); }, [scheduleMaxItems]);
  useEffect(() => { localStorage.setItem('defaultTerm', defaultTerm.toString()); }, [defaultTerm]);
  useEffect(() => { localStorage.setItem('alertThresholdDefault', alertThresholdDefault.toString()); }, [alertThresholdDefault]);
  useEffect(() => { localStorage.setItem('customTags', JSON.stringify(customTags)); }, [customTags]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('autoTheme', autoTheme);
    localStorage.setItem('darkStartHour', darkStartHour.toString());
    localStorage.setItem('darkEndHour', darkEndHour.toString());
    if (autoTheme) {
      const checkTime = () => {
        const hour = new Date().getHours();
        const shouldBeDark = hour >= darkStartHour || hour < darkEndHour;
        const newTheme = shouldBeDark ? 'dark' : 'light';
        if (newTheme !== theme) setTheme(newTheme);
      };
      checkTime();
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    }
  }, [autoTheme, darkStartHour, darkEndHour, theme]);

  const handleRankUpdate = (id, field, value) => {
    setRankSettings(rankSettings.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schedule) localStorage.setItem('scheduleData', JSON.stringify(data.schedule));
        alert('バックアップをインポートしました。');
        window.location.reload();
      } catch (err) {
        alert('インポートに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    setCustomTags([...customTags, { id: 'tag_' + Date.now(), label: newTagName.trim(), color: newTagColor }]);
    setNewTagName('');
    setNewTagColor('#3B82F6');
  };

  const handleDeleteTag = (id) => {
    if (window.confirm('このタグを削除しますか？')) {
      setCustomTags(customTags.filter(t => t.id !== id));
    }
  };

  const handleUpdateTag = (id) => {
    setCustomTags(customTags.map(t => t.id === id ? { ...t, label: editingTag.label, color: editingTag.color } : t));
    setEditingTag(null);
  };

  const TabButton = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '0.75rem 1.5rem',
        background: active ? 'var(--primary)' : 'var(--bg-card, white)',
        color: active ? 'white' : 'var(--text-main)',
        border: active ? 'none' : '1px solid var(--border-color)',
        borderRadius: '8px',
        fontSize: '0.95rem',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  const cardStyle = { padding: '1.5rem', marginBottom: '1rem' };
  const sectionTitle = { fontSize: '1rem', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' };
  const inputStyle = { padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input, white)', color: 'var(--text-main)', fontSize: '0.9rem' };

  return (
    <div className="h-full w-full animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', overflowY: 'auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>設定</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <TabButton label="一般設定" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
        <TabButton label="管理設定" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
      </div>

      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
          
          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>テーマ設定</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setTheme('light')} style={{ ...inputStyle, flex: 1, background: theme === 'light' ? 'var(--primary)' : 'var(--bg-card, white)', color: theme === 'light' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: theme === 'light' ? '600' : '400' }}>
                ライト
              </button>
              <button onClick={() => setTheme('dark')} style={{ ...inputStyle, flex: 1, background: theme === 'dark' ? 'var(--primary)' : 'var(--bg-card, white)', color: theme === 'dark' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: theme === 'dark' ? '600' : '400' }}>
                ダーク
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.9rem' }}>時間で自動切り替え</span>
              <input type="checkbox" checked={autoTheme} onChange={(e) => setAutoTheme(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
            </div>
            {autoTheme && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-input, #F9FAFB)', borderRadius: '6px' }}>
                <input type="number" min="0" max="23" value={darkStartHour} onChange={(e) => setDarkStartHour(parseInt(e.target.value) || 18)} style={{ ...inputStyle, width: '50px', textAlign: 'center' }} />
                <span style={{ fontSize: '0.85rem' }}>時〜</span>
                <input type="number" min="0" max="23" value={darkEndHour} onChange={(e) => setDarkEndHour(parseInt(e.target.value) || 6)} style={{ ...inputStyle, width: '50px', textAlign: 'center' }} />
                <span style={{ fontSize: '0.85rem' }}>時</span>
              </div>
            )}
          </section>

          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>表示設定</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>スケジュール表示件数</span>
                <input type="number" min="1" max="20" value={scheduleMaxItems} onChange={(e) => setScheduleMaxItems(parseInt(e.target.value) || 6)} style={{ ...inputStyle, width: '60px', textAlign: 'center' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>デフォルト表示期</span>
                <select value={defaultTerm} onChange={(e) => setDefaultTerm(parseInt(e.target.value))} style={{ ...inputStyle }}>
                  <option value={1}>第1期生</option>
                  <option value={2}>第2期生</option>
                  <option value={3}>第3期生</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>アラート閾値 (勝率%)</span>
                <input type="number" min="0" max="100" value={alertThresholdDefault} onChange={(e) => setAlertThresholdDefault(parseInt(e.target.value) || 50)} style={{ ...inputStyle, width: '60px', textAlign: 'center' }} />
              </div>
            </div>
          </section>

          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>アクセントカラー</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '50px', height: '35px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
              <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{primaryColor}</span>
              <button onClick={() => setPrimaryColor('#3B82F6')} style={{ ...inputStyle, marginLeft: 'auto', cursor: 'pointer', fontSize: '0.8rem' }}>リセット</button>
            </div>
          </section>

          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>ランク設定</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankSettings.map(rank => (
                <div key={rank.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card, white)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: rank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{rank.label}</div>
                  <input type="text" value={rank.label} onChange={(e) => handleRankUpdate(rank.id, 'label', e.target.value)} style={{ ...inputStyle, width: '50px', textAlign: 'center', fontWeight: 'bold' }} maxLength={2} />
                  <input type="color" value={rank.color} onChange={(e) => handleRankUpdate(rank.id, 'color', e.target.value)} style={{ width: '35px', height: '28px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ランク {rank.id}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <h3 style={sectionTitle}>タグ設定</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {customTags.map(tag => (
                <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card, white)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: tag.color, flexShrink: 0 }} />
                  {editingTag?.id === tag.id ? (
                    <>
                      <input type="text" value={editingTag.label} onChange={(e) => setEditingTag({ ...editingTag, label: e.target.value })} style={{ ...inputStyle, flex: 1, padding: '0.25rem' }} />
                      <input type="color" value={editingTag.color} onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })} style={{ width: '30px', height: '25px', border: 'none', cursor: 'pointer' }} />
                      <button onClick={() => handleUpdateTag(tag.id)} style={{ ...inputStyle, cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>保存</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>{tag.label}</span>
                      <button onClick={() => setEditingTag({ ...tag })} style={{ ...inputStyle, cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>編集</button>
                      <button onClick={() => handleDeleteTag(tag.id)} style={{ ...inputStyle, cursor: 'pointer', padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#EF4444' }}>削除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} style={{ width: '35px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <input type="text" placeholder="新しいタグ名" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} style={{ ...inputStyle, flex: 1 }} onKeyPress={(e) => e.key === 'Enter' && handleAddTag()} />
              <button onClick={handleAddTag} style={{ ...inputStyle, cursor: 'pointer', background: 'var(--primary)', color: 'white', border: 'none' }}>+ 追加</button>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
          
          <section className="card" style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <h3 style={sectionTitle}>API接続設定</h3>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>GAS Web App URL</label>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>データ取得に使用するGoogle Apps ScriptのURLです</p>
          </section>

          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>バックアップ復元</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>エクスポートしたJSONファイルからデータを復元します。</p>
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ fontSize: '0.9rem' }} />
            <p style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.75rem' }}>インポートすると現在のデータが上書きされます</p>
          </section>

          <section className="card" style={cardStyle}>
            <h3 style={sectionTitle}>同期設定</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem' }}>起動時に自動同期</span>
              <input type="checkbox" checked={autoSync} onChange={(e) => { setAutoSync(e.target.checked); localStorage.setItem('autoSync', e.target.checked); }} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
