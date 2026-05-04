import { createSlice } from '@reduxjs/toolkit';

// Why mirror the .value shape used by other slices?
//   The rest of the app reads `state.<slice>.value.<field>` everywhere.
//   Keeping the convention avoids churn in selector code and stays
//   consistent with `user`, `recipe`, `comment`, …
const initialState = {
  value: {
    items: [],          // Notification[] (newest first)
    unread: 0,
    lastFetched: null,  // ISO string of the last successful fetch
    hasMore: true,      // pagination cursor exhausted?
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Replace the list — used by pull-to-refresh and the initial load.
    setNotifications: (state, action) => {
      const { items = [], unread, hasMore = true } = action.payload || {};
      state.value.items = items;
      state.value.unread = typeof unread === 'number' ? unread : countUnread(items);
      state.value.hasMore = hasMore;
      state.value.lastFetched = new Date().toISOString();
    },

    // Insert a fresh notification at the top (e.g., websocket-ish push).
    prependNotification: (state, action) => {
      const notif = action.payload;
      if (!notif?._id) return;
      // Avoid duplicates if the same _id already lives in the list.
      const existing = state.value.items.findIndex((n) => n._id === notif._id);
      if (existing !== -1) {
        state.value.items[existing] = notif;
        return;
      }
      state.value.items.unshift(notif);
      if (!notif.read) state.value.unread += 1;
    },

    // Pagination: append older items at the tail.
    appendNotifications: (state, action) => {
      const { items = [], hasMore = false } = action.payload || {};
      const known = new Set(state.value.items.map((n) => n._id));
      const filtered = items.filter((n) => n?._id && !known.has(n._id));
      state.value.items.push(...filtered);
      state.value.hasMore = hasMore;
    },

    // Mark a subset by id; the unread counter is recalculated locally.
    markRead: (state, action) => {
      const ids = action.payload || [];
      if (!ids.length) return;
      const set = new Set(ids);
      state.value.items = state.value.items.map((n) =>
        set.has(n._id) && !n.read ? { ...n, read: true } : n,
      );
      state.value.unread = countUnread(state.value.items);
    },

    markAllRead: (state) => {
      state.value.items = state.value.items.map((n) => ({ ...n, read: true }));
      state.value.unread = 0;
    },

    // Lets the API response override the local count when the server
    // is the authority (e.g., it dedupes deletions we don't see).
    setUnread: (state, action) => {
      const next = Number(action.payload);
      state.value.unread = Number.isFinite(next) ? Math.max(0, next) : 0;
    },

    clearNotifications: () => initialState,
  },
});

function countUnread(items) {
  return items.reduce((acc, n) => (n.read ? acc : acc + 1), 0);
}

export const {
  setNotifications,
  prependNotification,
  appendNotifications,
  markRead,
  markAllRead,
  setUnread,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
