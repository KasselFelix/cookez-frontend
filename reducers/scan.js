import { createSlice } from '@reduxjs/toolkit';

// Photos taken on Kickoff while their analysis runs (plan 015). Shared with
// Recap, which shows the analyses still running.
//   photos: [{ id, uri, status }], status one of
//     'pending' — sent to POST /vision/analyze, no answer yet;
//     'empty'   — analysed, no food found;
//     'error'   — network, server or provider failure;
//     'quota'   — the daily limit is reached.
//   A photo whose analysis found ingredients leaves the list: its ingredients
//   are in the ingredient slice, its unknown names in `unmatched`.
//   unmatched: names the catalog does not know, each a search to open.
//   pendingSearch: a name Recap asks Kickoff to search for.
const initialState = {
  value: { photos: [], unmatched: [], pendingSearch: null },
};

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    addScanPhoto: (state, action) => {
      const { id, uri } = action.payload;
      state.value.photos.push({ id, uri, status: 'pending' });
    },
    setScanPhotoStatus: (state, action) => {
      const { id, status } = action.payload;
      const photo = state.value.photos.find((p) => p.id === id);
      if (photo) photo.status = status;
    },
    removeScanPhoto: (state, action) => {
      state.value.photos = state.value.photos.filter((p) => p.id !== action.payload);
    },
    addUnmatched: (state, action) => {
      for (const name of action.payload || []) {
        if (typeof name !== 'string' || !name.trim()) continue;
        if (!state.value.unmatched.some((n) => sameName(n, name))) state.value.unmatched.push(name.trim());
      }
    },
    removeUnmatched: (state, action) => {
      state.value.unmatched = state.value.unmatched.filter((n) => !sameName(n, action.payload));
    },
    requestSearch: (state, action) => {
      state.value.pendingSearch = action.payload;
    },
    clearSearchRequest: (state) => {
      state.value.pendingSearch = null;
    },
    clearScan: (state) => {
      state.value = { photos: [], unmatched: [], pendingSearch: null };
    },
  },
});

export const {
  addScanPhoto,
  setScanPhotoStatus,
  removeScanPhoto,
  addUnmatched,
  removeUnmatched,
  requestSearch,
  clearSearchRequest,
  clearScan,
} = scanSlice.actions;
export default scanSlice.reducer;
