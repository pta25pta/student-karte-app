import React from 'react';

export function ScenarioPanel({ selectedDate, scenarioData }) {
    if (!selectedDate) {
        return (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }}>👈</div>
                    <div style={{ color: 'var(--text-muted)', fontWeight: '500' }}>カレンダーから日付を選択して<br />シナリオを表示</div>
                </div>
            </div>
        );
    }

    const { year, month, day } = selectedDate;
    const dateStr = `${year}/${month}/${day}`;

    const data = scenarioData || [];
    const isEmpty = data.length === 0;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', margin: 0 }}>
                    <span>📝 Today's Scenario</span>
                </h3>
                <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.1rem 0.5rem', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                    {dateStr}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                {isEmpty ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '2.5rem 0' }}>
                        <span style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>📭</span>
                        <span style={{ fontSize: '0.85rem' }}>データなし</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {data.map((scenario, index) => (
                            <ScenarioCard key={index} scenario={scenario} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ScenarioCard({ scenario, index }) {
    const isSkip = scenario.pair === 'SKIP' || scenario.pair === '見送り';

    if (isSkip) {
        return (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 'bold', marginRight: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>#{index + 1}</span>
                <span>本日は見送り</span>
            </div>
        );
    }

    const isLong = scenario.ls === 'ロング' || scenario.ls === '⇧' || scenario.ls === 'Long';
    const lsBg = isLong ? '#FEF2F2' : '#EFF6FF';
    const lsBorder = isLong ? '#FEE2E2' : '#DBEAFE';
    const lsText = isLong ? '#DC2626' : '#2563EB';
    const displayLs = isLong ? '⇧ JOIN' : '⇩ JOIN';

    return (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ background: 'var(--bg-input)', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{index + 1}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{scenario.pair}</span>
                </div>
                <div style={{ borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', border: '1px solid ' + lsBorder, background: lsBg, color: lsText, padding: '2px 6px' }}>
                    {displayLs}
                </div>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--bg-card)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 0.75rem' }}>
                <InfoItem label="行き過ぎ" value={scenario.ob} highlight={scenario.ob === 'あり'} />
                <InfoItem label="レジサポ" value={scenario.rs} />

                <div style={{ gridColumn: 'span 2', borderTop: '1px dashed var(--border-color)', margin: '0.25rem 0' }}></div>

                <InfoItem label="日足" value={scenario.daily} />
                <InfoItem label="週足" value={scenario.weekly} />
                <InfoItem label="月足" value={scenario.monthly} />
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <InfoItem label="4H" value={scenario.h4} />
                    <InfoItem label="1H" value={scenario.h1} />
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, highlight }) {
    let valStyle = { fontWeight: '500', color: 'var(--text-main)', textAlign: 'right' };
    const v = value || '';

    if (v.includes('○') || v.includes('順') || v.includes('①') || v.includes('②') || v.includes('③')) {
        valStyle.fontWeight = 'bold';
        valStyle.color = '#2563EB';
    }
    if (v.includes('△')) {
        valStyle.color = '#D97706';
    }
    if (v.includes('×') || v.includes('逆')) {
        valStyle.color = '#DC2626';
    }

    if (highlight) {
        valStyle.fontWeight = 'bold';
        valStyle.color = '#DC2626';
        valStyle.background = '#FEF2F2';
        valStyle.padding = '0 0.4rem';
        valStyle.borderRadius = '2px';
        valStyle.display = 'inline-block';
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', lineHeight: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>{label}</span>
            <span style={valStyle}>{value || '-'}</span>
        </div>
    );
}
