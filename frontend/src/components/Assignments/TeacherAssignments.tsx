import { useState, useRef, useEffect } from 'react';
import { Assignment, Submission } from '../../types';
import {
    Plus, Trash2, Paperclip, Send, BookOpen, X,
    Calendar, Users, FileText, ChevronDown, ChevronUp,
    Inbox, Download, Eye, CheckCircle2, Clock, Check
} from 'lucide-react';

const COURSES = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EE', 'IT', 'MBA', 'MCA'];
const SUBJECTS = [
    'Data Structures & Algorithms', 'Mathematics', 'Physics',
    'C Programming', 'English', 'Computer Networks', 'Operating Systems',
    'Database Management', 'Software Engineering', 'Machine Learning', 'Other',
];

const AS_KEY = 'assignments';
const SUB_KEY = 'submissions';

function loadAssignments(): Assignment[] {
    try { return JSON.parse(localStorage.getItem(AS_KEY) || '[]'); } catch { return []; }
}
function saveAssignments(list: Assignment[]) { localStorage.setItem(AS_KEY, JSON.stringify(list)); }
function loadSubmissions(): Submission[] {
    try { return JSON.parse(localStorage.getItem(SUB_KEY) || '[]'); } catch { return []; }
}
function saveSubmissions(list: Submission[]) {
    localStorage.setItem(SUB_KEY, JSON.stringify(list));
}

interface Props { teacherName: string; }

// ── Submissions viewer panel ──────────────────────────────────────────────────
function SubmissionsPanel({ assignmentId }: { assignmentId: string }) {
    const [subs, setSubs] = useState<Submission[]>(() =>
        loadSubmissions().filter(s => s.assignmentId === assignmentId)
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setSubs(loadSubmissions().filter(s => s.assignmentId === assignmentId));
        }, 4000);
        return () => clearInterval(interval);
    }, [assignmentId]);

    const handleApprove = (submissionId: string) => {
        const allSubs = loadSubmissions();
        const updatedSubs = allSubs.map(s => {
            if (s.id === submissionId) {
                return { ...s, status: 'approved' as const };
            }
            return s;
        });
        saveSubmissions(updatedSubs);
        setSubs(updatedSubs.filter(s => s.assignmentId === assignmentId));
    };

    if (subs.length === 0) {
        return (
            <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No submissions yet</p>
            </div>
        );
    }

    return (
        <>
            {/* PDF Preview modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <p className="font-semibold text-gray-900 truncate">{previewName}</p>
                            <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-gray-700 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <iframe
                            src={previewUrl}
                            className="flex-1 w-full"
                            title={previewName}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {subs.length} Submission{subs.length !== 1 ? 's' : ''}
                </p>
        {subs.map(s => {
            const isApproved = s.status === 'approved';
            return (
                <div key={s.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 bg-white border rounded-xl hover:border-violet-300 transition ${isApproved ? 'border-green-200' : 'border-gray-200'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isApproved ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isApproved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{s.studentName}</p>
                            {isApproved ? (
                                <span className="text-[10px] font-bold tracking-wider uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>
                            ) : (
                                <span className="text-[10px] font-bold tracking-wider uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">{s.enrollmentNo} &nbsp;·&nbsp; {s.fileName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Submitted {new Date(s.submittedAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0 mt-2 sm:mt-0">
                        {!isApproved && (
                            <button
                                onClick={() => handleApprove(s.id)}
                                className="flex items-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-700 border border-green-700 px-3 py-1.5 rounded-lg transition font-bold shadow-sm"
                                title="Approve Submission"
                            >
                                <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                        )}
                        <button
                            onClick={() => { setPreviewUrl(s.fileData); setPreviewName(`${s.studentName} — ${s.fileName}`); }}
                            className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-lg transition font-medium"
                            title="Preview PDF"
                        >
                            <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <a
                            href={s.fileData}
                            download={`${s.enrollmentNo}_${s.fileName}`}
                            className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-lg transition font-medium"
                            title="Download PDF"
                        >
                            <Download className="w-3.5 h-3.5" /> Download
                        </a>
                    </div>
                </div>
            );
        })}
            </div>
        </>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TeacherAssignments({ teacherName }: Props) {
    const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
    const [showForm, setShowForm] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewSubsId, setViewSubsId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState(SUBJECTS[0]);
    const [dueDate, setDueDate] = useState('');
    const [sections, setSections] = useState<string[]>([]);
    const [file, setFile] = useState<{ name: string; data: string } | null>(null);
    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === AS_KEY) setAssignments(loadAssignments());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggleSection = (c: string) =>
        setSections(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = ev => setFile({ name: f.name, data: ev.target!.result as string });
        reader.readAsDataURL(f);
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setSubject(SUBJECTS[0]);
        setDueDate(''); setSections([]); setFile(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handlePost = () => {
        if (!title.trim() || !dueDate || sections.length === 0) return;
        setPosting(true);
        const newA: Assignment = {
            id: crypto.randomUUID(),
            title: title.trim(),
            description: description.trim(),
            subject,
            sections,
            dueDate,
            postedBy: teacherName,
            postedAt: new Date().toISOString(),
            ...(file ? { attachmentName: file.name, attachmentData: file.data } : {}),
        };
        const updated = [newA, ...assignments];
        saveAssignments(updated);
        setAssignments(updated);
        resetForm();
        setTimeout(() => { setPosting(false); setPosted(true); }, 400);
        setTimeout(() => { setPosted(false); setShowForm(false); }, 1800);
    };

    const handleDelete = (id: string) => {
        const updated = assignments.filter(a => a.id !== id);
        saveAssignments(updated);
        setAssignments(updated);
        if (expandedId === id) setExpandedId(null);
        if (viewSubsId === id) setViewSubsId(null);
    };

    const isValid = title.trim() && dueDate && sections.length > 0;

    // submission counts
    const allSubs = loadSubmissions();
    const subCount = (id: string) => allSubs.filter(s => s.assignmentId === id).length;

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
                        <p className="text-xs text-gray-500">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} posted</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(f => !f); resetForm(); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-violet-600 hover:bg-violet-700 text-white shadow'
                        }`}
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Assignment'}
                </button>
            </div>

            {/* ── Post form ── */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-violet-200 p-6 space-y-5">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-600" /> New Assignment
                    </h3>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title *</label>
                        <input value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Linked List Implementation"
                            className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject *</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)}
                                className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date *</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description / Instructions</label>
                        <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Write assignment details, submission format, references…"
                            className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                            Assign to Sections * (select at least one)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COURSES.map(c => (
                                <button key={c} type="button" onClick={() => toggleSection(c)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sections.includes(c)
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400'
                                        }`}>{c}</button>
                            ))}
                        </div>
                        {sections.length > 0 && (
                            <p className="text-xs text-violet-600 mt-1.5 font-medium">Selected: {sections.join(', ')}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Attachment (optional)</label>
                        <div className="mt-1 flex items-center gap-3">
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-violet-400 hover:text-violet-600 transition">
                                <Paperclip className="w-4 h-4" />{file ? file.name : 'Attach a file'}
                            </button>
                            {file && <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                        </div>
                        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
                    </div>

                    <button onClick={handlePost} disabled={!isValid || posting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${posted ? 'bg-green-500 text-white'
                                : isValid ? 'bg-violet-600 hover:bg-violet-700 text-white shadow'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}>
                        {posted ? '✓ Posted!' : posting ? 'Posting…' : <><Send className="w-4 h-4" /> Post Assignment</>}
                    </button>
                </div>
            )}

            {/* ── Assignment list ── */}
            {assignments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No assignments yet</p>
                    <p className="text-sm mt-1">Click "New Assignment" to post your first one</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map(a => {
                        const isExpanded = expandedId === a.id;
                        const viewSubs = viewSubsId === a.id;
                        const due = new Date(a.dueDate);
                        const now = new Date();
                        const isOverdue = due < now;
                        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
                        const sc = subCount(a.id);

                        return (
                            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Assignment row */}
                                <div
                                    className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedId(isExpanded ? null : a.id)}
                                >
                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <FileText className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{a.subject}</span>
                                            {sc > 0 && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                                    {sc} submission{sc !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Due: <strong className={isOverdue ? 'text-red-600' : 'text-gray-700'}>
                                                    {due.toLocaleDateString()}
                                                </strong>
                                                {!isOverdue && <span className="text-gray-400">({daysLeft}d left)</span>}
                                                {isOverdue && <span className="text-red-500">(Overdue)</span>}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />{a.sections.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(a.id); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Delete assignment"
                                        ><Trash2 className="w-4 h-4" /></button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expanded: details + submissions toggle */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-gray-50 space-y-4">
                                        {a.description && (
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{a.description}</p>
                                        )}
                                        {a.attachmentName && a.attachmentData && (
                                            <a href={a.attachmentData} download={a.attachmentName}
                                                className="inline-flex items-center gap-2 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-2 rounded-lg transition font-medium">
                                                <Paperclip className="w-3.5 h-3.5" />{a.attachmentName}
                                            </a>
                                        )}

                                        {/* View submissions toggle */}
                                        <div className="pt-2 border-t border-gray-200">
                                            <button
                                                onClick={() => setViewSubsId(viewSubs ? null : a.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition w-full sm:w-auto justify-center sm:justify-start ${viewSubs
                                                        ? 'bg-gray-200 text-gray-700'
                                                        : 'bg-violet-600 text-white hover:bg-violet-700 shadow'
                                                    }`}
                                            >
                                                <Inbox className="w-4 h-4" />
                                                {viewSubs ? 'Hide Submissions' : `View Submissions (${sc})`}
                                            </button>

                                            {viewSubs && (
                                                <div className="mt-4">
                                                    <SubmissionsPanel assignmentId={a.id} />
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-gray-400">Posted {new Date(a.postedAt).toLocaleString()} by {a.postedBy}</p>
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
