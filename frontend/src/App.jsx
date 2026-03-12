import { useState } from 'react';
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

    return (
        <ToastProvider>
            {view === 'landing' && (
                <Landing onNavigate={setView} />
            )}
            {view === 'admin-login' && (
                <AdminLogin onBack={() => setView('landing')} onLogin={handleLogin} />
            )}
            {view === 'teacher-login' && (
                <TeacherLogin onBack={() => setView('landing')} onLogin={handleLogin} />
            )}
            {view === 'teacher-app' && user?.type === 'teacher' && (
                <TeacherApp token={token} user={user} onLogout={handleLogout} />
            )}
            {view === 'admin-app' && user?.type === 'admin' && (
                <AdminApp token={token} onLogout={handleLogout} />
            )}
        </ToastProvider>
    );
}
