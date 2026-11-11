// useRecentlyViewed — the signed-in user's last viewed recipes, reloaded each
// time the screen gains focus.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import addressIp from '../modules/addressIp';
import { authHeaders } from '../modules/authHeaders';

/**
 * @param {string|undefined} token - session token; none means an empty list
 * @returns {object[]}
 */
export default function useRecentlyViewed(token) {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const fetchRecentlyViewed = useCallback(async () => {
    if (!token) {
      setRecentlyViewed([]);
      return;
    }
    try {
      const response = await fetch(`${addressIp}/users/me/last-viewed`, {
        headers: authHeaders(token),
      });
      const data = await response.json();
      setRecentlyViewed(data?.result && Array.isArray(data.recipes) ? data.recipes : []);
    } catch {
      setRecentlyViewed([]);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchRecentlyViewed(); }, [fetchRecentlyViewed]));

  return recentlyViewed;
}
