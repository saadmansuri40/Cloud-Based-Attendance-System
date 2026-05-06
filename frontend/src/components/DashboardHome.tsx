import { Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { StudentDetails } from '../types';

interface DashboardHomeProps {
    studentName: string;
    studentDetails: StudentDetails | null;
}

export default function DashboardHome({ studentName, studentDetails }: DashboardHomeProps) {
    // Use fallback values if the details endpoint is unavailable
    const attendance = studentDetails?.attendance_percentage ?? 85;
    const cgpa = studentDetails?.cgpa ?? 8.4;
    const semester = studentDetails?.semester ?? 1;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Welcome back, {studentName}! 👋</h2>
                <p className="text-gray-500 mt-1">Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Attendance</h3>
                        <div className="p-2 bg-indigo-50 rounded-full">
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{attendance}%</p>
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        On track
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">CGPA</h3>
                        <div className="p-2 bg-orange-50 rounded-full">
                            <BookOpen className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{cgpa}</p>
                    <p className="text-xs text-gray-500 mt-2">Semester {semester}</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Next Class</h3>
                        <div className="p-2 bg-blue-50 rounded-full">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">Data Structures</p>
                    <p className="text-sm text-gray-500 mt-1">10:00 AM • Room 301</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Pending Fees</h3>
                        <div className="p-2 bg-red-50 rounded-full">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">₹1,500</p>
                    <p className="text-xs text-red-600 mt-2">Due in 5 days</p>
                </div>
            </div>

            {/* Announcements Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Announcements & Notices
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {[
                        {
                            type: 'Exam Alert',
                            title: 'Mid-Semester Examinations Schedule Released',
                            date: 'Today',
                            desc: 'The timetable for the upcoming mid-semester examinations has been published. Hall tickets will be available soon.',
                            color: 'text-red-600',
                            bg: 'bg-red-50'
                        },
                        {
                            type: 'College Notice',
                            title: 'Annual Tech Fest "TechNova 2026"',
                            date: 'Yesterday',
                            desc: 'Registrations are now open for all events. Visit the student council desk to participate.',
                            color: 'text-indigo-600',
                            bg: 'bg-indigo-50'
                        },
                        {
                            type: 'Holiday',
                            title: 'Public Holiday - Independence Day',
                            date: '2 Days Ago',
                            desc: 'The college will remain closed on August 15th. Regular classes will resume the following day.',
                            color: 'text-green-600',
                            bg: 'bg-green-50'
                        }
                    ].map((notice, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row gap-4">
                            <div className="shrink-0">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${notice.bg} ${notice.color}`}>
                                    {notice.type}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                    <h4 className="text-md font-bold text-gray-900">{notice.title}</h4>
                                    <span className="text-xs font-semibold text-gray-400">{notice.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{notice.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
