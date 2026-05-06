import { useState, useEffect } from 'react';
import {
    Home,
    Calendar,
    BookOpen,
    CreditCard,
    Library,
    User,
    LogOut,
    Camera,
    FileText,
    Ticket,
    Shield,
    Users,
    Bell,
    Briefcase
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    studentName: string;
    isOpen: boolean;
    toggleSidebar: () => void;
    avatarUrl?: string | null;
    role?: UserRole;
}

export default function Sidebar({
    activeTab,
    setActiveTab,
    onLogout,
    studentName,
    isOpen,
    toggleSidebar,
    avatarUrl,
    role,
}: SidebarProps) {

    // ── Hall Ticket gating ─────────────────────────────────────────────────
    const [htReleased, setHtReleased] = useState(() => {
        try {
            const c = JSON.parse(localStorage.getItem('hallTicketConfig') || '{}');
            return !!c.released;
        } catch { return false; }
    });

    useEffect(() => {
        const check = () => {
            try {
                const c = JSON.parse(localStorage.getItem('hallTicketConfig') || '{}');
                // Also auto-check scheduled time
                if (!c.released && c.scheduledAt && new Date(c.scheduledAt) <= new Date()) {
                    setHtReleased(true);
                } else {
                    setHtReleased(!!c.released);
                }
            } catch { setHtReleased(false); }
        };
        check();
        const interval = setInterval(check, 15000);
        const onStorage = (e: StorageEvent) => { if (e.key === 'hallTicketConfig') check(); };
        window.addEventListener('storage', onStorage);
        return () => { clearInterval(interval); window.removeEventListener('storage', onStorage); };
    }, []);

    const menuItems = role === 'admin' ? [
        { id: 'overview', label: 'Admin Overview', icon: Shield },
        { id: 'users', label: 'Manage Users', icon: Users },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'profile', label: 'My Profile', icon: User },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'attendance', label: 'Attendance', icon: Camera },
        { id: 'timetable', label: 'Time Table', icon: Calendar },
        { id: 'marks', label: 'Marks & Results', icon: BookOpen },
        { id: 'fees', label: 'Fee Status', icon: CreditCard },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        ...(htReleased ? [{ id: 'hall-ticket', label: 'Hall Ticket', icon: Ticket }] : []),
        { id: 'library', label: 'Library', icon: Library },
        { id: 'careers', label: 'Careers & Jobs', icon: Briefcase },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const initials = studentName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 h-full bg-white shadow-xl z-30 transition-transform duration-300 ease-in-out w-64
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="h-16 flex items-center justify-center border-b border-gray-200">
                        <h1 className="text-xl font-bold text-indigo-600">
                            {role === 'admin' ? 'Admin Portal' : role === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
                        </h1>
                    </div>

                    {/* User Info */}
                    <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                        {/* Avatar */}
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-200 mb-3 shadow"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow">
                                {initials}
                            </div>
                        )}
                        <p className="font-semibold text-gray-800">{studentName}</p>
                        <p className="text-xs text-gray-500 capitalize">{role || 'Student'}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (window.innerWidth < 1024) toggleSidebar();
                                    }}
                                    className={`
                                        w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                        ${activeTab === item.id
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                                >
                                    <Icon className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
