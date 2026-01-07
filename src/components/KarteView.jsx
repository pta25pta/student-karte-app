import React, { useState, useEffect } from 'react';

export function KarteView({ student }) {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [records, setRecords] = useState(student.records);

  // Update local state when student changes
  useEffect(() => {
    setRecords(student.records);
    setSelectedMonth(null);
  }, [student]);

  const handleSave = (monthIndex, updatedRecord) => {
    const newRecords = [...records];
    newRecords[monthIndex] = updatedRecord;
    setRecords(newRecords);
    // Mutate mock data reference
    // eslint-disable-next-line
    student.records[monthIndex] = updatedRecord; 
  };

  return (
    <div className="card glass-panel h-full animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{student.name}</h1>
           <p style={{ color: 'var(--text-muted)' }}>入会日: {student.joinDate}</p>
        </div>
        <div className="card" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'var(--text-muted)' }}>ステータス: </span>
          <span style={{ color: 'var(--accent-l)', fontWeight:'bold' }}>{student.status}</span>
        </div>
      </div>

      {/* 8-Month Grid */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>タイムライン (Timeline)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {records.map((record, index) => {
             const hasData = record.growth || record.challenges;
             const isSelected = selectedMonth === index;
             return (
               <button 
                 key={index}
                 onClick={() => setSelectedMonth(index)}
                 style={{
                   padding: '1.25rem',
                   borderRadius: 'var(--radius-lg)',
                   background: isSelected 
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' 
                      : hasData ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                   border: isSelected ? '1px solid var(--primary-l)' : '1px solid var(--glass-border)',
                   color: 'white',
                   textAlign: 'left',
                   transition: 'all 0.3s ease',
                   cursor: 'pointer',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: '0.25rem',
                   position: 'relative',
                   overflow: 'hidden'
                 }}
               >
                 <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{index + 1}ヶ月目</span>
                 {hasData ? (
                   <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>記録済</div>
                 ) : (
                   <div style={{ fontSize: '1rem', opacity: 0.4 }}>未記録</div>
                 )}
               </button>
             );
          })}
        </div>
      </div>

      {/* Editor Area */}
      {selectedMonth !== null && (
        <div className="animate-fade-in" style={{ flex: 1, borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <RecordEditor 
            month={selectedMonth + 1} 
            record={records[selectedMonth]} 
            onSave={(updated) => handleSave(selectedMonth, updated)}
          />
        </div>
      )}
    </div>
  );
}

function RecordEditor({ month, record, onSave }) {
  const [data, setData] = useState(record);

  useEffect(() => {
    setData(record);
  }, [record]);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onSave(newData);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>{month}ヶ月目の振り返り</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <InputGroup label="今月の成果・良かった点 (Growth)">
            <textarea 
              value={data.growth}
              onChange={e => handleChange('growth', e.target.value)}
              placeholder="今月達成できたことや、成長を感じた点は？"
              rows={4}
            />
          </InputGroup>
          <InputGroup label="現在の課題 (Challenges)">
            <textarea 
              value={data.challenges}
              onChange={e => handleChange('challenges', e.target.value)}
              placeholder="現在直面している壁や、解決したい悩みは？"
              rows={4}
            />
          </InputGroup>
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>今後の展望 (Forward Look)</h3>
        <InputGroup label="次月の目標・アクションプラン (Next Steps)">
           <textarea 
              value={data.nextSteps}
              onChange={e => handleChange('nextSteps', e.target.value)}
              placeholder="来月に向けての具体的な行動計画..."
              rows={11}
            />
        </InputGroup>
      </div>
    </div>
  );
}

function InputGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {React.cloneElement(children, {
        style: {
          width: '100%',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.2)',
          color: 'white',
          fontFamily: 'inherit',
          resize: 'none',
          outline: 'none',
          transition: 'all 0.2s',
          fontSize: '0.95rem',
          ...children.props.style
        }
      })}
    </div>
  );
}
