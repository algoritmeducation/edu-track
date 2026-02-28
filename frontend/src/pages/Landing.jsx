import ThemeToggle from '../components/ThemeToggle';

export default function Landing({ onNavigate, isLight, onToggle }) {
    return (
        <div className="view active" id="v-landing">
            <ThemeToggle isLight={isLight} onToggle={onToggle} variant="landing" />
            <div className="hero-chip">Learning Management System</div>
            <div className="hero-title">EDU<span className="y">TRACK</span></div>
            <p className="hero-sub">A unified platform for teachers to manage groups and admins to oversee all operations.</p>
            <div className="landing-cards">
                <div className="landing-card" onClick={() => onNavigate('teacher-login')}>
                    <div className="lc-icon">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M19 8l2 2-2 2" /><path d="M17 12h4" /></svg>
                    </div>
                    <div className="lc-title">Teacher</div>
                    <div className="lc-desc">Manage your groups, track progress, and log student data.</div>
                    <div className="lc-arrow">Sign In →</div>
                </div>
                <div className="landing-card" onClick={() => onNavigate('admin-login')}>
                    <div className="lc-icon">
                        <svg viewBox="0 0 24 24"><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z" /><polyline points="9 12 11 14 15 10" /></svg>
                    </div>
                    <div className="lc-title">Admin</div>
                    <div className="lc-desc">Full oversight of all teachers, groups, and platform metrics.</div>
                    <div className="lc-arrow">Sign In →</div>
                </div>
            </div>
        </div>
    );
}
