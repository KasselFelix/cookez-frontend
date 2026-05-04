import { createSlice } from '@reduxjs/toolkit';

import { applyLocale } from '../i18n';

// Mirrors the persistent state in AsyncStorage (`userLocale`):
//   - 'system' → use device locale, fall back to 'en'
//   - 'en' / 'fr' → explicit override
//
// The redux store holds *only* the user-selected mode. The actual
// resolved 2-letter locale lives on the i18n-js singleton.
const initialState = {
  value: { lang: 'system' },
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLocale: (state, action) => {
      const next = action.payload || 'system';
      state.value.lang = next;
      // Side-effect: keep the i18n-js singleton in sync immediately so
      // any non-React code path picks up the change. Persistence is the
      // caller's responsibility (use `setLocale` from i18n/index.js to
      // both persist and apply).
      applyLocale(next);
    },
  },
});

export const { setLocale } = localeSlice.actions;
export default localeSlice.reducer;
