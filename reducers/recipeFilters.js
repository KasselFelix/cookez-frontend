import { createSlice } from '@reduxjs/toolkit';

// Why the `.value` wrapper?
//   Every slice in this project exposes its data under `state.<slice>.value`,
//   which keeps selectors uniform across the app and lets reducers swap the
//   whole payload (`state.value = …`) without losing the meta wrapper.
//
// This slice replaces the old `origin` slice. Origin used to be a single
// scalar; it now lives alongside two new fields:
//   - `selectedTags`     → multi-select diet/cuisine filters (Phase B+)
//   - `currentServings`  → user-overridden serving count for the next
//                          /recipes/result call. `null` means "use the
//                          backend default" so we never have to special-case
//                          "no override" with a sentinel like 0.
const initialState = {
  value: {
    selectedOrigin: null,   // string | null
    selectedTags: [],       // string[] (multi-select)
    currentServings: null,  // number | null — null = "use backend default"
  },
};

const recipeFiltersSlice = createSlice({
  name: 'recipeFilters',
  initialState,
  reducers: {
    setOrigin: (state, action) => {
      state.value.selectedOrigin = action.payload;
    },
    clearOrigin: (state) => {
      state.value.selectedOrigin = null;
    },
    // Toggle a tag in/out of the multi-select set. Using indexOf+splice keeps
    // RTK's Immer happy (mutating draft in place) without rebuilding the array.
    toggleTag: (state, action) => {
      const tag = action.payload;
      const i = state.value.selectedTags.indexOf(tag);
      if (i >= 0) state.value.selectedTags.splice(i, 1);
      else state.value.selectedTags.push(tag);
    },
    setTags: (state, action) => {
      state.value.selectedTags = action.payload;
    },
    clearTags: (state) => {
      state.value.selectedTags = [];
    },
    setServings: (state, action) => {
      state.value.currentServings = action.payload;
    },
    // Clamp to [1, 12]. `?? 1` keeps the math sane when no override is set
    // yet (null → treat as 1, then bump).
    incrementServings: (state) => {
      state.value.currentServings = Math.min((state.value.currentServings ?? 1) + 1, 12);
    },
    decrementServings: (state) => {
      state.value.currentServings = Math.max((state.value.currentServings ?? 1) - 1, 1);
    },
    resetFilters: (state) => {
      state.value = initialState.value;
    },
  },
});

export const {
  setOrigin,
  clearOrigin,
  toggleTag,
  setTags,
  clearTags,
  setServings,
  incrementServings,
  decrementServings,
  resetFilters,
} = recipeFiltersSlice.actions;
export default recipeFiltersSlice.reducer;
