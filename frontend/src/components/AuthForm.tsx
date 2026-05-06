import React, { useState } from 'react';
import { UserRole, AdminNotification } from '../types';
import { UserCircle2, Mail, Lock, GraduationCap, User as UserIcon, Users } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (data: { identifier: string; password: string; name?: string; role?: UserRole; course?: string; loginType: 'email' | 'enrollmentNo' }) => void;
}

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loginType, setLoginType] = useState<'email' | 'enrollmentNo'>('enrollmentNo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'signup') {
      onSubmit({ identifier, password, name, role, loginType: 'email' });
    } else {
      onSubmit({ identifier, password, loginType });
    }
  };

  const handleForgotPassword = () => {
    if (!identifier) {
      alert('Please enter your Enrollment Number / Email first.');
      return;
    }

    const confirmReset = window.confirm(`Request password reset for ${identifier}? This will notify the admin.`);
    if (confirmReset) {
      const notifications: AdminNotification[] = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === identifier || u.enrollmentNo === identifier);

      const newNotification: AdminNotification = {
        id: crypto.randomUUID(),
        type: 'password_reset',
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || identifier,
        enrollmentNo: user?.enrollmentNo,
        message: `User ${user?.name || identifier} requested a password reset.`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('adminNotifications', JSON.stringify([...notifications, newNotification]));
      alert('Password reset request sent to Admin. Please wait for them to contact you.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center mb-8">
        {type === 'login' ? (
          <div className="bg-indigo-100 p-3 rounded-full">
            <UserCircle2 size={40} className="text-indigo-600" />
          </div>
        ) : (
          <div className="bg-green-100 p-3 rounded-full">
            <Users size={40} className="text-green-600" />
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        {type === 'login' ? ' Welcome Back!' : 'Create Your Account'}
      </h2>

      {type === 'login' && (
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setLoginType('enrollmentNo')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'enrollmentNo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Enrollment No
          </button>
          <button
            onClick={() => setLoginType('email')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${loginType === 'email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Email Admin/Teacher
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'signup' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </>
        )}

        {type === 'login' && loginType === 'enrollmentNo' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. 22CSE0001"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        {type === 'login' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${type === 'login'
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          {type === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}