import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera } from 'lucide-react';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

export default function CameraComponent({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Auto-start camera on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setIsReady(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Could not access camera. Please allow camera permissions and try again.');
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !isReady) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    // Stop camera tracks
    (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    onCapture(canvas.toDataURL('image/jpeg', 0.92));
  }, [isReady, onCapture]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg shadow-lg"
      />
      {/* Overlay guide */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-56 border-4 border-white border-dashed rounded-full opacity-50" />
        </div>
      )}
      <div className="mt-3">
        {!isReady ? (
          <p className="text-center text-sm text-gray-500 py-2">Starting camera…</p>
        ) : (
          <button
            onClick={captureImage}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 active:scale-95 transition-all font-semibold text-base shadow"
          >
            <Camera size={20} />
            Capture Photo
          </button>
        )}
      </div>
    </div>
  );
}