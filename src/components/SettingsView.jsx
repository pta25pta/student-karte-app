import React, { useState, useEffect } from 'react';

export function SettingsView() {
  const [instructorName, setInstructorName] = useState(localStorage.getItem('instructorName') || 'ポコさん');
  // const [theme, setTheme] = useState('light'); // Force light for now as it is the Modern Clean theme
  const [autoSync, setAutoSync] = useState(localStorage.getItem('autoSync') === 'true');

  useEffect(() => {
    localStorage.setItem('instructorName', instructorName);
  }, [instructorName]);

  useEffect(() => {
    // Enforce light theme for this design
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

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
    link.download = 'student-karte-backup-' + new Date().toISOString().slice(0, 10) + '.json';
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>設定</h2>

      {/* Appearance Settings */}
      <section className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
          🎨 テーマ設定
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>表示テーマ</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>現在は「モダンクリーン」テーマが適用されています</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: '#F3F4F6',
                color: 'var(--text-muted)',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              ☀️ ライト (固定)
            </button>
          </div>
        </div>
      </section>

      {/* Sync Settings */}
      <section className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
          🔄 同期設定
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>起動時自動同期</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>アプリを開いた時に自動で全員分のデータを同期する</div>
          </div>
          <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: autoSync ? 'var(--primary)' : '#E5E7EB',
              transition: '.3s', borderRadius: '34px'
            }} />
            <span style={{
              position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
              backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
              transform: autoSync ? 'translateX(20px)' : 'translateX(0)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }} />
          </label>
        </div>
      </section>

      {/* Profile Settings */}
      <section className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
          👤 プロフィール設定
        </h3>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500' }}>講師名 (表示名)</label>
            <input
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                background: 'white',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
          💾 データ管理
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            現在のアプリケーションデータをエクスポート、またはリセットできます。
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleExport}
              className="btn-primary"
            >
              📥 データをエクスポート
            </button>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={handleReset}
              style={{
                color: '#EF4444',
                background: 'white',
                border: '1px solid #FECACA',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
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

      <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '2rem', marginBottom: '2rem' }}>
        生徒カルテ アプリ v1.5.0 (Modern Clean UI)
      </div>
    </div>
  );
}
