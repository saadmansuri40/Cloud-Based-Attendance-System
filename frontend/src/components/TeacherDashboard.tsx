import { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import {
  LogOut, UserCircle, Users, CheckCircle2, XCircle,
  RefreshCw, RotateCcw, BookOpen, Save, ChevronDown, ChevronUp, Award, FileText, Ticket
} from 'lucide-react';
import AvatarPicker, { getAvatar } from './AvatarPicker';
import TeacherAssignments from './Assignments/TeacherAssignments';
import HallTicketControl from './Admin/HallTicketControl';

interface TeacherDashboardProps {
  teacher: User;
  onLogout: () => void;
}

// ── Marks types ───────────────────────────────────────────────────────────────
const SUBJECTS = ['Data Structures', 'Mathematics I', 'Physics', 'C Programming', 'English'];
const MAX_MARKS = 100;

interface StudentMark {
  subject: string;
  marks: string;   // string so input stays controlled
  grade: string;
}
interface StudentMarksRecord {
  studentId: string;
  studentName: string;
  marks: StudentMark[];
}

function calcGrade(m: number): string {
  if (m >= 90) return 'O';
  if (m >= 80) return 'A+';
  if (m >= 70) return 'A';
  if (m >= 60) return 'B+';
  if (m >= 50) return 'B';
  if (m >= 40) return 'C';
  return 'F';
}

const GRADE_COLOR: Record<string, string> = {
  O: 'bg-purple-100 text-purple-800',
  'A+': 'bg-green-100 text-green-800',
  A: 'bg-green-100 text-green-800',
  'B+': 'bg-blue-100 text-blue-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  F: 'bg-red-100 text-red-800',
};

function defaultMarks(studentId: string, studentName: string): StudentMarksRecord {
  return {
    studentId,
    studentName,
    marks: SUBJECTS.map(subject => ({ subject, marks: '', grade: '' })),
  };
}

function loadMarksDb(): Record<string, StudentMarksRecord> {
  try { return JSON.parse(localStorage.getItem('marksDb') || '{}'); }
  catch { return {}; }
}
function saveMarksDb(db: Record<string, StudentMarksRecord>) {
  localStorage.setItem('marksDb', JSON.stringify(db));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TeacherDashboard({ teacher, onLogout }: TeacherDashboardProps) {
  const [tab, setTab] = useState<'attendance' | 'marks' | 'assignments' | 'hall-ticket' | 'profile'>('attendance');
  const [isAttendanceActive, setIsAttendanceActive] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dpUrl, setDpUrl] = useState<string | null>(getAvatar(teacher.id));

  // Marks state
  const [marksDb, setMarksDb] = useState<Record<string, StudentMarksRecord>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadAttendanceRecords = () => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    setAttendanceRecords(records);
    setIsAttendanceActive(localStorage.getItem('attendanceStatus') === 'active');
  };

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const studentList: User[] = users.filter((u: User) => u.role === 'student');
    setStudents(studentList);
    loadAttendanceRecords();

    // Load or initialise marks DB
    const db = loadMarksDb();
    studentList.forEach(s => { if (!db[s.id]) db[s.id] = defaultMarks(s.id, s.name); });
    setMarksDb(db);

    const interval = setInterval(loadAttendanceRecords, 3000);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'attendanceRecords' || e.key === 'attendanceStatus') loadAttendanceRecords();
      if (e.key === 'users') {
        const updated = JSON.parse(e.newValue || '[]');
        setStudents(updated.filter((u: User) => u.role === 'student'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => { clearInterval(interval); window.removeEventListener('storage', handleStorage); };
  }, []);

  // ── Attendance helpers ────────────────────────────────────────────────────
  const toggleAttendance = () => {
    const next = !isAttendanceActive;
    setIsAttendanceActive(next);
    localStorage.setItem('attendanceStatus', next ? 'active' : 'inactive');
    if (!next) {
      const today = new Date().toLocaleDateString();
      const current: AttendanceRecord[] = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const present = new Set(current.filter(r => r.date === today).map(r => r.studentId));
      const absent: AttendanceRecord[] = students
        .filter(s => !present.has(s.id))
        .map(s => ({ date: today, studentId: s.id, studentName: s.name, status: 'absent', timestamp: new Date().toISOString() }));
      const updated = [...current, ...absent];
      localStorage.setItem('attendanceRecords', JSON.stringify(updated));
      setAttendanceRecords(updated);
    }
  };

  const getStudentStatus = (id: string) => {
    const today = new Date().toLocaleDateString();
    const recs = attendanceRecords.filter(r => r.studentId === id && r.date === today);
    if (!recs.length) return 'pending';
    return recs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].status;
  };

  const refreshAttendance = () => { setRefreshing(true); loadAttendanceRecords(); setTimeout(() => setRefreshing(false), 1000); };
  const resetAttendance = () => {
    if (!window.confirm('Reset all attendance for today?')) return;
    setResetting(true);
    const today = new Date().toLocaleDateString();
    const filtered = attendanceRecords.filter(r => r.date !== today);
    localStorage.setItem('attendanceRecords', JSON.stringify(filtered));
    setAttendanceRecords(filtered);
    setTimeout(() => { setResetting(false); loadAttendanceRecords(); }, 1000);
  };

  // ── Marks helpers ─────────────────────────────────────────────────────────
  const updateMark = (studentId: string, subjectIdx: number, value: string) => {
    const raw = Math.min(MAX_MARKS, Math.max(0, parseInt(value) || 0));
    const strVal = value === '' ? '' : String(raw);
    setMarksDb(prev => {
      const rec = { ...prev[studentId] };
      const marks = [...rec.marks];
      marks[subjectIdx] = {
        ...marks[subjectIdx],
        marks: strVal,
        grade: strVal !== '' ? calcGrade(raw) : '',
      };
      return { ...prev, [studentId]: { ...rec, marks } };
    });
  };

  const saveStudentMarks = (studentId: string) => {
    const db = loadMarksDb();
    db[studentId] = marksDb[studentId];
    saveMarksDb(db);
    setSavedStudents(prev => new Set(prev).add(studentId));
    setTimeout(() => setSavedStudents(prev => { const n = new Set(prev); n.delete(studentId); return n; }), 2000);
  };

  const totalPresent = students.filter(s => getStudentStatus(s.id) === 'present').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              {/* Avatar in navbar */}
              {dpUrl ? (
                <img src={dpUrl} alt="Teacher" className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200" />
              ) : (
                <UserCircle size={24} className="text-indigo-600" />
              )}
              <span className="font-semibold text-gray-900">{teacher.name}</span>
              <span className="hidden sm:inline text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Teacher</span>
            </div>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors text-sm">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6 w-fit">
          <button
            onClick={() => setTab('attendance')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'attendance' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users size={16} /> Attendance
          </button>
          <button
            onClick={() => setTab('marks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'marks' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BookOpen size={16} /> Marks Entry
          </button>
          <button
            onClick={() => setTab('assignments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'assignments' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <FileText size={16} /> Assignments
          </button>
          <button
            onClick={() => setTab('hall-ticket')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'hall-ticket' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Ticket size={16} /> Hall Ticket
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <UserCircle size={16} /> Profile
          </button>
        </div>

        {/* ── Hall Ticket Tab ── */}
        {tab === 'hall-ticket' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Hall Ticket Release Control</h2>
                <p className="text-xs text-gray-500">Control when students can access their admit cards</p>
              </div>
            </div>
            <HallTicketControl />
          </div>
        )}

        {/* ── Assignments Tab ── */}
        {tab === 'assignments' && (
          <TeacherAssignments teacherName={teacher.name} />
        )}

        {/* ── Attendance Tab ── */}
        {tab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Users size={20} /> Student Attendance</h2>
                <p className="text-sm text-gray-500 mt-0.5">{totalPresent} / {students.length} present today</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={refreshAttendance} disabled={refreshing}
                  className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </button>
                <button onClick={resetAttendance} disabled={resetting}
                  className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <RotateCcw size={16} className={resetting ? 'animate-spin' : ''} /> Reset
                </button>
                <button onClick={toggleAttendance}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${isAttendanceActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                  {isAttendanceActive ? 'Stop Attendance' : 'Start Attendance'}
                </button>
              </div>
            </div>

            {isAttendanceActive && (
              <div className="mx-6 mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg text-sm text-yellow-700">
                ⚡ Attendance is <strong>active</strong> — students can mark their attendance now.
              </div>
            )}

            <div className="overflow-x-auto mt-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const status = getStudentStatus(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 text-sm font-medium ${status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {status === 'present' ? <CheckCircle2 size={18} /> : status === 'absent' ? <XCircle size={18} /> : '⏳'}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Marks Tab ── */}
        {tab === 'marks' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Award size={20} className="text-indigo-600" /> Marks Entry</h2>
                <p className="text-sm text-gray-500 mt-0.5">Click a student to enter or update their marks. Grades are calculated automatically.</p>
              </div>
              <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">Semester 1</span>
            </div>

            {/* Subject legend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Grade Scale</p>
              <div className="flex flex-wrap gap-2">
                {[['O', '90+'], ['A+', '80-89'], ['A', '70-79'], ['B+', '60-69'], ['B', '50-59'], ['C', '40-49'], ['F', '<40']].map(([g, r]) => (
                  <span key={g} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${GRADE_COLOR[g] ?? ''}`}>{g} ({r})</span>
                ))}
              </div>
            </div>

            {/* Per-student accordion */}
            {students.map(student => {
              const rec = marksDb[student.id] ?? defaultMarks(student.id, student.name);
              const isOpen = expandedStudent === student.id;
              const filled = rec.marks.filter(m => m.marks !== '').length;
              const isSaved = savedStudents.has(student.id);

              return (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedStudent(isOpen ? null : student.id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${filled === SUBJECTS.length ? 'bg-green-100 text-green-700' : filled > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {filled}/{SUBJECTS.length} subjects filled
                      </span>
                      {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded marks form */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-6 py-5">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <th className="pb-3 pr-4">Subject</th>
                              <th className="pb-3 pr-4 w-36">Marks (/ {MAX_MARKS})</th>
                              <th className="pb-3">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rec.marks.map((m, idx) => (
                              <tr key={m.subject}>
                                <td className="py-3 pr-4 text-sm font-medium text-gray-800">{m.subject}</td>
                                <td className="py-3 pr-4">
                                  <input
                                    type="number"
                                    min={0}
                                    max={MAX_MARKS}
                                    placeholder="—"
                                    value={m.marks}
                                    onChange={e => updateMark(student.id, idx, e.target.value)}
                                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                  />
                                </td>
                                <td className="py-3">
                                  {m.grade
                                    ? <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${GRADE_COLOR[m.grade] ?? 'bg-gray-100 text-gray-600'}`}>{m.grade}</span>
                                    : <span className="text-gray-300 text-sm">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-gray-400">Enter marks 0–{MAX_MARKS}. Grade auto-calculates on input.</p>
                        <button
                          onClick={() => saveStudentMarks(student.id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isSaved
                            ? 'bg-green-500 text-white scale-95'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                          {isSaved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Marks</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {students.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>No students found. Students will appear here once they register.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cover */}
              <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
              <div className="px-8 pb-8">
                <div className="-mt-14 mb-4">
                  <AvatarPicker
                    userId={teacher.id}
                    name={teacher.name}
                    size="lg"
                    onAvatarChange={url => setDpUrl(url)}
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
                <p className="text-indigo-600 font-medium text-sm mt-0.5">Teacher</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Teacher ID', value: teacher.id },
                    { label: 'Email', value: teacher.email },
                    { label: 'Role', value: 'Faculty / Teacher' },
                    { label: 'Department', value: 'Computer Science' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-base font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}