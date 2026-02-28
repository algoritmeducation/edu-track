import { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import TeacherLogin from './pages/TeacherLogin';
import TeacherApp from './pages/TeacherApp';
import AdminApp from './pages/AdminApp';

export default function App() {
    const [view, setView] = useState('landing');
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('light', isLight);
    }, [isLight]);

    function handleLogin(newToken, newUser) {
        setToken(newToken);
        setUser(newUser);
        setView(newUser.type === 'admin' ? 'admin-app' : 'teacher-app');
    }

    function handleLogout() {
        setToken(null);
        setUser(null);
        setView('landing');
    }

    const toggleTheme = () => setIsLight((v) => !v);

    return (
        <ToastProvider>
            {view === 'landing' && (
                <Landing onNavigate={setView} isLight={isLight} onToggle={toggleTheme} />
            )}
            {view === 'admin-login' && (
                <AdminLogin onBack={() => setView('landing')} onLogin={handleLogin} isLight={isLight} onToggle={toggleTheme} />
            )}
            {view === 'teacher-login' && (
                <TeacherLogin onBack={() => setView('landing')} onLogin={handleLogin} isLight={isLight} onToggle={toggleTheme} />
            )}
            {view === 'teacher-app' && user?.type === 'teacher' && (
                <TeacherApp token={token} user={user} isLight={isLight} onToggle={toggleTheme} onLogout={handleLogout} />
            )}
            {view === 'admin-app' && user?.type === 'admin' && (
                <AdminApp token={token} isLight={isLight} onToggle={toggleTheme} onLogout={handleLogout} />
            )}
        </ToastProvider>
    );
}
