import addressIp from './addressIp';
import { authHeaders } from './authHeaders';

// Longest wait the app accepts before its single retry of a busy answer.
const MAX_RETRY_WAIT_S = 30;
// A request that never reached the server is retried once after this delay.
// Seen on Android: the first photo after the camera opens can fail to upload
// right away, then goes through.
const NETWORK_RETRY_MS = 1000;

/**
 * @typedef {{ _id: string, name: string, photoUrl: string | null, defaultUnit: string,
 *   quantity?: number, nutrition?: object, confidence: 'high'|'medium'|'low', confirm: boolean }} VisionIngredient
 * @typedef {{ status: 'ok', ingredients: VisionIngredient[], unmatched: string[] }
 *   | { status: 'busy', retryAfter: number }
 *   | { status: 'quota' } | { status: 'unauthorized' } | { status: 'network' } | { status: 'error' }} VisionResult
 */

/**
 * Sends one photo to POST /vision/analyze (plan 015): the backend holds the
 * vision key, the app only sends its session token, in the header.
 *
 * @param {string} uri Local file of the photo.
 * @param {string} token Session token.
 * @returns {Promise<VisionResult>}
 */
export async function analyzePhoto(uri, token) {
  const body = new FormData();
  body.append('image', { uri, type: 'image/jpeg', name: 'photo.jpg' });
  try {
    // No Content-Type: fetch sets the multipart boundary itself.
    const response = await fetch(`${addressIp}/vision/analyze`, {
      method: 'POST',
      headers: authHeaders(token),
      body,
    });
    if (response.status === 401) return { status: 'unauthorized' };
    if (response.status === 429) return { status: 'quota' };
    if (response.status === 503) {
      const retryAfter = Number(response.headers?.get?.('Retry-After'));
      return { status: 'busy', retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5 };
    }
    if (!response.ok) return { status: 'error' };
    const data = await response.json();
    if (!data?.result || !Array.isArray(data.ingredients)) return { status: 'error' };
    return {
      status: 'ok',
      ingredients: data.ingredients,
      unmatched: Array.isArray(data.unmatched) ? data.unmatched : [],
    };
  } catch {
    return { status: 'network' };
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * analyzePhoto, retried once: after Retry-After when the provider is busy,
 * after a second when the request never reached the server.
 *
 * @param {string} uri
 * @param {string} token
 * @param {{ wait?: (ms: number) => Promise<void> }} [options] `wait` is replaced in tests.
 * @returns {Promise<VisionResult>} never `busy` nor `network`: a second failure is an error.
 */
export async function analyzePhotoWithRetry(uri, token, { wait = sleep } = {}) {
  const first = await analyzePhoto(uri, token);
  if (first.status === 'busy') await wait(Math.min(first.retryAfter, MAX_RETRY_WAIT_S) * 1000);
  else if (first.status === 'network') await wait(NETWORK_RETRY_MS);
  else return first;
  const second = await analyzePhoto(uri, token);
  return second.status === 'busy' || second.status === 'network' ? { status: 'error' } : second;
}
