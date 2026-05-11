import { createSlice } from '@reduxjs/toolkit';

// Why mirror the .value shape used by other slices?
//   Every existing slice exposes its data under `state.<slice>.value.*`.
//   Keeping that contract means selectors stay uniform across the app
//   (`useSelector((s) => s.pantry.value.items)`) and avoids breaking the
//   convention shared with `user`, `recipe`, `notifications`, etc.
const initialState = {
  value: {
    items: [],     // PantryItem[] — populated docs from /inventory
    loading: false,
    error: null,
  },
};

export const pantrySlice = createSlice({
  name: 'pantry',
  initialState,
  reducers: {
    // Full replace — used by the initial fetch and pull-to-refresh.
    // The `?? []` guard means screens can safely dispatch
    // `setPantry(response.data?.items)` without a null check.
    setPantry: (state, action) => {
      state.value.items = action.payload ?? [];
      state.value.error = null;
    },

    // Optimistic insert after POST /inventory. If the same `_id` is
    // already present (rare race: optimistic add followed by server echo)
    // replace in place so we don't end up with duplicates in the list.
    addItem: (state, action) => {
      const item = action.payload;
      if (!item?._id) return;
      const i = state.value.items.findIndex((x) => x._id === item._id);
      if (i >= 0) state.value.items[i] = item;
      else state.value.items.unshift(item);
    },

    // Partial update — the screen sends `{ _id, patch }` rather than the
    // full doc so we can merge fields (quantity bumps, expiry edits, …)
    // without losing populated relations like `ingredient.image`.
    // Unknown `_id` is a no-op — never crash on a stale id.
    updateItem: (state, action) => {
      const { _id, patch } = action.payload || {};
      if (!_id || !patch) return;
      const i = state.value.items.findIndex((x) => x._id === _id);
      if (i >= 0) state.value.items[i] = { ...state.value.items[i], ...patch };
    },

    // Remove by id — filter is a no-op when the id is unknown, so
    // double-deletes during pessimistic UI flows stay safe.
    removeItem: (state, action) => {
      state.value.items = state.value.items.filter((x) => x._id !== action.payload);
    },

    setLoading: (state, action) => {
      state.value.loading = !!action.payload;
    },

    setError: (state, action) => {
      state.value.error = action.payload ?? null;
    },

    // Reset on logout — drop everything, not just items, so a fresh
    // login doesn't inherit a stale `loading` or `error` flag.
    clearPantry: (state) => {
      state.value = { items: [], loading: false, error: null };
    },
  },
});

export const {
  setPantry,
  addItem,
  updateItem,
  removeItem,
  setLoading,
  setError,
  clearPantry,
} = pantrySlice.actions;

export default pantrySlice.reducer;
