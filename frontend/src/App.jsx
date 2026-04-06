import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import TeacherLogin from './pages/TeacherLogin';
import TeacherApp from './pages/TeacherApp';
import AdminApp from './pages/AdminApp';

function AppContent() {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const navigate = useNavigate();

    function handleLogin(newToken, newUser) {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (newUser.type === 'admin') {
            navigate('/admin');
        } else {
            navigate('/teacher');
        }
    }

    function handleLogout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }

    function handleNavigate(route) {
        if (route === 'admin-login') navigate('/admin/login');
        else if (route === 'teacher-login') navigate('/teacher/login');
        else navigate('/');
    }

    return (
        <Routes>
            <Route path="/" element={
                <Landing onNavigate={handleNavigate} />
            } />
            <Route path="/admin/login" element={
                user?.type === 'admin' ? <Navigate to="/admin" replace /> :
                    <AdminLogin onBack={() => navigate('/')} onLogin={handleLogin} />
            } />
            <Route path="/teacher/login" element={
                user?.type === 'teacher' ? <Navigate to="/teacher" replace /> :
                    <TeacherLogin onBack={() => navigate('/')} onLogin={handleLogin} />
            } />
            <Route path="/teacher/*" element={
                (token && user?.type === 'teacher') ?
                    <TeacherApp token={token} user={user} onLogout={handleLogout} /> :
                    <Navigate to="/teacher/login" replace />
            } />
            <Route path="/admin/*" element={
                (token && user?.type === 'admin') ?
                    <AdminApp token={token} onLogout={handleLogout} /> :
                    <Navigate to="/admin/login" replace />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </BrowserRouter>
    );
}
