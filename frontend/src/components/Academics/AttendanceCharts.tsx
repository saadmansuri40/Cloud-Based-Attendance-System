import { useMemo, useState } from 'react';
import { AttendanceRecord } from '../../types';

interface Props {
    records: AttendanceRecord[];
    studentId: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function parseDate(str: string): Date {
    // records use toLocaleDateString() — try multiple formats
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
}

// Donut SVG (no library)
function DonutChart({ pct, color = '#6366f1' }: { pct: number; color?: string }) {
    const r = 54;
    const cx = 70;
    const cy = 70;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;
    const status = pct >= 75 ? { label: 'Good', c: '#22c55e' } : pct >= 60 ? { label: 'Low', c: '#f59e0b' } : { label: 'Critical', c: '#ef4444' };

    return (
        <div className="flex flex-col items-center">
            <svg width={140} height={140} viewBox="0 0 140 140">
                {/* Track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={14} />
                {/* Progress */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                {/* Centre text */}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight="bold" fill={color}>{pct}%</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill={status.c} fontWeight="600">{status.label}</text>
            </svg>
            <p className="text-xs text-gray-500 -mt-1">Overall Attendance</p>
        </div>
    );
}

// Bar chart — last N days
function DayBars({ records, days = 30 }: { records: AttendanceRecord[]; days?: number }) {
    const slots = useMemo(() => {
        const result: { label: string; present: boolean | null }[] = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString();
            const rec = records.find(r => r.date === dateStr);
            result.push({
                label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                present: rec ? rec.status === 'present' : null,
            });
        }
        return result;
    }, [records, days]);

    const barW = Math.min(18, Math.floor(560 / days) - 3);
    const gap = Math.floor(560 / days) - barW;
    const totalW = days * (barW + gap);

    return (
        <div className="overflow-x-auto">
            <svg width={Math.max(totalW, 320)} height={90} className="block min-w-full">
                {slots.map((s, i) => {
                    const x = i * (barW + gap);
                    const fill = s.present === true ? '#6366f1' : s.present === false ? '#ef4444' : '#e5e7eb';
                    return (
                        <g key={i}>
                            <rect x={x} y={10} width={barW} height={50} rx={3} fill={fill} opacity={s.present === null ? 0.4 : 1} />
                            {days <= 20 && (
                                <text x={x + barW / 2} y={78} textAnchor="middle" fontSize={8} fill="#9ca3af">
                                    {s.label.split(' ')[0]}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-indigo-500" />&nbsp;Present</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-400" />&nbsp;Absent</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-200" />&nbsp;No record</span>
            </div>
        </div>
    );
}

// Weekly trend line chart (last 8 weeks)
function WeeklyLine({ records }: { records: AttendanceRecord[] }) {
    const weeks = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 8 }, (_, wi) => {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - (7 - wi) * 7);
            let present = 0, total = 0;
            for (let d = 0; d < 7; d++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + d);
                const dateStr = day.toLocaleDateString();
                const rec = records.find(r => r.date === dateStr);
                if (rec) { total++; if (rec.status === 'present') present++; }
            }
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;
            const label = `W${wi + 1}`;
            return { label, pct, total };
        });
    }, [records]);

    const W = 480; const H = 120;
    const padL = 32; const padR = 12; const padT = 12; const padB = 24;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const n = weeks.length;
    const pts = weeks.map((w, i) => ({
        x: padL + (i / (n - 1)) * innerW,
        y: padT + innerH - (w.pct / 100) * innerH,
        ...w,
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;

    return (
        <div className="overflow-x-auto">
            <svg width={W} height={H} className="w-full max-w-full">
                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map(val => {
                    const y = padT + innerH - (val / 100) * innerH;
                    return (
                        <g key={val}>
                            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#d1d5db">{val}%</text>
                        </g>
                    );
                })}
                {/* 75% threshold */}
                {(() => {
                    const y = padT + innerH - 0.75 * innerH; return (
                        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" />
                    );
                })()}

                {/* Area fill */}
                <path d={areaD} fill="#6366f1" fillOpacity={0.08} />
                {/* Line */}
                <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                {/* Dots + labels */}
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={5} fill="#6366f1" stroke="#fff" strokeWidth={2} />
                        <text x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{p.label}</text>
                        {p.total > 0 && (
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight="600">{p.pct}%</text>
                        )}
                    </g>
                ))}
            </svg>
            <p className="text-xs text-gray-400 mt-1">Weekly attendance % — dashed line is 75% minimum threshold</p>
        </div>
    );
}

// Monthly summary bars
function MonthlyBars({ records }: { records: AttendanceRecord[] }) {
    const months = useMemo(() => {
        const map: Record<string, { present: number; total: number }> = {};
        records.forEach(r => {
            const d = parseDate(r.date);
            const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            if (!map[key]) map[key] = { present: 0, total: 0 };
            map[key].total++;
            if (r.status === 'present') map[key].present++;
        });
        return Object.entries(map).slice(-6).map(([month, v]) => ({
            month,
            pct: Math.round((v.present / v.total) * 100),
            present: v.present,
            total: v.total,
        }));
    }, [records]);

    if (months.length === 0) return null;

    const barH = 28; const gap = 10; const labelW = 60;
    const height = months.length * (barH + gap);

    return (
        <svg width={380} height={height} className="w-full max-w-sm">
            {months.map((m, i) => {
                const y = i * (barH + gap);
                const fill = m.pct >= 75 ? '#6366f1' : m.pct >= 60 ? '#f59e0b' : '#ef4444';
                const barW = Math.max(4, ((380 - labelW - 48) * m.pct) / 100);
                return (
                    <g key={m.month}>
                        <text x={0} y={y + barH / 2 + 4} fontSize={11} fill="#6b7280">{m.month}</text>
                        <rect x={labelW} y={y} width={barW} height={barH} rx={5} fill={fill} />
                        <text x={labelW + barW + 6} y={y + barH / 2 + 4} fontSize={11} fill={fill} fontWeight="700">
                            {m.pct}%
                        </text>
                        <text x={330} y={y + barH / 2 + 4} fontSize={10} fill="#9ca3af">
                            {m.present}/{m.total}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AttendanceCharts({ records, studentId: _ }: Props) {
    const [range, setRange] = useState<7 | 14 | 30>(30);

    const present = records.filter(r => r.status === 'present').length;
    const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    const streak = useMemo(() => {
        const sorted = records
            .filter(r => r.status === 'present')
            .map(r => r.date)
            .sort((a, b) => parseDate(b).getTime() - parseDate(a).getTime());
        if (sorted.length === 0) return 0;
        let count = 1;
        for (let i = 1; i < sorted.length; i++) {
            const diff = (parseDate(sorted[i - 1]).getTime() - parseDate(sorted[i]).getTime()) / 86400000;
            if (Math.round(diff) === 1) count++; else break;
        }
        return count;
    }, [records]);

    return (
        <div className="space-y-5">
            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Classes Attended', value: present, color: 'text-indigo-600', bg: 'bg-indigo-50  border-indigo-100' },
                    { label: 'Classes Held', value: records.length, color: 'text-gray-700', bg: 'bg-gray-50    border-gray-200' },
                    { label: 'Absent', value: records.length - present, color: 'text-red-600', bg: 'bg-red-50     border-red-100' },
                    { label: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                ].map(c => (
                    <div key={c.label} className={`rounded-xl border ${c.bg} p-4 text-center`}>
                        <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Donut + Monthly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Donut */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
                    <h4 className="font-semibold text-gray-800 self-start">Overall Summary</h4>
                    <DonutChart pct={pct} color={pct >= 75 ? '#6366f1' : pct >= 60 ? '#f59e0b' : '#ef4444'} />
                    {pct < 75 && (
                        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800 font-medium text-center">
                            ⚠️ Need {Math.max(0, Math.ceil((0.75 * (records.length + (75 - pct)) - present)))} more classes to reach 75%
                        </div>
                    )}
                    {pct >= 75 && (
                        <div className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium text-center">
                            ✅ You meet the 75% attendance requirement
                        </div>
                    )}
                </div>

                {/* Monthly bars */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">Monthly Breakdown</h4>
                    {records.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-6">No records yet</p>
                    ) : (
                        <MonthlyBars records={records} />
                    )}
                </div>
            </div>

            {/* Daily bars */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="font-semibold text-gray-800">Day-by-Day View</h4>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        {([7, 14, 30] as const).map(n => (
                            <button key={n} onClick={() => setRange(n)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${range === n ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                {n}d
                            </button>
                        ))}
                    </div>
                </div>
                <DayBars records={records} days={range} />
            </div>

            {/* Weekly trend */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="font-semibold text-gray-800 mb-4">8-Week Trend</h4>
                <WeeklyLine records={records} />
            </div>
        </div>
    );
}
