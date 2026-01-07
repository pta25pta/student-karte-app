import { useState, useEffect } from 'react';

export function HomeView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate greeting directly from currentTime (no state needed)
  const hour = currentTime.getHours();
  let greeting = 'お疲れ様です';
  if (hour < 12) greeting = 'おはようございます';
  else if (hour >= 18) greeting = 'お疲れ様でした';

  const formatDate = (date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 (' + days[date.getDay()] + ')';
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  // Quotes
  const quotes = [
    "「継続は力なり」 - 小さな積み重ねが大きな成果を生みます。",
    "「失敗は成功のもと」 - トレードの負けは学びの宝庫です。",
    "「規律を守る」 - ルールを守ることが生き残る唯一の道です。",
    "「焦らない」 - チャンスは必ずまた来ます。",
    "「感情をコントロールする」 - 冷静な判断が利益を生みます。"
  ];
  // Simple daily quote based on date
  const todayQuoteIndex = new Date().getDate() % quotes.length;

  // Mock data for dashboard
  const activeStudents = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]; // 23 students
  const term1Students = activeStudents; // All are term 1 for now

  // Get next event (schedule)
  const [nextEvent, setNextEvent] = useState(null);
  useEffect(() => {
    try {
      const savedSchedule = localStorage.getItem('scheduleData');
      if (savedSchedule) {
        const schedule = JSON.parse(savedSchedule);
        // Find next event
        const now = new Date();
        const upcoming = schedule.events
          .map(e => ({ ...e, dateObj: new Date(e.start) }))
          .filter(e => e.dateObj > now)
          .sort((a, b) => a.dateObj - b.dateObj)[0];
        setNextEvent(upcoming);
      }
    } catch (e) {
      console.error('Failed to load schedule', e);
    }
  }, []);

  return (
    <div className="h-full w-full flex-col gap-md animate-fade-in" style={{ overflowY: 'auto' }}>
      
      {/* Hero Section */}
      <div 
        className="card"
        style={{ 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(var(--primary-h), 100, 50, 0.4)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {greeting}
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>
            {formatDate(currentTime)}
          </p>
          <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', display: 'inline-block' }}>
            💡 {quotes[todayQuoteIndex]}
          </div>
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', fontFamily: 'monospace', opacity: 0.9 }}>
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard 
          icon="👥" 
          label="在籍生徒" 
          value={activeStudents.length + '名'} 
          sublabel="全生徒数"
          color="#8b5cf6" 
        />
        <StatCard 
          icon="📚" 
          label="1期生" 
          value={term1Students.length + '名'} 
          sublabel="学習中"
          color="#3b82f6" 
        />
        <StatCard 
          icon="📅" 
          label="次の予定" 
          value={nextEvent ? nextEvent.title : '予定なし'} 
          sublabel={nextEvent ? new Date(nextEvent.start).toLocaleDateString() : '-'}
          color="#10b981" 
        />
        <StatCard 
          icon="🎯" 
          label="今月の目標" 
          value="全員プラス" 
          sublabel="月次収支"
          color="#f59e0b" 
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', flex: 1 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Actions */}
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ クイックアクション
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
               <ActionButton icon="📝" label="日誌チェック" onClick={() => {}} />
               <ActionButton icon="📢" label="全体アナウンス" onClick={() => {}} />
               <ActionButton icon="➕" label="生徒追加" onClick={() => alert('生徒追加機能は準備中です')} />
               <ActionButton icon="⚙️" label="システム設定" onClick={() => {}} />
            </div>
          </section>

          {/* Today's Checklist */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ✅ 今日のチェックリスト
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <CheckItem label="朝のマーケット確認" />
              <CheckItem label="前日の日誌フィードバック" />
              <CheckItem label="未提出者のフォロー" />
              <CheckItem label="週報の作成（金曜日）" />
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Next Event Card */}
          <section className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(to bottom right, var(--glass-bg), rgba(var(--primary-h), 100, 50, 0.1))' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary-l)' }}>
              📅 直近のスケジュール
            </h2>
            {nextEvent ? (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {nextEvent.title}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {new Date(nextEvent.start).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  {nextEvent.type === 'lecture' ? '講義' : nextEvent.type === 'meeting' ? 'ミーティング' : 'その他'}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                予定はありません
              </div>
            )}
          </section>

          {/* Overall Summary */}
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📈 全体サマリー
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <SummaryRow label="平均勝率" value="-" />
               <SummaryRow label="提出率" value="-" />
               <SummaryRow label="勝ち越し人数" value="-" />
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
               ※データは「全員同期」で更新
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid ' + color }}>
      <div style={{ fontSize: '2rem', background: 'rgba(255,255,255,0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1.2' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sublabel}</div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="glass-panel"
      style={{ 
        padding: '1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '0.5rem',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        border: '1px solid var(--glass-border)'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem' }}>{label}</div>
    </button>
  );
}

function CheckItem({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <div 
      onClick={() => setChecked(!checked)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem', 
        background: checked ? 'rgba(var(--primary-h), 100, 50, 0.1)' : 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ 
        width: '20px', 
        height: '20px', 
        borderRadius: '50%', 
        border: checked ? 'none' : '2px solid var(--text-muted)',
        background: checked ? 'var(--primary)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '0.8rem'
      }}>
        {checked && '✓'}
      </div>
      <div style={{ 
        textDecoration: checked ? 'line-through' : 'none',
        color: checked ? 'var(--text-muted)' : 'inherit'
      }}>
        {label}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}