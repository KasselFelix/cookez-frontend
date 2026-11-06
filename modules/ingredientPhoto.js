import addressIp from './addressIp';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The only ingredient image the app can load: an http(s) URL. A legacy bare
 * filename ("strawberry.jpg") or an empty string gives null.
 *
 * @param {unknown} url
 * @returns {string | null}
 */
export const loadableImage = (url) =>
  typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;

// One request per ingredient id for the app's lifetime; a failure is forgotten
// so a later screen can try again.
const requests = new Map();

/**
 * Catalog photo of an ingredient, through GET /ingredients/:id/photo: the
 * backend's Pexels cache, the single image source of Kickoff and Recap.
 *
 * @param {string} id Catalog ingredient id.
 * @returns {Promise<string | null>} Photo URL, or null when there is none.
 */
export function fetchIngredientPhoto(id) {
  if (typeof id !== 'string' || !OBJECT_ID.test(id)) return Promise.resolve(null);
  if (!requests.has(id)) {
    const request = fetch(`${addressIp}/ingredients/${id}/photo`)
      .then((response) => response.json())
      .then((data) => (data?.result ? loadableImage(data.photoUrl) : null))
      .catch(() => {
        requests.delete(id);
        return null;
      });
    requests.set(id, request);
  }
  return requests.get(id);
}

/** Test helper: forget the cached requests. */
export const resetIngredientPhotoCache = () => requests.clear();
