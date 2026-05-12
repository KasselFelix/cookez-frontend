import { createSlice } from '@reduxjs/toolkit';

// Why a dedicated slice for "app config" rather than wedging this into `user`?
//   amazonConfig is server-driven, public, and shared across all users —
//   it lives at the response level of /recipes/result, not on the user
//   document. Stashing it here lets the RecipeScreen's Amazon button build
//   affiliate URLs without an extra fetch, and keeps the `user` slice
//   strictly about the authenticated identity.
const initialState = {
  value: {
    amazonConfig: { tag_fr: null, tag_com: null },
  },
};

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setAmazonConfig: (state, action) => {
      // Fall back to the empty shape so consumers can always read
      // `amazonConfig.tag_fr` without a null guard.
      state.value.amazonConfig = action.payload || initialState.value.amazonConfig;
    },
  },
});

export const { setAmazonConfig } = appConfigSlice.actions;
export default appConfigSlice.reducer;
