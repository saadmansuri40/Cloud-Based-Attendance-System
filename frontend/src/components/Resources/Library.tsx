import { useState } from 'react';
import { BookOpen, ExternalLink, Search, BookMarked, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface LibraryProps { studentId: string; }

// ─── Digital books catalogue ──────────────────────────────────────────────────
interface DigitalBook {
    title: string;
    author: string;
    description: string;
    url: string;
    type: 'PDF' | 'Web' | 'EPUB';
    pages?: string;
}

interface Subject {
    name: string;
    color: string;          // Tailwind bg class for the accent chip
    icon: string;           // emoji
    books: DigitalBook[];
}

const SUBJECTS: Subject[] = [
    {
        name: 'Data Structures & Algorithms',
        color: 'bg-indigo-100 text-indigo-700',
        icon: '🧩',
        books: [
            {
                title: 'Open Data Structures (C++ Edition)',
                author: 'Pat Morin',
                description: 'A free, open-source textbook covering linked lists, trees, hash tables, graphs and more.',
                url: 'https://opendatastructures.org/ods-cpp.pdf',
                type: 'PDF', pages: '336',
            },
            {
                title: 'Algorithms — Jeff Erickson',
                author: 'Jeff Erickson',
                description: 'Comprehensive algorithms textbook freely available from UIUC.',
                url: 'https://jeffe.cs.illinois.edu/teaching/algorithms/book/Algorithms-JeffE.pdf',
                type: 'PDF', pages: '472',
            },
            {
                title: 'Introduction to Algorithms (MIT OCW Notes)',
                author: 'CLRS / MIT',
                description: 'Lecture notes and problem sets from MIT 6.006.',
                url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/',
                type: 'Web',
            },
        ],
    },
    {
        name: 'Mathematics',
        color: 'bg-purple-100 text-purple-700',
        icon: '📐',
        books: [
            {
                title: 'Calculus (OpenStax)',
                author: 'OpenStax',
                description: 'Free peer-reviewed calculus textbook covering limits, derivatives, integrals, and series.',
                url: 'https://openstax.org/books/calculus-volume-1/pages/preface',
                type: 'Web',
            },
            {
                title: 'Linear Algebra Done Right',
                author: 'Sheldon Axler',
                description: 'Open-access edition of the popular linear algebra text. Clear, proof-based approach.',
                url: 'https://linear.axler.net/LinearAbridged.pdf',
                type: 'PDF', pages: '260',
            },
            {
                title: 'Discrete Mathematics — MIT OCW',
                author: 'MIT OpenCourseWare',
                description: 'Lecture notes for MIT 6.042J: Mathematics for Computer Science.',
                url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/pages/readings/',
                type: 'Web',
            },
            {
                title: 'Probability & Statistics (OpenStax)',
                author: 'OpenStax',
                description: 'Introductory probability and statistics with real-world examples.',
                url: 'https://openstax.org/books/introductory-statistics/pages/preface',
                type: 'Web',
            },
        ],
    },
    {
        name: 'Physics',
        color: 'bg-blue-100 text-blue-700',
        icon: '⚛️',
        books: [
            {
                title: 'University Physics (OpenStax)',
                author: 'OpenStax',
                description: 'Vol. 1–3 covering mechanics, thermodynamics, electromagnetism, optics, and quantum.',
                url: 'https://openstax.org/books/university-physics-volume-1/pages/preface',
                type: 'Web',
            },
            {
                title: 'The Feynman Lectures on Physics (Vol. 1)',
                author: 'Richard P. Feynman',
                description: 'The classic Feynman lectures, freely online courtesy of Caltech.',
                url: 'https://www.feynmanlectures.caltech.edu/I_toc.html',
                type: 'Web',
            },
            {
                title: 'Modern Physics — Krane (Archive)',
                author: 'Kenneth Krane',
                description: 'Scanned textbook on modern physics via Internet Archive.',
                url: 'https://archive.org/details/modern-physics-krane',
                type: 'Web',
            },
        ],
    },
    {
        name: 'C Programming',
        color: 'bg-green-100 text-green-700',
        icon: '💻',
        books: [
            {
                title: 'The C Programming Language (K&R)',
                author: 'Kernighan & Ritchie',
                description: 'The original C language bible. Free archived edition.',
                url: 'https://archive.org/details/cprogramminglang00kern',
                type: 'Web',
            },
            {
                title: 'C Programming: A Modern Approach',
                author: 'K. N. King',
                description: 'Comprehensive modern C programming guide.',
                url: 'https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-2008-12-19/',
                type: 'Web',
            },
            {
                title: 'Beej\'s Guide to C Programming',
                author: 'Brian "Beej" Hall',
                description: 'A friendly, free online C guide. Great for beginners and intermediates.',
                url: 'https://beej.us/guide/bgc/',
                type: 'Web',
            },
        ],
    },
    {
        name: 'English & Communication',
        color: 'bg-yellow-100 text-yellow-700',
        icon: '✍️',
        books: [
            {
                title: 'The Elements of Style',
                author: 'Strunk & White',
                description: 'Classic, concise writing guide. Public domain edition.',
                url: 'https://www.gutenberg.org/ebooks/37134',
                type: 'Web',
            },
            {
                title: 'English Grammar in Use — Notes (Cambridge OCW)',
                author: 'Raymond Murphy',
                description: 'Free Cambridge grammar reference exercises online.',
                url: 'https://www.cambridge.org/elt/blog/grammar-in-use-resources/',
                type: 'Web',
            },
            {
                title: 'Technical Communication (Open OER)',
                author: 'OpenStax',
                description: 'Practical guide to technical writing, reports, and workplace communication.',
                url: 'https://open.umn.edu/opentextbooks/textbooks/73',
                type: 'Web',
            },
        ],
    },
    {
        name: 'Computer Networks',
        color: 'bg-red-100 text-red-700',
        icon: '🌐',
        books: [
            {
                title: 'Computer Networks: A Systems Approach',
                author: 'Peterson & Davie',
                description: 'Full textbook on networking, freely available online with interactive exercises.',
                url: 'https://book.systemsapproach.org',
                type: 'Web',
            },
            {
                title: 'Computer Networking: A Top-Down Approach (Slides/Notes)',
                author: 'Kurose & Ross',
                description: 'Lecture slides and resources for the classic networking textbook.',
                url: 'https://gaia.cs.umass.edu/kurose_ross/index.php',
                type: 'Web',
            },
        ],
    },
    {
        name: 'Operating Systems',
        color: 'bg-orange-100 text-orange-700',
        icon: '🖥️',
        books: [
            {
                title: 'Operating Systems: Three Easy Pieces',
                author: 'Remzi & Andrea Arpaci-Dusseau',
                description: 'Free, chapter-by-chapter OS textbook. Covers virtualization, concurrency, persistence.',
                url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
                type: 'Web',
            },
            {
                title: 'The Linux Command Line',
                author: 'William Shotts',
                description: 'Comprehensive free book on using the Linux shell.',
                url: 'https://linuxcommand.org/tlcl.php',
                type: 'Web',
            },
        ],
    },
];

// ─── Issued books (mock) ──────────────────────────────────────────────────────
const ISSUED_BOOKS = [
    { id: 'B001', title: 'Introduction to Algorithms (CLRS)', issuedOn: '2026-01-05', dueOn: '2026-02-05', status: 'Returned' },
    { id: 'B002', title: 'Engineering Mathematics – Vol. 2', issuedOn: '2026-01-20', dueOn: '2026-02-20', status: 'Overdue' },
    { id: 'B003', title: 'C Programming Language (K&R)', issuedOn: '2026-02-01', dueOn: '2026-03-01', status: 'Borrowed' },
];

// ─── Book card ────────────────────────────────────────────────────────────────
function BookCard({ book }: { book: DigitalBook }) {
    return (
        <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors leading-snug">
                        {book.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${book.type === 'PDF' ? 'bg-red-100 text-red-700' :
                        book.type === 'EPUB' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                    }`}>{book.type}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{book.description}</p>
            {book.pages && (
                <p className="text-xs text-gray-400">{book.pages} pages</p>
            )}
            <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium mt-auto pt-1">
                <ExternalLink className="w-3.5 h-3.5" />
                Open Book
            </div>
        </a>
    );
}

// ─── Subject accordion ────────────────────────────────────────────────────────
function SubjectSection({ subject, defaultOpen }: { subject: Subject; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
            >
                <span className="text-xl">{subject.icon}</span>
                <div className="flex-1">
                    <span className="font-semibold text-gray-900 text-sm">{subject.name}</span>
                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${subject.color}`}>
                        {subject.books.length} book{subject.books.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {open && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subject.books.map(b => <BookCard key={b.url} book={b} />)}
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Library({ studentId: _ }: LibraryProps) {
    const [tab, setTab] = useState<'digital' | 'issued'>('digital');
    const [search, setSearch] = useState('');

    // Filter subjects / books by search
    const filtered = search.trim()
        ? SUBJECTS.map(s => ({
            ...s,
            books: s.books.filter(b =>
                b.title.toLowerCase().includes(search.toLowerCase()) ||
                b.author.toLowerCase().includes(search.toLowerCase()) ||
                s.name.toLowerCase().includes(search.toLowerCase())
            ),
        })).filter(s => s.books.length > 0)
        : SUBJECTS;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Library</h2>
                        <p className="text-xs text-gray-500">Digital resources & issued books</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setTab('digital')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'digital' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" /> Digital Books
                    </button>
                    <button
                        onClick={() => setTab('issued')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === 'issued' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <BookMarked className="w-4 h-4" /> Issued Books
                    </button>
                </div>
            </div>

            {/* ── Digital Books tab ── */}
            {tab === 'digital' && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, author, or subject…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                        />
                    </div>

                    {/* Stats row */}
                    {!search && (
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Subjects', value: SUBJECTS.length, color: 'text-indigo-600' },
                                { label: 'Books', value: SUBJECTS.reduce((s, x) => s + x.books.length, 0), color: 'text-green-600' },
                                { label: 'Free Access', value: '100%', color: 'text-purple-600' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Subject accordions */}
                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No books found for "<span className="italic">{search}</span>"</p>
                            </div>
                        ) : (
                            filtered.map((s, i) => (
                                <SubjectSection
                                    key={s.name}
                                    subject={s}
                                    defaultOpen={!!search || i === 0}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Issued Books tab ── */}
            {tab === 'issued' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Your Issued Books</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {ISSUED_BOOKS.map(b => (
                            <div key={b.id} className="px-6 py-4 flex flex-wrap items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                    <BookMarked className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">ID: {b.id}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(b.issuedOn).toLocaleDateString()} → {new Date(b.dueOn).toLocaleDateString()}
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${b.status === 'Returned' ? 'bg-green-100 text-green-700' :
                                        b.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>{b.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
