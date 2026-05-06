import React, { useEffect, useState } from 'react';
import { Timetable } from '../../types';

interface TimeTableProps {
    studentId: string;
}

export default function TimeTable({ studentId }: TimeTableProps) {
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch timetable from backend
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/student/${studentId}/timetable`)
            .then(res => res.json())
            .then(data => {
                setTimetable(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch timetable", err);
                setLoading(false);
            });
    }, [studentId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading timetable...</div>;
    if (!timetable) return <div className="p-8 text-center text-red-500">Failed to load timetable.</div>;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Weekly Timetable</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {days.map((day) => (
                            <tr key={day}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50 w-32">
                                    {day}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-4">
                                        {timetable[day]?.map((entry, idx) => (
                                            <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 min-w-[200px]">
                                                <p className="font-bold text-indigo-700 text-sm">{entry.subject}</p>
                                                <p className="text-xs text-gray-500 mt-1">{entry.time}</p>
                                                <p className="text-xs text-gray-500">{entry.location}</p>
                                            </div>
                                        )) || <span className="text-gray-400 italic">No classes</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
