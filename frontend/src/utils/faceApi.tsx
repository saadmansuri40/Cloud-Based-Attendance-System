const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

// ── Timeout fetch ─────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 90000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out — the server is taking too long. Please try again.');
    throw err;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VerificationResult {
  success: boolean;
  isPresent: boolean;
  message: string;
  confidence?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function base64ToBlob(imageData: string): Blob {
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: 'image/jpeg' });
}

// ── API: Detect Face ──────────────────────────────────────────────────────────
/**
 * Uploads an image to the backend and returns a faceId if a face is detected.
 * Throws if no face is detected.
 */
export async function detectFace(imageData: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', base64ToBlob(imageData), 'face.jpg');

  const res = await fetchWithTimeout(`${API_URL}/api/detect-face`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Face detection failed: ${res.statusText}`);

  const data = await res.json();
  if (!data || data.length === 0) throw new Error('No face detected in the image');
  return data[0].faceId as string;
}

// ── API: Verify Face (faceId-based) ───────────────────────────────────────────
/**
 * Standard two-faceId verify. Use when you already have both faceIds.
 */
export async function verifyFace(
  faceId1: string,
  faceId2: string,
  studentId: string
): Promise<VerificationResult> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/verify-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceId1, faceId2, studentId }),
    });

    if (!res.ok) {
      return { success: false, isPresent: false, message: `Verification failed: ${res.statusText}` };
    }

    const data = await res.json();
    if (data?.hasOwnProperty('isIdentical')) {
      return {
        success: true,
        isPresent: data.isIdentical,
        message: data.message ?? (data.isIdentical ? 'Student is present' : 'Student is absent'),
        confidence: data.confidence,
      };
    }
    return { success: false, isPresent: false, message: 'Unexpected response from server' };
  } catch (err) {
    return {
      success: false,
      isPresent: false,
      message: `Verification error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── API: Fast Verify (detect + verify in sequence, reuses captured faceId) ────
/**
 * Fastest attendance-check path:
 *   1. Upload captured image → get faceId2
 *   2. Immediately verify against registered faceId1 (embedding is cached on backend)
 * This cuts the user-visible wait vs doing detect then verify as separate awaited steps.
 */
export async function verifyFaceFromImage(
  registeredFaceId: string,
  capturedImageData: string,
  studentId: string
): Promise<VerificationResult> {
  try {
    // Step 1: Upload captured image to get its faceId
    const capturedFaceId = await detectFace(capturedImageData);

    // Step 2: Verify — backend uses cached embedding for registeredFaceId (instant)
    return await verifyFace(registeredFaceId, capturedFaceId, studentId);
  } catch (err) {
    return {
      success: false,
      isPresent: false,
      message: `Face check error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── API: Register Student Face ────────────────────────────────────────────────
/**
 * Registers a student face. Backend pre-computes and caches the embedding.
 */
export async function registerStudentFace(
  studentId: string,
  imageData: string
): Promise<{ success: boolean; faceId?: string; message: string }> {
  try {
    const formData = new FormData();
    formData.append('image', base64ToBlob(imageData), 'face.jpg');
    formData.append('studentId', studentId);

    const res = await fetchWithTimeout(`${API_URL}/api/register-student`, { method: 'POST', body: formData });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Registration failed: ${res.statusText} — ${errText}`);
    }

    const data = await res.json();
    return { success: true, faceId: data.faceId, message: data.message ?? 'Registered successfully' };
  } catch (err) {
    return {
      success: false,
      message: `Registration error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}