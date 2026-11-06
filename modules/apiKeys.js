// ─────────────────────────────────────────────
// API KEYS — sourced from environment variables
// Set these in .env (never commit actual values)
// ─────────────────────────────────────────────
// Foodvisor is the last key still read here; it leaves with the vision proxy
// (plan 015, part B). Ingredient photos go through the backend (part A).

export const FOODVISOR_API_KEY = process.env.EXPO_PUBLIC_FOODVISOR_KEY ?? '';
