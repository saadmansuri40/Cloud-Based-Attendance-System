import React, { useState, useEffect } from 'react';
import { User, AdminNotification } from '../types';
import Sidebar from './Sidebar';
import {
    Users,
    Bell,
    Check,
    X,
    GraduationCap,
    Mail,
    Search,
    Plus,
    Trash2
} from 'lucide-react';

interface AdminDashboardProps {
    onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student' as 'student' | 'teacher',
        course: 'CSE'
    });

    useEffect(() => {
        const loadedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(loadedUsers);
        const loadedNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        setNotifications(loadedNotifications);
    }, []);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');

        if (existingUsers.find((u: User) => u.email === newUser.email)) {
            alert('Email already exists!');
            return;
        }

        const createdUser: User = {
            id: crypto.randomUUID(),
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
        };

        if (newUser.role === 'student') {
            const course = newUser.course;
            const joinYear = new Date().getFullYear();
            const yy = String(joinYear).slice(-2);
            const prefix = `${yy}${course}`;
            const siblings = existingUsers.filter((u: any) => u.role === 'student' && u.enrollmentNo?.startsWith(prefix)).length;
            const serial = String(siblings + 1).padStart(4, '0');
            const enrollmentNo = `${prefix}${serial}`;

            (createdUser as any).isFirstLogin = true;
            (createdUser as any).enrollmentNo = enrollmentNo;
            (createdUser as any).course = course;
            (createdUser as any).joinYear = joinYear;
        }

        const updatedUsers = [...existingUsers, createdUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'student', course: 'CSE' });
        alert(`Account created successfully! ${newUser.role === 'student' ? 'Enrollment No: ' + (createdUser as any).enrollmentNo : ''}`);
    };

    const handleResolveNotification = (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, status: 'resolved' as const } : n);
        setNotifications(updated);
        localStorage.setItem('adminNotifications', JSON.stringify(updated));
    };

    const handleApproveProfileChange = (notif: AdminNotification) => {
        if (!notif.requestedData?.name) return;

        // Update users array in localStorage
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = existingUsers.map((u: User) => {
            if (u.id === notif.userId) {
                return { ...u, name: notif.requestedData!.name };
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);

        // Update current user if it's the one being modified
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (currentUser && currentUser.id === notif.userId) {
            localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, name: notif.requestedData!.name }));
        }

        // Resolve notification
        handleResolveNotification(notif.id);
        alert(`Change approved! User's name is now ${notif.requestedData.name}.`);
    };

    const handleDeleteUser = (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            const updated = users.filter(u => u.id !== id);
            setUsers(updated);
            localStorage.setItem('users', JSON.stringify(updated));
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u as any).enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4 text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Students</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className="bg-green-100 p-3 rounded-lg mr-4 text-green-600">
                    <GraduationCap size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Teachers</p>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className="bg-red-100 p-3 rounded-lg mr-4 text-red-600">
                    <Bell size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Pending Requests</p>
                    <p className="text-2xl font-bold">{notifications.filter(n => n.status === 'pending').length}</p>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or enrollment no..."
                        className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 font-medium"
                >
                    <Plus size={18} /> Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Enrollment / ID</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-medium text-sm">
                                    {(user as any).enrollmentNo ?? 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-4">
            {notifications.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center text-gray-500 border border-gray-100">
                    No notifications yet.
                </div>
            ) : (
                notifications.slice().reverse().map(notif => (
                    <div key={notif.id} className={`bg-white p-5 rounded-xl border flex items-start justify-between ${notif.status === 'pending' ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 opacity-75'
                        }`}>
                        <div className="flex gap-4">
                            <div className={`p-2 rounded-lg mt-1 ${notif.status === 'pending' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{notif.userName}</p>
                                <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Mail size={12} /> {notif.userEmail}</span>
                                    {notif.enrollmentNo && <span className="flex items-center gap-1"><GraduationCap size={12} /> {notif.enrollmentNo}</span>}
                                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        {notif.status === 'pending' && (
                            <div className="flex gap-2">
                                {notif.type === 'profile_change' && (
                                    <button
                                        onClick={() => handleApproveProfileChange(notif)}
                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
                                        title="Approve Change"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleResolveNotification(notif.id)}
                                    className={`${notif.type === 'profile_change' ? 'text-gray-400 hover:text-red-500' : 'bg-green-500 text-white p-2 hover:bg-green-600'} rounded-lg transition`}
                                    title={notif.type === 'profile_change' ? "Reject/Dismiss" : "Mark as Resolved"}
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={onLogout}
                studentName="Admin"
                isOpen={false}
                toggleSidebar={() => { }}
                avatarUrl={null}
                role="admin"
            />

            <main className="flex-1 lg:ml-64 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                        <p className="text-gray-500">Manage users, accounts, and requests.</p>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {renderOverview()}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Recent Users</h3>
                            {renderUsers()}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && renderUsers()}

                {activeTab === 'notifications' && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Bell className="text-indigo-600" /> System Notifications
                        </h2>
                        {renderNotifications()}
                    </div>
                )}

                {showAddUserModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                                <h3 className="font-bold">Add New User</h3>
                                <button onClick={() => setShowAddUserModal(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                        <select
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                        </select>
                                    </div>
                                    {newUser.role === 'student' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                                                value={newUser.course}
                                                onChange={e => setNewUser({ ...newUser, course: e.target.value })}
                                            >
                                                <option value="CSE">CSE</option>
                                                <option value="ECE">ECE</option>
                                                <option value="MECH">MECH</option>
                                                <option value="CIVIL">CIVIL</option>
                                                <option value="IT">IT</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-indigo-700 transition-colors"
                                >
                                    Create Account
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
