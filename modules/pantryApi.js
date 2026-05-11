import addressIp from './addressIp';

// Why a thin wrapper instead of calling fetch from screens?
//   1. The backend uses a dual error channel: HTTP status codes for auth /
//      not-found / server errors AND `{ result: false, error }` on a 200
//      for validation failures. Screens shouldn't have to know that
//      distinction — `ok === false` covers both.
//   2. fetch() itself rejects on network failure (no DNS, airplane mode,
//      …). Wrapping every call in try/catch here means the UI never sees
//      a thrown promise and can rely on `const { ok, data, error } = ...`
//      without writing its own try/catch around every dispatch.

const buildHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// Some error paths (502 from Vercel cold-start, network errors that still
// return a response shell) don't carry a JSON body. Swallow the parse
// error and let the caller fall back to the HTTP status string.
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const handle = async (res) => {
  const data = await safeJson(res);
  // Treat backend `{ result: false }` the same as a non-2xx response —
  // screens only care whether the call succeeded, not which layer failed.
  if (!res.ok || (data && data.result === false)) {
    return {
      ok: false,
      data: null,
      error: (data && data.error) || `HTTP ${res.status}`,
    };
  }
  return { ok: true, data, error: null };
};

// GET /inventory → { result, items: PantryItem[] }
export const getPantry = async (token) => {
  try {
    const res = await fetch(`${addressIp}/inventory`, {
      headers: buildHeaders(token),
    });
    return handle(res);
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
};

// POST /inventory → { result, item: PantryItem }
// `body` shape: { ingredientId, quantity, unit, storageLocation?, expiryDate? }
export const addPantryItem = async (token, body) => {
  try {
    const res = await fetch(`${addressIp}/inventory`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    });
    return handle(res);
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
};

// PATCH /inventory/:itemId → { result, item: PantryItem }
// `body` is a partial patch — only changed fields.
export const updatePantryItem = async (token, itemId, body) => {
  try {
    const res = await fetch(`${addressIp}/inventory/${itemId}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    });
    return handle(res);
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
};

// DELETE /inventory/:itemId → { result: true }
export const removePantryItem = async (token, itemId) => {
  try {
    const res = await fetch(`${addressIp}/inventory/${itemId}`, {
      method: 'DELETE',
      headers: buildHeaders(token),
    });
    return handle(res);
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
};

// GET /ingredients/search?q=&limit=20 → { result, ingredients: [{ _id, name, photoUrl }] }
// Backend caps at 20 server-side too, but we send it explicitly so the
// contract is visible in the client.
export const searchIngredients = async (token, query) => {
  try {
    const q = encodeURIComponent(query || '');
    const res = await fetch(
      `${addressIp}/ingredients/search?q=${q}&limit=20`,
      { headers: buildHeaders(token) },
    );
    return handle(res);
  } catch (e) {
    return { ok: false, data: null, error: e.message };
  }
};
