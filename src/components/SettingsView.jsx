import React, { useState, useEffect } from 'react';

export function SettingsView() {
  const [instructorName, setInstructorName] = useState(localStorage.getItem('instructorName') || 'ポコさん');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');

  useEffect(() => {
    localStorage.setItem('instructorName', instructorName);
  }, [instructorName]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('autoSync', autoSync);
  }, [autoSync]);

  const handleExport = () => {
    const scheduleData = localStorage.getItem('scheduleData');
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      instructor: instructorName,
      schedule: scheduleData ? JSON.parse(scheduleData) : 'No saved schedule',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-karte-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    if (window.confirm('本当にすべてのデータをリセットしますか？\nこの操作は取り消せません。')) {
      localStorage.removeItem('scheduleData');
      localStorage.removeItem('instructorName');
      localStorage.removeItem('theme');
      localStorage.removeItem('autoSync');
      window.location.reload();
    }
  };

  return (
    <div className="h-full w-full flex-col gap-md animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }} className="text-gradient">設定</h2>
      
      {/* Appearance Settings */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          🎨 外観設定
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>テーマ</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ダークモードまたはライトモードを選択</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: theme === 'dark' ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🌙 ダーク
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: theme === 'light' ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ☀️ ライト
            </button>
          </div>
        </div>
      </section>

      {/* Sync Settings */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          🔄 同期設定
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>起動時自動同期</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>アプリを開いた時に自動で全員分のデータを同期する</div>
          </div>
          <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
            <input 
              type="checkbox" 
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: autoSync ? 'var(--primary)' : '#ccc', 
              transition: '.4s', borderRadius: '34px' 
            }} />
            <span style={{ 
              position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', 
              backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
              transform: autoSync ? 'translateX(26px)' : 'translateX(0)'
            }} />
          </label>
        </div>
      </section>

      {/* Profile Settings */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          👤 プロフィール設定
        </h3>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>講師名 (表示名)</label>
                <input 
                    type="text" 
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'inherit' }}
                />
            </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          💾 データ管理
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                現在のアプリケーションデータをエクスポート、またはリセットできます。
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                    onClick={handleExport}
                    className="btn-primary"
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    📥 データをエクスポート
                </button>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                     onClick={handleReset}
                     style={{ 
                         color: '#ff6b6b', 
                         background: 'transparent', 
                         border: '1px solid #ff6b6b', 
                         padding: '0.5rem 1rem', 
                         borderRadius: '4px',
                         cursor: 'pointer',
                         fontSize: '0.9rem'
                     }}
                >
                    ⚠️ 全データをリセット
                </button>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    すべてのデータを削除し、初期状態に戻します。
                </p>
            </div>
        </div>
      </section>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
        生徒カルテ アプリ v1.4.1
      </div>
    </div>
  );
}