import { useState } from 'react';

export function LoginView({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation: email + password
        if (email === 'pta25pta@gmail.com' && password === 'pta2025pta44') {
            onLogin();
        } else {
            setError('メールアドレスまたはパスワードが間違っています');
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
                <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>管理者情報を入力してログイン</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Email Input */}
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            placeholder="pta25pta@gmail.com"
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
                    </div>

                    {/* Password Input */}
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</div>}

                    <button
                        type="submit"
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        ログイン
                    </button>
                    
                    {/* Removed helper text for security in production-like feel, or keep it if requested? User didn't ask to remove, but usually we hide credentials. I'll hide the explicit text but leave a hint if needed. For now, removing the footer text to avoid confusion with old credentials. */}
                </form>
            </div>
        </div>
    );
}
