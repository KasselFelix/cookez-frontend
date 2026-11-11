// useRecentlyViewed — the signed-in user's last viewed recipes, reloaded each
// time the screen gains focus.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import addressIp from '../modules/addressIp';
import { authHeaders } from '../modules/authHeaders';

/**
 * @param {string|undefined} token - session token; none means an empty list
 * @returns {object[]}
 */
export default function useRecentlyViewed(token) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  // Only the latest request may write: an older answer, or one for a session
  // closed since, is dropped.
  const requestRef = useRef(0);

  const fetchRecentlyViewed = useCallback(async () => {
    const request = ++requestRef.current;
    if (!token) {
      setRecentlyViewed([]);
      return;
    }
    let recipes = [];
    try {
      const response = await fetch(`${addressIp}/users/me/last-viewed`, {
        headers: authHeaders(token),
      });
      const data = await response.json();
      if (data?.result && Array.isArray(data.recipes)) recipes = data.recipes;
    } catch {
      // Keep the empty list.
    }
    if (request === requestRef.current) setRecentlyViewed(recipes);
  }, [token]);

  useFocusEffect(useCallback(() => { fetchRecentlyViewed(); }, [fetchRecentlyViewed]));

  return recentlyViewed;
}
