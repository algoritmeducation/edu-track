import { useState } from 'react';
import Navbar from '../components/Navbar';
import AdminOverview from './AdminOverview';
import AdminGroups from './AdminGroups';
import AdminTeachers from './AdminTeachers';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'groups', label: 'All Groups' },
    { key: 'teachers', label: 'Teachers' },
];

export default function AdminApp({ token, isLight, onToggle, onLogout }) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="view active" id="v-admin-app">
            <Navbar
                isLight={isLight} onToggle={onToggle} onLogout={onLogout}
                user={{ avatar: 'A', name: 'Administrator', role: 'Admin Panel' }}
                tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}
            />
            <div style={{ flex: 1 }}>
                {activeTab === 'overview' && (
                    <div className="panel active" id="apanel-overview">
                        <div className="panel-header">
                            <div className="panel-title">ADMIN <span className="y">OVERVIEW</span></div>
                            <div className="panel-subtitle">Platform-wide statistics and summary</div>
                        </div>
                        <AdminOverview token={token} />
                    </div>
                )}
                {activeTab === 'groups' && (
                    <div className="panel active" id="apanel-groups">
                        <div className="panel-header">
                            <div className="panel-title">ALL <span className="y">GROUPS</span></div>
                            <div className="panel-subtitle">Filter and browse every group across all teachers</div>
                        </div>
                        <AdminGroups token={token} />
                    </div>
                )}
                {activeTab === 'teachers' && (
                    <div className="panel active" id="apanel-teachers">
                        <div className="panel-header">
                            <div className="panel-title">TEACHER <span className="y">PROFILES</span></div>
                            <div className="panel-subtitle">Create, manage teacher accounts and view their groups</div>
                        </div>
                        <AdminTeachers token={token} />
                    </div>
                )}
            </div>
        </div>
    );
}
