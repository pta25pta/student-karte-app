import { useState } from 'react';

export function LoginView({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Check if running on localhost (development mode)
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isLocalDev) {
            // Local development: use hardcoded credentials for testing
            // These will NOT be in the production build since we use the API there
            if (email === 'pta25pta@gmail.com' && password === 'pta2025pta44') {
                onLogin();
            } else {
                setError('メールアドレスまたはパスワードが間違っています');
            }
            setIsLoading(false);
            return;
        }

        // Production: use the secure API endpoint
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                onLogin();
            } else {
                setError('メールアドレスまたはパスワードが間違っています');
            }
        } catch (err) {
            setError('認証エラーが発生しました。もう一度お試しください。');
        } finally {
            setIsLoading(false);
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
                            placeholder="example@email.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            autoFocus
                            disabled={isLoading}
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
                            placeholder="パスワードを入力"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            disabled={isLoading}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'left' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: isLoading ? 'var(--text-muted)' : 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? '認証中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
