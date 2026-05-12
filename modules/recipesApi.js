import addressIp from './addressIp';

// Centralized client for Plan 003's recipe-related endpoints.
//
// Why a dedicated module instead of inlining fetch in screens?
//   ResultScreen used to assemble the payload, hit /recipes/result, and
//   parse the response inline — Phase B adds two more endpoints
//   (origins, settings) plus a new `manualServings` field on the result
//   call. Without a centralized client we'd duplicate the payload-shaping
//   logic in every screen that needs filters.
//
// All functions return the parsed JSON body directly — callers handle
// `data.result === false` themselves, matching the existing app
// convention (pantryApi is the only module wrapping errors more
// aggressively, and only because pantry mutates locally).

// Build the /recipes/result POST body. Accepts the ingredient cards
// straight from the redux `ingredient` slice — which can come in two
// shapes depending on whether they originated from the pantry (`data.*`
// snapshot) or were added manually. The optional chains absorb both.
export async function fetchRecipeResult({
  token,
  ingredients,
  filters,
  allergy,
  signal,
}) {
  const payload = {
    token: token || undefined,
    ingredients: (ingredients || []).map((i) => ({
      _id: i.data?._id || i._id,
      name: i.data?.display_name || i.name,
      quantity: i.data?.g_per_serving ?? i.quantity ?? 100,
    })),
    allergy,
    origin: filters?.selectedOrigin || 'All recipes',
    tagsFilter: filters?.selectedTags || [],
    manualServings: filters?.currentServings ?? undefined,
  };

  const res = await fetch(`${addressIp}/recipes/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  return res.json();
}

// GET /recipes/origins — returns the list of cuisines for the filter
// picker. Public endpoint (no token). `signal` lets the caller cancel
// when the screen unmounts before the response lands.
export async function fetchOrigins({ signal } = {}) {
  const res = await fetch(`${addressIp}/recipes/origins`, { signal });
  return res.json();
}

// PATCH /users/settings — partial update. The backend accepts any
// subset of the user-settings keys, so callers pass only what they
// changed (e.g. `{ allergy: [...] }` or `{ pantryReminders: false }`).
export async function patchUserSettings({ token, partial }) {
  const res = await fetch(`${addressIp}/users/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(partial),
  });
  return res.json();
}
