import { BookOpen, Download } from 'lucide-react';

interface MarksProps {
    studentId: string;
    studentName?: string;
    enrollmentNo?: string;
    course?: string;
    joinYear?: number;
}

const MOCK_MARKS = [
    { subject: 'Data Structures', credits: 4, grade: 'A', marks: '88/100' },
    { subject: 'Mathematics I', credits: 4, grade: 'A+', marks: '92/100' },
    { subject: 'Physics', credits: 3, grade: 'B+', marks: '76/100' },
    { subject: 'C Programming', credits: 3, grade: 'A', marks: '85/100' },
    { subject: 'English', credits: 2, grade: 'A', marks: '84/100' },
];

const CREDITS: Record<string, number> = {
    'Data Structures': 4, 'Mathematics I': 4, 'Physics': 3, 'C Programming': 3, 'English': 2,
};

const GRADE_COLOR: Record<string, string> = {
    O: 'bg-purple-100 text-purple-800',
    'A+': 'bg-green-100  text-green-800',
    A: 'bg-green-100  text-green-800',
    'B+': 'bg-blue-100   text-blue-800',
    B: 'bg-blue-100   text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    F: 'bg-red-100    text-red-800',
};

function gradePoints(g: string): number {
    return ({ O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 } as Record<string, number>)[g] ?? 0;
}

function gradeStatus(g: string) {
    return g === 'F' ? 'FAIL' : 'PASS';
}

// ── PDF generator via print window ────────────────────────────────────────────
function generatePDF(opts: {
    studentName: string;
    enrollmentNo: string;
    course: string;
    joinYear: number;
    marks: { subject: string; credits: number; grade: string; marks: string }[];
    cgpa: string;
    totalCredits: number;
}) {
    const { studentName, enrollmentNo, course, joinYear, marks, cgpa, totalCredits } = opts;
    const batch = `${joinYear}–${joinYear + 4}`;
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const rows = marks.map((m, i) => `
        <tr>
            <td class="center">${i + 1}</td>
            <td>${m.subject}</td>
            <td class="center">${m.credits}</td>
            <td class="center">${m.marks.split('/')[0]}</td>
            <td class="center">${m.marks.split('/')[1] ?? 100}</td>
            <td class="center bold">${m.grade}</td>
            <td class="center">${gradePoints(m.grade)}</td>
            <td class="center ${gradeStatus(m.grade) === 'FAIL' ? 'fail' : 'pass'}">${gradeStatus(m.grade)}</td>
        </tr>`).join('');

    const earnedCredits = marks.reduce((s, m) => s + (m.grade !== 'F' ? m.credits : 0), 0);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Marksheet – ${studentName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', serif; font-size:12px; color:#1a1a1a; background:#fff; padding:30px; }

  /* Header */
  .header { text-align:center; border-bottom:3px double #1a237e; padding-bottom:16px; margin-bottom:20px; }
  .header .logo-row { display:flex; align-items:center; justify-content:center; gap:18px; margin-bottom:8px; }
  .header .logo { width:70px; height:70px; border-radius:50%; background:linear-gradient(135deg,#1a237e,#283593); display:flex; align-items:center; justify-content:center; font-size:28px; color:#fff; font-weight:bold; border:3px solid #c5cae9; }
  .clg-name { font-size:22px; font-weight:bold; color:#1a237e; letter-spacing:1px; }
  .clg-sub  { font-size:12px; color:#555; margin-top:2px; }
  .doc-title { margin-top:12px; font-size:16px; font-weight:bold; color:#c62828; letter-spacing:2px; text-transform:uppercase; border:2px solid #c62828; display:inline-block; padding:4px 24px; border-radius:4px; }

  /* Info grid */
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; margin:18px 0; padding:14px; border:1px solid #c5cae9; border-radius:6px; background:#f5f5ff; }
  .info-row { display:flex; gap:8px; align-items:baseline; }
  .info-label { font-weight:bold; color:#1a237e; min-width:110px; font-size:11px; }
  .info-value { font-size:12px; color:#1a1a1a; }

  /* Table */
  table { width:100%; border-collapse:collapse; margin-top:16px; font-size:11.5px; }
  thead tr { background:#1a237e; color:#fff; }
  th, td { border:1px solid #9fa8da; padding:7px 10px; }
  th { font-weight:bold; font-size:11px; letter-spacing:0.5px; }
  td { vertical-align:middle; }
  tr:nth-child(even) { background:#f0f4ff; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .pass { color:#2e7d32; font-weight:bold; }
  .fail { color:#c62828; font-weight:bold; }

  /* Summary box */
  .summary { display:flex; gap:24px; margin-top:20px; justify-content:center; }
  .summary-card { text-align:center; padding:12px 28px; border:2px solid #1a237e; border-radius:8px; background:#e8eaf6; }
  .summary-card .val { font-size:24px; font-weight:bold; color:#1a237e; }
  .summary-card .lbl { font-size:10px; color:#555; margin-top:2px; text-transform:uppercase; letter-spacing:1px; }

  /* Footer */
  .footer { margin-top:40px; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #c5cae9; padding-top:16px; }
  .sig-block { text-align:center; }
  .sig-line  { width:150px; border-top:1px solid #1a1a1a; margin:0 auto; padding-top:4px; font-size:10px; color:#555; }
  .stamp     { width:80px; height:80px; border:2px dashed #1a237e; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#1a237e; text-align:center; font-weight:bold; line-height:1.3; }
  .print-date { font-size:10px; color:#777; }

  @media print {
    body { padding:0; }
    button { display:none; }
  }
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo-row">
      <div class="logo">🎓</div>
      <div>
        <div class="clg-name">NATIONAL INSTITUTE OF TECHNOLOGY</div>
        <div class="clg-sub">Approved by UGC | NAAC Accredited Grade 'A' | An Autonomous Institution</div>
        <div class="clg-sub">123 University Campus Road, New Delhi – 110001 &nbsp;|&nbsp; www.nit.ac.in</div>
      </div>
    </div>
    <div class="doc-title">Statement of Marks — Semester Examination</div>
  </div>

  <!-- Student info -->
  <div class="info-grid">
    <div class="info-row"><span class="info-label">Student Name</span><span class="info-value">: ${studentName}</span></div>
    <div class="info-row"><span class="info-label">Enrollment No.</span><span class="info-value">: ${enrollmentNo}</span></div>
    <div class="info-row"><span class="info-label">Programme</span><span class="info-value">: B.Tech – ${course}</span></div>
    <div class="info-row"><span class="info-label">Batch</span><span class="info-value">: ${batch}</span></div>
    <div class="info-row"><span class="info-label">Examination</span><span class="info-value">: End Semester Examination 2025-26</span></div>
    <div class="info-row"><span class="info-label">Semester</span><span class="info-value">: I (First)</span></div>
  </div>

  <!-- Marks table -->
  <table>
    <thead>
      <tr>
        <th class="center" style="width:38px">#</th>
        <th>Subject Name</th>
        <th class="center" style="width:60px">Credits</th>
        <th class="center" style="width:70px">Marks Obt.</th>
        <th class="center" style="width:60px">Max Marks</th>
        <th class="center" style="width:60px">Grade</th>
        <th class="center" style="width:60px">Grade Pts</th>
        <th class="center" style="width:60px">Result</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-card">
      <div class="val">${cgpa}</div>
      <div class="lbl">CGPA</div>
    </div>
    <div class="summary-card">
      <div class="val">${totalCredits}</div>
      <div class="lbl">Total Credits</div>
    </div>
    <div class="summary-card">
      <div class="val">${earnedCredits}</div>
      <div class="lbl">Credits Earned</div>
    </div>
    <div class="summary-card">
      <div class="val" style="color:${earnedCredits === totalCredits ? '#2e7d32' : '#c62828'}">${earnedCredits === totalCredits ? 'PASS' : 'FAIL'}</div>
      <div class="lbl">Overall Result</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <p class="print-date">Printed on: ${printDate}</p>
      <p class="print-date" style="margin-top:4px;color:#e57373;">⚠ This is a computer generated statement. Verify at examination section.</p>
    </div>
    <div class="sig-block">
      <div class="stamp">EXAM<br/>SECTION<br/>NIT</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Controller of Examinations</div>
    </div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Marks({ studentId, studentName = 'Student', enrollmentNo = 'N/A', course = 'CSE', joinYear = 2022 }: MarksProps) {
    let marksRows = MOCK_MARKS;
    try {
        const db = JSON.parse(localStorage.getItem('marksDb') || '{}');
        const rec = db[studentId];
        if (rec && rec.marks?.length > 0 && rec.marks.some((m: any) => m.marks !== '')) {
            marksRows = rec.marks
                .filter((m: any) => m.marks !== '')
                .map((m: any) => ({
                    subject: m.subject,
                    credits: CREDITS[m.subject] ?? 3,
                    grade: m.grade,
                    marks: `${m.marks}/100`,
                }));
        }
    } catch { /* use mock */ }

    const totalCredits = marksRows.reduce((s, r) => s + r.credits, 0);
    const totalGradePoints = marksRows.reduce((s, r) => s + gradePoints(r.grade) * r.credits, 0);
    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';

    const handleDownload = () => {
        generatePDF({ studentName, enrollmentNo, course, joinYear, marks: marksRows, cgpa, totalCredits });
    };

    return (
        <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'CGPA', value: cgpa, color: 'text-indigo-600', border: 'border-indigo-100' },
                    { label: 'Total Credits', value: totalCredits, color: 'text-green-600', border: 'border-green-100' },
                    { label: 'Semester', value: '1', color: 'text-orange-500', border: 'border-orange-100' },
                    { label: 'Subjects', value: marksRows.length, color: 'text-purple-600', border: 'border-purple-100' },
                ].map(c => (
                    <div key={c.label} className={`bg-white rounded-xl shadow-sm border ${c.border} p-5 text-center`}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{c.label}</p>
                        <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Marks table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-gray-900">Examination Results</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">Semester 1</span>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition"
                        >
                            <Download className="w-4 h-4" />
                            Download Marksheet
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['#', 'Subject', 'Credits', 'Grade', 'Marks', 'Grade Points', 'Result'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {marksRows.map((record, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">{idx + 1}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.subject}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{record.credits}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${GRADE_COLOR[record.grade] ?? 'bg-yellow-100 text-yellow-800'}`}>
                                            {record.grade}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{record.marks}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-center text-gray-600">{gradePoints(record.grade)}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`text-xs font-bold ${record.grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>
                                            {gradeStatus(record.grade)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer row */}
                <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100 flex flex-wrap gap-6 justify-between items-center">
                    <div className="flex gap-6 text-sm">
                        <span><strong className="text-indigo-700">CGPA:</strong> {cgpa}</span>
                        <span><strong className="text-indigo-700">Credits Earned:</strong> {marksRows.filter(r => r.grade !== 'F').reduce((s, r) => s + r.credits, 0)} / {totalCredits}</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${marksRows.every(r => r.grade !== 'F') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                        }`}>
                        Overall: {marksRows.every(r => r.grade !== 'F') ? 'PASS 🎉' : 'FAIL'}
                    </span>
                </div>
            </div>

            {/* Download banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="text-white">
                    <p className="font-bold text-base">📄 Download Official Marksheet</p>
                    <p className="text-indigo-200 text-sm mt-0.5">College-format PDF with grade table, CGPA & official stamp</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-xl text-sm font-bold shadow transition"
                >
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            </div>
        </div>
    );
}
