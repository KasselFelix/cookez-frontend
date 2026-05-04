import { createSlice } from '@reduxjs/toolkit';

// Why a dedicated slice? Follow state is queried from many places
// (PublicProfileScreen, NotificationsScreen, eventually a feed) and
// it has a strong optimistic pattern: the UI flips instantly, the
// network request commits or rolls back. Keeping a single source of
// truth here prevents stale state drift between screens.
//
// Shape:
//   followingByUsername: { [username: string]: boolean }
//   isLoading:           true while a follow/unfollow request is in-flight
//                        (last request only — coarse but enough)
const initialState = {
  value: {
    followingByUsername: {},
    isLoading: false,
  },
};

const followSlice = createSlice({
  name: 'follow',
  initialState,
  reducers: {
    // Bulk hydrate (e.g., after fetching the current user's profile).
    setFollowing: (state, action) => {
      const list = action.payload || [];
      state.value.followingByUsername = list.reduce((acc, name) => {
        if (typeof name === 'string') acc[name] = true;
        return acc;
      }, {});
    },

    // Optimistic flip — call this *before* the API request.
    setFollowOptimistic: (state, action) => {
      const { username, value } = action.payload || {};
      if (!username) return;
      state.value.followingByUsername[username] = !!value;
      state.value.isLoading = true;
    },

    // Commit (ok=true) or rollback (ok=false) once the API responds.
    commitFollow: (state, action) => {
      const { username, ok, value } = action.payload || {};
      state.value.isLoading = false;
      if (!username) return;
      if (ok) {
        state.value.followingByUsername[username] = !!value;
      } else {
        // Rollback by toggling: the optimistic write set it; we revert.
        state.value.followingByUsername[username] = !state.value.followingByUsername[username];
      }
    },

    clearFollow: () => initialState,
  },
});

export const {
  setFollowing,
  setFollowOptimistic,
  commitFollow,
  clearFollow,
} = followSlice.actions;

export default followSlice.reducer;
