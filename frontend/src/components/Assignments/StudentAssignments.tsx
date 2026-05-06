import { useState, useEffect, useRef } from 'react';
import { Assignment, Submission } from '../../types';
import {
    FileText, Paperclip, Calendar, BookOpen,
    Clock, CheckCircle2, AlertTriangle, Upload,
    X, Check
} from 'lucide-react';

const AS_KEY = 'assignments';
const SUB_KEY = 'submissions';

function loadAssignments(): Assignment[] {
    try { return JSON.parse(localStorage.getItem(AS_KEY) || '[]'); } catch { return []; }
}
function loadSubmissions(): Submission[] {
    try { return JSON.parse(localStorage.getItem(SUB_KEY) || '[]'); } catch { return []; }
}
function saveSubmissions(list: Submission[]) {
    localStorage.setItem(SUB_KEY, JSON.stringify(list));
}

interface Props {
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    studentCourse: string;
}

function getDueStatus(dueDate: string) {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    if (daysLeft < 0) return { label: 'Overdue', color: 'bg-red-100    text-red-700', icon: AlertTriangle };
    if (daysLeft === 0) return { label: 'Due Today', color: 'bg-orange-100 text-orange-700', icon: Clock };
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    return { label: `${daysLeft} days left`, color: 'bg-green-100  text-green-700', icon: CheckCircle2 };
}

// ── Per-assignment submission widget ─────────────────────────────────────────
function SubmitPanel({
    assignment, studentId, studentName, enrollmentNo
}: {
    assignment: Assignment;
    studentId: string; studentName: string; enrollmentNo: string;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [subs, setSubs] = useState<Submission[]>(loadSubmissions);
    const mySub = subs.find(s => s.assignmentId === assignment.id && s.studentId === studentId);

    const [file, setFile] = useState<{ name: string; data: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) {
            alert('Please upload a PDF file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => setFile({ name: f.name, data: ev.target!.result as string });
        reader.readAsDataURL(f);
    };

    const handleSubmit = () => {
        if (!file) return;
        setUploading(true);
        const newSub: Submission = {
            id: crypto.randomUUID(),
            assignmentId: assignment.id,
            studentId,
            studentName,
            enrollmentNo,
            submittedAt: new Date().toISOString(),
            fileName: file.name,
            fileData: file.data,
            status: 'pending',
        };
        const existing = loadSubmissions().filter(
            s => !(s.assignmentId === assignment.id && s.studentId === studentId)
        );
        const updated = [...existing, newSub];
        saveSubmissions(updated);
        setSubs(updated);
        setTimeout(() => { setUploading(false); setDone(true); setFile(null); }, 500);
        setTimeout(() => setDone(false), 2500);
    };

    const handleRetract = () => {
        const updated = loadSubmissions().filter(
            s => !(s.assignmentId === assignment.id && s.studentId === studentId)
        );
        saveSubmissions(updated);
        setSubs(updated);
        setFile(null);
        setDone(false);
    };

    if (mySub) {
        const isApproved = mySub.status === 'approved';
        return (
            <div className={`mt-4 p-4 border rounded-xl flex items-center justify-between gap-4 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3">
                    {isApproved ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                        <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                    )}
                    <div>
                        <p className={`text-sm font-semibold ${isApproved ? 'text-green-800' : 'text-yellow-800'}`}>
                            {isApproved ? 'Approved ✓' : 'Review Pending ⏳'}
                        </p>
                        <p className={`text-xs mt-0.5 ${isApproved ? 'text-green-600' : 'text-yellow-700'}`}>
                            {mySub.fileName} &nbsp;·&nbsp; {new Date(mySub.submittedAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a
                        href={mySub.fileData}
                        download={mySub.fileName}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 border ${isApproved ? 'text-green-700 bg-green-100 hover:bg-green-200 border-green-300' : 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 border-yellow-300'}`}
                    >
                        <Paperclip className="w-3.5 h-3.5" /> View
                    </a>
                    {!isApproved && (
                        <button
                            onClick={handleRetract}
                            className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" /> Retract
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">📤 Submit Your Assignment</p>
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-700 hover:border-indigo-500 hover:bg-indigo-100 transition font-medium"
                >
                    <Upload className="w-4 h-4" />
                    {file ? file.name : 'Choose PDF file'}
                </button>
                {file && (
                    <>
                        <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                            className="text-gray-400 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
                        <button
                            onClick={handleSubmit}
                            disabled={uploading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${done ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                                }`}
                        >
                            {done ? <><Check className="w-4 h-4" /> Submitted!</> : uploading ? 'Uploading…' : <><Upload className="w-4 h-4" /> Submit</>}
                        </button>
                    </>
                )}
            </div>
            <p className="text-xs text-indigo-500">Only PDF files accepted. Max recommended: 20 MB.</p>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudentAssignments({ studentId, studentName, enrollmentNo, studentCourse }: Props) {
    const [all, setAll] = useState<Assignment[]>(loadAssignments);
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const mine = all.filter(a => a.sections.includes(studentCourse));
    const now = new Date();

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === AS_KEY) setAll(loadAssignments());
        };
        window.addEventListener('storage', onStorage);
        const interval = setInterval(() => setAll(loadAssignments()), 5000);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
    }, []);

    const visible = mine.filter(a => {
        if (filter === 'overdue') return new Date(a.dueDate) < now;
        if (filter === 'pending') return new Date(a.dueDate) >= now;
        return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Assignments</h2>
                        <p className="text-xs text-gray-500">{mine.length} assignment{mine.length !== 1 ? 's' : ''} for {studentCourse}</p>
                    </div>
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'pending', 'overdue'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                }`}>{f}</button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', count: mine.length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
                    { label: 'Pending', count: mine.filter(a => new Date(a.dueDate) >= now).length, color: 'text-green-600', bg: 'bg-green-50  border-green-200' },
                    { label: 'Overdue', count: mine.filter(a => new Date(a.dueDate) < now).length, color: 'text-red-600', bg: 'bg-red-50    border-red-200' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} className={`rounded-xl border ${bg} p-4 text-center`}>
                        <p className={`text-2xl font-bold ${color}`}>{count}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Cards */}
            {visible.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">{mine.length === 0 ? 'No assignments posted for your section yet' : 'No assignments match this filter'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visible.map(a => {
                        const isExpanded = expandedId === a.id;
                        const due = new Date(a.dueDate);
                        const status = getDueStatus(a.dueDate);
                        const StatusIcon = status.icon;
                        const subs = loadSubmissions();
                        const mySub = subs.find(s => s.assignmentId === a.id && s.studentId === studentId);

                        return (
                            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div
                                    className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                                >
                                    <div className={`w-1 self-stretch rounded-full shrink-0 ${due < now ? 'bg-red-400' : 'bg-violet-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-gray-900">{a.title}</p>
                                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{a.subject}</span>
                                            {mySub && mySub.status === 'approved' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Check className="w-3 h-3" />Approved</span>}
                                            {mySub && mySub.status !== 'approved' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />Review Pending</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Due: <strong className="text-gray-700">{due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                                            </span>
                                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />By {a.postedBy}</span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" />{status.label}
                                            </span>
                                            {a.attachmentName && <span className="flex items-center gap-1 text-violet-600"><Paperclip className="w-3.5 h-3.5" />Attachment</span>}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-gray-400 mt-1 text-sm">{isExpanded ? '▲' : '▼'}</span>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50 space-y-4">
                                        {a.description ? (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Instructions</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{a.description}</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No additional instructions provided.</p>
                                        )}

                                        {a.attachmentName && a.attachmentData && (
                                            <a href={a.attachmentData} download={a.attachmentName}
                                                className="inline-flex items-center gap-2 text-sm text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-4 py-2.5 rounded-xl transition font-medium">
                                                <Paperclip className="w-4 h-4" />Download: {a.attachmentName}
                                            </a>
                                        )}

                                        {/* ── Submission panel ── */}
                                        <SubmitPanel
                                            assignment={a}
                                            studentId={studentId}
                                            studentName={studentName}
                                            enrollmentNo={enrollmentNo}
                                        />

                                        <p className="text-xs text-gray-400">
                                            Posted {new Date(a.postedAt).toLocaleString('en-IN')} by {a.postedBy}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
