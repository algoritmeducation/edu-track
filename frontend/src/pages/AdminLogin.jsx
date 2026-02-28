import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ThemeToggle from '../components/ThemeToggle';

export default function AdminLogin({ onBack, onLogin, isLight, onToggle }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const showToast = useToast();

    async function handleLogin() {
        if (!username.trim() || !password) return;
        setLoading(true);
        try {
            const data = await api('POST', '/api/auth/admin', { username: username.trim(), password });
            setError(false);
            onLogin(data.token, { type: 'admin' });
        } catch {
            setError(true);
            setPassword('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="view active" id="v-admin-login">
            <ThemeToggle isLight={isLight} onToggle={onToggle} variant="landing" />
            <div className="login-box">
                <button className="login-back" onClick={onBack}>← Back</button>
                <div className="login-icon-wrap">
                    <svg viewBox="0 0 24 24"><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z" /><polyline points="9 12 11 14 15 10" /></svg>
                </div>
                <div className="login-title">ADMIN <span className="y">LOGIN</span></div>
                <div className="login-subtitle">Enter your admin credentials to continue</div>
                <div className="f-group">
                    <label className="f-label">Username</label>
                    <input className="f-input" type="text" placeholder="admin" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="f-group">
                    <label className="f-label">Password</label>
                    <input className="f-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                    <div className={'f-error' + (error ? ' show' : '')}>Incorrect username or password.</div>
                </div>
                <button className="btn-login" onClick={handleLogin} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
                </button>
                <div className="demo-box">
                    <div className="demo-title">Demo Credentials</div>
                    <div className="demo-row">Username: <span className="demo-val">admin</span></div>
                    <div className="demo-row">Password: <span className="demo-val">admin111</span></div>
                </div>
            </div>
        </div>
    );
}
