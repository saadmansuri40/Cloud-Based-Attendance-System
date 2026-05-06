import { Ticket, Download, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';

interface HallTicketProps {
    studentName: string;
    enrollmentNo: string;
    course: string;
    joinYear: number;
    photoUrl?: string | null;   // base64 avatar
}

// ── upcoming exam schedule (demo) ─────────────────────────────────────────────
interface ExamEntry {
    code: string;
    subject: string;
    date: string;   // display string
    day: string;
    time: string;
    venue: string;
    room: string;
    maxMarks: number;
}

function getExams(joinYear: number): ExamEntry[] {
    // Build dates relative to "now" so they always look upcoming
    const base = new Date('2026-04-01');
    const fmt = (d: Date) =>
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const day = (d: Date) =>
        d.toLocaleDateString('en-IN', { weekday: 'long' });
    const add = (n: number) => { const d = new Date(base); d.setDate(base.getDate() + n); return d; };

    const yy = String(joinYear).slice(-2);

    return [
        { code: `${yy}CS101`, subject: 'Data Structures & Algorithms', date: fmt(add(0)), day: day(add(0)), time: '09:00 AM – 12:00 PM', venue: 'Main Exam Hall', room: 'Room A-101', maxMarks: 100 },
        { code: `${yy}MA101`, subject: 'Engineering Mathematics – I', date: fmt(add(2)), day: day(add(2)), time: '09:00 AM – 12:00 PM', venue: 'Main Exam Hall', room: 'Room A-102', maxMarks: 100 },
        { code: `${yy}PH101`, subject: 'Engineering Physics', date: fmt(add(4)), day: day(add(4)), time: '02:00 PM – 05:00 PM', venue: 'Science Block', room: 'Room B-201', maxMarks: 100 },
        { code: `${yy}CS102`, subject: 'C Programming', date: fmt(add(6)), day: day(add(6)), time: '09:00 AM – 12:00 PM', venue: 'CS Lab Block', room: 'Lab L-01', maxMarks: 100 },
        { code: `${yy}EN101`, subject: 'English & Communication Skills', date: fmt(add(8)), day: day(add(8)), time: '02:00 PM – 04:00 PM', venue: 'Main Exam Hall', room: 'Room A-103', maxMarks: 75 },
        { code: `${yy}CS103`, subject: 'Computer Networks', date: fmt(add(10)), day: day(add(10)), time: '09:00 AM – 12:00 PM', venue: 'Main Exam Hall', room: 'Room A-104', maxMarks: 100 },
        { code: `${yy}CS104`, subject: 'Operating Systems', date: fmt(add(12)), day: day(add(12)), time: '02:00 PM – 05:00 PM', venue: 'Main Exam Hall', room: 'Room A-105', maxMarks: 100 },
    ];
}

// ── PDF print generator ───────────────────────────────────────────────────────
function openHallTicketPDF(opts: HallTicketProps) {
    const { studentName, enrollmentNo, course, joinYear, photoUrl } = opts;
    const exams = getExams(joinYear);
    const batch = `${joinYear}–${joinYear + 4}`;
    const semester = 'I (First)';
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // barcode stripe rendered inline in template
    const barcodeStr = enrollmentNo.split('').join(' ');

    const photoBlock = photoUrl
        ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px" />`
        : `<div style="width:100%;height:100%;background:#e8eaf6;display:flex;align-items:center;justify-content:center;font-size:40px;border-radius:6px">👤</div>`;

    const examRows = exams.map((e, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f5f5ff'}">
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;text-align:center;color:#555">${i + 1}</td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;color:#555">${e.code}</td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11.5px;font-weight:600;color:#1a1a1a">${e.subject}</td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;color:#333">${e.day}<br/><strong>${e.date}</strong></td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;color:#333;white-space:nowrap">${e.time}</td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;color:#333">${e.venue}<br/><em>${e.room}</em></td>
            <td style="padding:8px 10px;border:1px solid #c5cae9;font-size:11px;text-align:center;color:#333">${e.maxMarks}</td>
        </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Hall Ticket – ${enrollmentNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Times New Roman',serif; font-size:12px; color:#1a1a1a; background:#fff; padding:24px; }

  .outer-border { border:3px double #1a237e; padding:16px; }
  .inner-border { border:1px solid #9fa8da; padding:12px; }

  /* Header */
  .header { text-align:center; border-bottom:2px solid #1a237e; padding-bottom:12px; margin-bottom:14px; }
  .header .logo-row { display:flex; align-items:center; justify-content:center; gap:16px; }
  .header .logo { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#1a237e,#7e57c2);
                   display:flex; align-items:center; justify-content:center; font-size:28px; color:#fff; border:3px solid #b39ddb; }
  .clg-name { font-size:20px; font-weight:bold; color:#1a237e; letter-spacing:0.5px; }
  .clg-sub  { font-size:11px; color:#555; margin-top:2px; }
  .doc-title { margin-top:10px; font-size:15px; font-weight:bold; color:#c62828; text-transform:uppercase;
                letter-spacing:2px; border:2px solid #c62828; display:inline-block; padding:3px 20px; border-radius:3px; }
  .doc-sub   { font-size:11px; color:#666; margin-top:4px; }

  /* Student block */
  .student-block { display:flex; gap:16px; margin-bottom:14px; align-items:flex-start; }
  .photo-box { width:100px; height:120px; border:2px solid #1a237e; border-radius:6px; overflow:hidden; flex-shrink:0; }
  .info-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:5px 20px; }
  .info-row  { display:flex; gap:6px; align-items:baseline; font-size:11.5px; }
  .info-label { font-weight:bold; color:#1a237e; min-width:115px; }
  .info-value { color:#1a1a1a; }

  /* Barcode strip */
  .barcode { text-align:center; font-family:monospace; font-size:14px; letter-spacing:4px; color:#333;
              border:1px solid #c5cae9; padding:6px; border-radius:4px; background:#f5f5ff; margin-bottom:14px; }
  .barcode small { display:block; font-size:9px; letter-spacing:1px; color:#888; margin-top:2px; }

  /* Table */
  table { width:100%; border-collapse:collapse; margin-bottom:14px; }
  thead tr { background:#1a237e; color:#fff; }
  th { padding:8px 10px; font-size:11px; font-weight:600; text-align:left; border:1px solid #7986cb; }
  th:first-child, th:last-child { text-align:center; }

  /* Instructions */
  .instructions { border:1px solid #ffcc80; background:#fff8e1; border-radius:6px; padding:10px 14px; margin-bottom:14px; }
  .instructions h4 { font-size:12px; font-weight:bold; color:#e65100; margin-bottom:6px; }
  .instructions ul { padding-left:16px; }
  .instructions li { font-size:10.5px; color:#5d4037; margin-bottom:3px; line-height:1.4; }

  /* Footer */
  .footer { display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #c5cae9; padding-top:12px; }
  .sig-block { text-align:center; }
  .sig-line  { width:140px; border-top:1px solid #333; margin:0 auto; padding-top:4px; font-size:10px; color:#555; }
  .stamp     { width:72px; height:72px; border:2px dashed #1a237e; border-radius:50%;
                display:flex; align-items:center; justify-content:center; font-size:8px; color:#1a237e;
                text-align:center; font-weight:bold; line-height:1.4; }
  .validity { font-size:10px; color:#777; }

  @media print { body { padding:0; } button { display:none; } }
</style>
</head>
<body>
<div class="outer-border">
<div class="inner-border">

  <!-- Header -->
  <div class="header">
    <div class="logo-row">
      <div class="logo">🎓</div>
      <div>
        <div class="clg-name">NATIONAL INSTITUTE OF TECHNOLOGY</div>
        <div class="clg-sub">Approved by UGC &nbsp;|&nbsp; NAAC Accredited Grade 'A' &nbsp;|&nbsp; An Autonomous Institution</div>
        <div class="clg-sub">123 University Campus Road, New Delhi – 110001 &nbsp;|&nbsp; www.nit.ac.in</div>
      </div>
      <div class="logo" style="background:linear-gradient(135deg,#7e57c2,#1a237e)">🎓</div>
    </div>
    <div class="doc-title">Hall Ticket / Admit Card</div>
    <div class="doc-sub">End Semester Examination – April / May 2026 &nbsp;|&nbsp; Academic Year 2025–26</div>
  </div>

  <!-- Student info + photo -->
  <div class="student-block">
    <div class="photo-box">${photoBlock}</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Student Name</span><span class="info-value">: ${studentName}</span></div>
      <div class="info-row"><span class="info-label">Enrollment No.</span><span class="info-value">: ${enrollmentNo}</span></div>
      <div class="info-row"><span class="info-label">Programme</span><span class="info-value">: B.Tech – ${course}</span></div>
      <div class="info-row"><span class="info-label">Batch</span><span class="info-value">: ${batch}</span></div>
      <div class="info-row"><span class="info-label">Semester</span><span class="info-value">: ${semester}</span></div>
      <div class="info-row"><span class="info-label">Examination Centre</span><span class="info-value">: NIT Main Campus</span></div>
      <div class="info-row"><span class="info-label">Exam Type</span><span class="info-value">: End Semester (Theory + Practical)</span></div>
      <div class="info-row"><span class="info-label">Generated On</span><span class="info-value">: ${printDate}</span></div>
    </div>
  </div>

  <div class="barcode">
    |||&nbsp;${barcodeStr}&nbsp;||| <br/>
    <small>Scan at exam centre for verification &nbsp;·&nbsp; ${enrollmentNo}</small>
  </div>

  <!-- Exam schedule -->
  <table>
    <thead>
      <tr>
        <th style="width:30px;text-align:center">#</th>
        <th style="width:80px">Course Code</th>
        <th>Subject Name</th>
        <th style="width:130px">Date &amp; Day</th>
        <th style="width:130px">Timing</th>
        <th style="width:130px">Venue / Room</th>
        <th style="width:60px;text-align:center">Max Marks</th>
      </tr>
    </thead>
    <tbody>${examRows}</tbody>
  </table>

  <!-- Instructions -->
  <div class="instructions">
    <h4>⚠️ Important Instructions for Candidates</h4>
    <ul>
      <li>This Hall Ticket is mandatory for appearing in the examination. No candidate will be allowed without it.</li>
      <li>Candidates must report to the examination hall at least <strong>30 minutes before</strong> the scheduled time.</li>
      <li>Carry a valid government-issued photo ID along with this Hall Ticket.</li>
      <li>Mobile phones, smart watches, and electronic gadgets are <strong>strictly prohibited</strong> in the exam hall.</li>
      <li>Use only <strong>blue or black ball-point pen</strong>. Pencil is not allowed except for diagrams.</li>
      <li>Do not write your roll number / name anywhere other than the designated space on the answer sheet.</li>
      <li>Candidates found using unfair means will be summarily expelled and will face disciplinary action.</li>
      <li>This is a computer-generated Hall Ticket; no signature is required. Verify at the Examination Section if in doubt.</li>
    </ul>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <p class="validity">Valid for: End Semester Examination, April/May 2026</p>
      <p class="validity" style="color:#e57373;margin-top:3px">⚠️ Subject to clearing all dues &amp; no detainment order</p>
    </div>
    <div class="sig-block">
      <div class="stamp">EXAM<br/>SECTION<br/>NIT<br/>2026</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Controller of Examinations</div>
    </div>
  </div>

</div><!-- inner -->
</div><!-- outer -->
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=760');
    if (win) { win.document.write(html); win.document.close(); }
}

// ── React Component ───────────────────────────────────────────────────────────
export default function HallTicket({ studentName, enrollmentNo, course, joinYear, photoUrl }: HallTicketProps) {
    const exams = getExams(joinYear);
    const batch = `${joinYear}–${joinYear + 4}`;

    const statusColor = (i: number) =>
        i < 2 ? 'bg-orange-100 text-orange-700 border-orange-200'
            : 'bg-blue-100 text-blue-700 border-blue-200';

    return (
        <div className="space-y-6">
            {/* ── Hero banner ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 px-8 py-8 shadow-xl">
                {/* decorative circles */}
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
                <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-white/5 rounded-full" />

                <div className="relative flex flex-wrap items-center justify-between gap-6">
                    <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Ticket className="w-6 h-6 text-indigo-300" />
                            <span className="text-indigo-300 text-sm font-semibold uppercase tracking-widest">Admit Card</span>
                        </div>
                        <h2 className="text-2xl font-bold">End Semester Examination</h2>
                        <p className="text-indigo-200 mt-1">April / May 2026 &nbsp;·&nbsp; Academic Year 2025–26</p>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                            <span className="bg-white/15 text-white px-3 py-1 rounded-full font-medium">{enrollmentNo}</span>
                            <span className="bg-white/15 text-white px-3 py-1 rounded-full font-medium">B.Tech – {course}</span>
                            <span className="bg-white/15 text-white px-3 py-1 rounded-full font-medium">Batch {batch}</span>
                        </div>
                    </div>

                    {/* Photo */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-24 rounded-xl border-4 border-white/40 overflow-hidden bg-indigo-500 shadow-lg">
                            {photoUrl
                                ? <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                            }
                        </div>
                        <p className="text-white font-semibold text-sm text-center max-w-[120px] leading-tight">{studentName}</p>
                    </div>
                </div>
            </div>

            {/* ── Eligibility notice ── */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-amber-800">Bring this Hall Ticket to every exam</p>
                    <p className="text-amber-700 mt-0.5">Report 30 min early · Carry valid photo ID · Mobile phones strictly prohibited</p>
                </div>
            </div>

            {/* ── Exam schedule table ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900 text-base">Examination Schedule</h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{exams.length} Papers</span>
                    </div>
                    <button
                        onClick={() => openHallTicketPDF({ studentName, enrollmentNo, course, joinYear, photoUrl })}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition"
                    >
                        <Download className="w-4 h-4" /> Download Hall Ticket
                    </button>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['#', 'Course Code', 'Subject', 'Date', 'Timing', 'Venue', 'Max Marks'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {exams.map((e, i) => (
                                <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                                    <td className="px-4 py-3 text-sm font-mono font-semibold text-indigo-700">{e.code}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{e.subject}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <p className="font-semibold text-gray-900">{e.date}</p>
                                        <p className="text-xs text-gray-500">{e.day}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{e.time}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <p className="text-gray-800">{e.venue}</p>
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                            <MapPin className="w-3 h-3" />{e.room}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-center text-gray-700">{e.maxMarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                    {exams.map((e, i) => (
                        <div key={i} className="px-5 py-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{e.code}</span>
                                    <p className="font-semibold text-gray-900 mt-1">{e.subject}</p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 ${statusColor(i)}`}>
                                    {i < 2 ? 'Soon' : 'Upcoming'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{e.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.venue}</span>
                                <span className="font-semibold">Max: {e.maxMarks} marks</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Download CTA banner ── */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="text-white">
                    <p className="font-bold text-lg flex items-center gap-2"><Ticket className="w-5 h-5" /> Download Official Hall Ticket</p>
                    <p className="text-indigo-200 text-sm mt-1">College-format PDF with photo · exam schedule · instructions · stamp</p>
                </div>
                <button
                    onClick={() => openHallTicketPDF({ studentName, enrollmentNo, course, joinYear, photoUrl })}
                    className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition"
                >
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            </div>
        </div>
    );
}
