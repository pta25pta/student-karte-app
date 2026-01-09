import { useState } from 'react';

export function LoginView({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simple hardcoded password check
        if (password === 'pta2025') {
            onLogin();
        } else {
            setError('パスワードが間違っています');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-main)',
            color: 'var(--text-main)'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
            }}>
                <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--primary)' }}>Student Karte</h1>
                <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>パスワードを入力してログインしてください</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="パスワード"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                        {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'left' }}>{error}</div>}
                    </div>

                    <button
                        type="submit"
                        style={{
                            padding: '0.75rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        ログイン
                    </button>
                </form>
            </div>
        </div>
    );
}
