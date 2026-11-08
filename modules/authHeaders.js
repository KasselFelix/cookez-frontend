// Every authenticated API call builds its headers here: the session token
// travels in the Authorization header only, never in a URL or a body
// (plan 010, S1, S2 and S6). test/security/authHeader.test.js checks that each
// authenticated route is called through these helpers.

/**
 * Authorization header alone: GET, DELETE without a body, multipart upload
 * (fetch sets the multipart Content-Type and its boundary itself).
 * Without a token, no header, so the server treats the call as a guest one.
 * @param {string | null | undefined} token Session token.
 * @returns {Record<string, string>}
 */
export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Authorization header and a JSON Content-Type, for a call with a JSON body.
 * @param {string | null | undefined} token Session token.
 * @returns {Record<string, string>}
 */
export function jsonAuthHeaders(token) {
  return { 'Content-Type': 'application/json', ...authHeaders(token) };
}
