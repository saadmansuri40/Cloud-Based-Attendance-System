import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, CalendarClock, Zap, AlertCircle, RefreshCw } from 'lucide-react';

const CONFIG_KEY = 'hallTicketConfig';

export interface HallTicketConfig {
    released: boolean;
    scheduledAt: string | null;   // ISO datetime string  or null
    releasedAt: string | null;   // when it was actually released
}

export function loadConfig(): HallTicketConfig {
    try {
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) return JSON.parse(raw) as HallTicketConfig;
    } catch { /* ignore */ }
    return { released: false, scheduledAt: null, releasedAt: null };
}

function saveConfig(cfg: HallTicketConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    // Dispatch so other tabs / Sidebar pick it up immediately
    window.dispatchEvent(new StorageEvent('storage', { key: CONFIG_KEY }));
}

// ── tiny timezone-aware "now + 1 min" helper for the datetime-local default ──
function nowPlusMin(min: number) {
    const d = new Date(Date.now() + min * 60000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:mm'
}

export default function HallTicketControl() {
    const [cfg, setCfg] = useState<HallTicketConfig>(loadConfig);
    const [schedDT, setSchedDT] = useState<string>(nowPlusMin(30));
    const [justSaved, setJustSaved] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    // ── Tick: auto-release when scheduled time passes ─────────────────────────
    const checkSchedule = useCallback(() => {
        const c = loadConfig();
        if (!c.released && c.scheduledAt && new Date(c.scheduledAt) <= new Date()) {
            const updated: HallTicketConfig = {
                released: true,
                scheduledAt: c.scheduledAt,
                releasedAt: new Date().toISOString(),
            };
            saveConfig(updated);
            setCfg(updated);
        } else {
            setCfg(loadConfig());
        }
    }, []);

    useEffect(() => {
        checkSchedule();
        const tick = setInterval(checkSchedule, 15000); // check every 15 s
        const onStorage = (e: StorageEvent) => { if (e.key === CONFIG_KEY) checkSchedule(); };
        window.addEventListener('storage', onStorage);
        return () => { clearInterval(tick); window.removeEventListener('storage', onStorage); };
    }, [checkSchedule]);

    // Countdown to scheduled release
    useEffect(() => {
        if (!cfg.scheduledAt || cfg.released) { setTimeLeft(''); return; }
        const update = () => {
            const diff = new Date(cfg.scheduledAt!).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Releasing…'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [cfg]);

    // ── Actions ───────────────────────────────────────────────────────────────
    const releaseNow = () => {
        const updated: HallTicketConfig = { released: true, scheduledAt: null, releasedAt: new Date().toISOString() };
        saveConfig(updated);
        setCfg(updated);
        flash();
    };

    const revoke = () => {
        const updated: HallTicketConfig = { released: false, scheduledAt: null, releasedAt: null };
        saveConfig(updated);
        setCfg(updated);
        flash();
    };

    const schedule = () => {
        if (!schedDT) return;
        const updated: HallTicketConfig = { released: false, scheduledAt: new Date(schedDT).toISOString(), releasedAt: null };
        saveConfig(updated);
        setCfg(updated);
        flash();
    };

    const cancelSchedule = () => {
        const updated: HallTicketConfig = { released: cfg.released, scheduledAt: null, releasedAt: cfg.releasedAt };
        saveConfig(updated);
        setCfg(updated);
    };

    const flash = () => { setJustSaved(true); setTimeout(() => setJustSaved(false), 2000); };

    // ── UI ────────────────────────────────────────────────────────────────────
    const isReleased = cfg.released;
    const isScheduled = !isReleased && !!cfg.scheduledAt;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Status card */}
            <div className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${isReleased ? 'bg-green-50  border-green-300'
                : isScheduled ? 'bg-amber-50  border-amber-300'
                    : 'bg-red-50    border-red-200'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isReleased ? 'bg-green-100'
                        : isScheduled ? 'bg-amber-100'
                            : 'bg-red-100'
                        }`}>
                        {isReleased ? <CheckCircle2 className="w-7 h-7 text-green-600" />
                            : isScheduled ? <CalendarClock className="w-7 h-7 text-amber-600" />
                                : <XCircle className="w-7 h-7 text-red-500" />}
                    </div>
                    <div className="flex-1">
                        <p className={`text-lg font-bold ${isReleased ? 'text-green-800'
                            : isScheduled ? 'text-amber-800'
                                : 'text-red-700'
                            }`}>
                            {isReleased ? '✅ Hall Tickets are LIVE for students'
                                : isScheduled ? '⏳ Scheduled — students cannot see yet'
                                    : '🔒 Hall Tickets are NOT released'}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {isReleased && cfg.releasedAt
                                ? `Released on: ${new Date(cfg.releasedAt).toLocaleString('en-IN')}`
                                : isScheduled && cfg.scheduledAt
                                    ? `Auto-releases on: ${new Date(cfg.scheduledAt).toLocaleString('en-IN')}`
                                    : 'Manually release or set a scheduled date & time below.'}
                        </p>
                        {isScheduled && timeLeft && (
                            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-700">
                                <Clock className="w-4 h-4 animate-pulse" />
                                Releases in: {timeLeft}
                            </div>
                        )}
                    </div>
                    {justSaved && (
                        <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold animate-pulse">Saved ✓</span>
                    )}
                </div>
            </div>

            {/* Instant release / revoke */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" /> Instant Control
                </h3>
                <div className="flex flex-wrap gap-3">
                    {!isReleased ? (
                        <button onClick={releaseNow}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition">
                            <CheckCircle2 className="w-5 h-5" /> Release Now for All Students
                        </button>
                    ) : (
                        <button onClick={revoke}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition">
                            <XCircle className="w-5 h-5" /> Revoke Access
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400">
                    {isReleased ? 'Students can currently see and download the Hall Ticket from their portal.'
                        : 'Students will NOT see the Hall Ticket option until you release it.'}
                </p>
            </div>

            {/* Scheduler */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-violet-600" /> Schedule Auto-Release
                </h3>

                {isScheduled ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-800 text-sm">Auto-release scheduled</p>
                                <p className="text-amber-700 text-sm">
                                    {new Date(cfg.scheduledAt!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                                <p className="text-amber-600 text-xs mt-0.5">Hall tickets will become visible to students at this exact time automatically.</p>
                            </div>
                        </div>
                        <button onClick={cancelSchedule}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
                            <RefreshCw className="w-4 h-4" /> Cancel Scheduled Release
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Select Release Date &amp; Time
                            </label>
                            <input
                                type="datetime-local"
                                value={schedDT}
                                onChange={e => setSchedDT(e.target.value)}
                                min={nowPlusMin(1)}
                                className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                        </div>
                        <button
                            onClick={schedule}
                            disabled={!schedDT}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition shadow ${schedDT ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <CalendarClock className="w-4 h-4" /> Set Scheduled Release
                        </button>
                        <p className="text-xs text-gray-400">
                            The system checks every 15 seconds and auto-releases at the scheduled time — even while the page is open.
                        </p>
                    </div>
                )}
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">How it works</p>
                <div className="space-y-2 text-sm text-gray-600">
                    {[
                        ['🔒', 'By default, Hall Ticket is hidden from all students.'],
                        ['⚡', '"Release Now" instantly makes it visible in all student portals.'],
                        ['📅', '"Schedule" sets a future date/time — it auto-releases without any manual action.'],
                        ['↩️', '"Revoke" hides the Hall Ticket again at any time.'],
                        ['🔄', 'Students portal refreshes automatically — no page reload needed.'],
                    ].map(([icon, text], i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span>{icon}</span>
                            <p>{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
