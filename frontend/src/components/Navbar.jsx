import ThemeToggle from './ThemeToggle';

export default function Navbar({ isLight, onToggle, user, onLogout, tabs, activeTab, onTabChange }) {
    return (
        <nav className="app-nav">
            <div className="nav-logo">EDUTRACK</div>
            {tabs && (
                <div className="nav-tabs">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            className={'nav-tab' + (activeTab === t.key ? ' active' : '')}
                            id={'atab-' + t.key}
                            onClick={() => onTabChange(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}
            <div className="nav-user">
                <ThemeToggle isLight={isLight} onToggle={onToggle} variant="nav" />
                <div className="nav-avatar">{user.avatar}</div>
                <div>
                    <div className="nav-uname">{user.name}</div>
                    <div className="nav-role">{user.role}</div>
                </div>
                <button className="btn-logout" onClick={onLogout}>Sign Out</button>
            </div>
        </nav>
    );
}
