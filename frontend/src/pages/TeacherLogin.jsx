import { useState } from 'react';
import { api } from '../api';
import ThemeToggle from '../components/ThemeToggle';

export default function TeacherLogin({ onBack, onLogin, isLight, onToggle }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!username.trim() || !password) return;
        setLoading(true);
        try {
            const data = await api('POST', '/api/auth/teacher', { username: username.trim(), password });
            setError(false);
            onLogin(data.token, { type: 'teacher', teacher: data.teacher });
        } catch {
            setError(true);
            setPassword('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="view active" id="v-teacher-login">
            <ThemeToggle isLight={isLight} onToggle={onToggle} variant="landing" />
            <div className="login-box">
                <button className="login-back" onClick={onBack}>← Back</button>
                <div className="login-icon-wrap">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M19 8l2 2-2 2" /><path d="M17 12h4" /></svg>
                </div>
                <div className="login-title">TEACHER <span className="y">LOGIN</span></div>
                <div className="login-subtitle">Sign in with your account credentials</div>
                <div className="f-group">
                    <label className="f-label">Username</label>
                    <input className="f-input" type="text" placeholder="e.g. alisher.n" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="f-group">
                    <label className="f-label">Password</label>
                    <input className="f-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                    <div className={'f-error' + (error ? ' show' : '')}>Incorrect username or password.</div>
                </div>
                <button className="btn-login" onClick={handleLogin} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In to Teacher Panel'}
                </button>
                <div className="demo-box">
                    <div className="demo-title">Demo Teacher Accounts</div>
                    <div className="demo-row">alisher.n / <span className="demo-val">teacher123</span></div>
                    <div className="demo-row">malika.y / <span className="demo-val">teacher123</span></div>
                    <div className="demo-row">bobur.t / <span className="demo-val">teacher123</span></div>
                    <div className="demo-row">dilnoza.r / <span className="demo-val">teacher123</span></div>
                    <div className="demo-row">sardor.m / <span className="demo-val">teacher123</span></div>
                </div>
            </div>
        </div>
    );
}
