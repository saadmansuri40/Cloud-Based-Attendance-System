import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

/** Local model weights path — served by Vite from /public/models */
const MODELS_URL = '/models';

/** Eye Aspect Ratio threshold — below this = eyes closed */
const EAR_THRESHOLD = 0.26;
/** Consecutive frames below EAR_THRESHOLD needed to confirm a blink */
const BLINK_FRAMES = 1;

interface BlinkCameraProps {
    /** Called with base64 jpeg once a blink is confirmed */
    onBlink: (imageData: string) => void;
    onCancel: () => void;
}

// ─── EAR helpers ─────────────────────────────────────────────────────────────
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Face-api 68-landmark indices for left and right eye */
const LEFT_EYE = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE = [42, 43, 44, 45, 46, 47];

function eyeAR(pts: faceapi.Point[], indices: number[]) {
    const [p1, p2, p3, p4, p5, p6] = indices.map(i => pts[i]);
    return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
}

// ─── Animated eye SVG ─────────────────────────────────────────────────────────
function BlinkEyeIcon({ blinking }: { blinking: boolean }) {
    return (
        <svg viewBox="0 0 100 50" className={`w-20 h-10 ${blinking ? 'animate-bounce' : ''}`}>
            {/* Eyebrow */}
            <path d="M10 12 Q50 2 90 12" stroke="#6366f1" strokeWidth="4" fill="none" strokeLinecap="round" />
            {blinking ? (
                /* Closed eye — just a line */
                <ellipse cx="50" cy="28" rx="36" ry="3" fill="#6366f1" />
            ) : (
                /* Open eye */
                <>
                    <ellipse cx="50" cy="28" rx="36" ry="18" fill="white" stroke="#6366f1" strokeWidth="3" />
                    <circle cx="50" cy="28" r="11" fill="#6366f1" />
                    <circle cx="50" cy="28" r="5" fill="#312e81" />
                    <circle cx="55" cy="24" r="2.5" fill="white" />
                </>
            )}
        </svg>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
type Stage = 'loading-models' | 'starting-cam' | 'ready' | 'detected' | 'error';

export default function BlinkCamera({ onBlink, onCancel }: BlinkCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const blinkFrames = useRef(0);
    const didFire = useRef(false);

    const [stage, setStage] = useState<Stage>('loading-models');
    const [earValue, setEarValue] = useState<number>(1);
    const [animBlink, setAnimBlink] = useState(false);
    const [faceFound, setFaceFound] = useState(false);
    const [errMsg, setErrMsg] = useState('');

    // Animate the guide eye every 1.5 s
    useEffect(() => {
        const id = setInterval(() => {
            setAnimBlink(v => !v);
        }, 750);
        return () => clearInterval(id);
    }, []);

    // Capture a base64 jpeg from the current video frame
    const captureFrame = useCallback((): string => {
        const video = videoRef.current!;
        const c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d')!.drawImage(video, 0, 0);
        return c.toDataURL('image/jpeg', 0.92);
    }, []);

    // Main detection loop (runs at ~30 fps via requestAnimationFrame)
    const detect = useCallback(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return; }

        const result = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceLandmarks(true); // true = tiny landmark model

        if (!result) {
            setFaceFound(false);
            setEarValue(1);
            blinkFrames.current = 0;
            rafRef.current = requestAnimationFrame(detect);
            return;
        }

        setFaceFound(true);
        const pts = result.landmarks.positions;
        const leftEAR = eyeAR(pts, LEFT_EYE);
        const rightEAR = eyeAR(pts, RIGHT_EYE);
        const avg = (leftEAR + rightEAR) / 2;
        setEarValue(avg);

        // Draw landmark dots on overlay canvas
        const ov = overlayRef.current;
        if (ov) {
            const ctx = ov.getContext('2d')!;
            ov.width = video.videoWidth;
            ov.height = video.videoHeight;
            ctx.clearRect(0, 0, ov.width, ov.height);
            // Draw eye outlines
            for (const indices of [LEFT_EYE, RIGHT_EYE]) {
                ctx.beginPath();
                indices.forEach((idx, i) => {
                    const p = pts[idx];
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                });
                ctx.closePath();
                ctx.strokeStyle = avg < EAR_THRESHOLD ? '#ef4444' : '#6366f1';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        if (avg < EAR_THRESHOLD) {
            blinkFrames.current += 1;
        } else {
            // Eyes just re-opened after being closed long enough → blink confirmed
            if (blinkFrames.current >= BLINK_FRAMES && !didFire.current) {
                didFire.current = true;
                setStage('detected');
                const img = captureFrame();
                cancelAnimationFrame(rafRef.current);
                setTimeout(() => onBlink(img), 600); // brief delay so UI shows feedback
                return;
            }
            blinkFrames.current = 0;
        }

        rafRef.current = requestAnimationFrame(detect);
    }, [captureFrame, onBlink]);

    // Boot sequence: load models → open camera → start loop
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                // 1. Load models
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
                ]);
                if (cancelled) return;
                setStage('starting-cam');

                // 2. Open camera
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                const video = videoRef.current!;
                video.srcObject = stream;
                await video.play();
                setStage('ready');

                // 3. Start detection loop
                rafRef.current = requestAnimationFrame(detect);
            } catch (e: any) {
                if (!cancelled) {
                    setErrMsg(e?.message ?? 'Failed to start camera or load models.');
                    setStage('error');
                }
            }
        })();

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [detect]);

    // ── UI ──────────────────────────────────────────────────────────────────
    return (
        <div className="relative rounded-xl overflow-hidden bg-black select-none" style={{ maxWidth: 560 }}>

            {/* Camera feed */}
            <video
                ref={videoRef}
                muted
                playsInline
                style={{ transform: 'scaleX(-1)' }}   /* mirror view */
                className="w-full block"
            />

            {/* Landmark overlay */}
            <canvas
                ref={overlayRef}
                style={{ transform: 'scaleX(-1)', position: 'absolute', inset: 0, pointerEvents: 'none' }}
                className="w-full h-full"
            />

            {/* Status overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none">

                {/* Top banner */}
                {(stage === 'ready' || stage === 'detected') && (
                    <div className="absolute top-0 left-0 right-0 bg-black/60 px-4 py-2 flex items-center justify-center gap-3">
                        {/* Animated guide eye */}
                        <BlinkEyeIcon blinking={animBlink} />
                        <div className="text-white text-center">
                            {stage === 'detected' ? (
                                <p className="font-bold text-green-400 text-base">✓ Blink detected! Capturing…</p>
                            ) : faceFound ? (
                                <>
                                    <p className="font-semibold text-sm">
                                        👁️ Face found — <span className="text-indigo-300">please blink your eyes</span>
                                    </p>
                                    <p className="text-xs text-gray-300 mt-0.5">
                                        EAR: {earValue.toFixed(2)} {earValue < EAR_THRESHOLD ? '(eyes closed)' : '(eyes open)'}
                                    </p>
                                </>
                            ) : (
                                <p className="font-semibold text-yellow-300 text-sm">
                                    🔍 Position your face in the frame, then blink
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading / error states */}
                {stage === 'loading-models' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full border-4 border-indigo-400 border-t-transparent w-12 h-12" />
                        <p className="text-white font-medium">Loading liveness detection models…</p>
                        <p className="text-gray-400 text-xs">First load may take a few seconds</p>
                    </div>
                )}

                {stage === 'starting-cam' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                        <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-500" />
                        <p className="text-white font-medium">Starting camera…</p>
                    </div>
                )}

                {stage === 'error' && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 px-6 text-center">
                        <span className="text-4xl">⚠️</span>
                        <p className="text-white font-semibold">Camera / model error</p>
                        <p className="text-gray-400 text-sm">{errMsg}</p>
                    </div>
                )}

                {/* Instructions pill */}
                {stage === 'ready' && (
                    <div className="bg-indigo-600/80 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg">
                        😑 → 😌  Blink once to mark attendance
                    </div>
                )}
            </div>

            {/* Cancel button */}
            <button
                onClick={() => { cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); onCancel(); }}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition pointer-events-auto"
            >
                Cancel
            </button>
        </div>
    );
}
