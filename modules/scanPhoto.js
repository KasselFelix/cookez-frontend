import { analyzePhotoWithRetry } from './visionApi';
import { loadableImage } from './ingredientPhoto';
import { addIngredient } from '../reducers/ingredient';
import { addScanPhoto, addUnmatched, removeScanPhoto, setScanPhotoStatus } from '../reducers/scan';

let sequence = 0;

const samePantryIngredient = (item, id) => {
  const pid = item?.ingredient?._id || item?.ingredient;
  return Boolean(pid) && String(pid) === String(id);
};

/**
 * Ingredient slice entry for a recognized ingredient: catalog id and photo,
 * quantity from the pantry when the user has it (as a pick from the search),
 * and a flag when the user should check it.
 *
 * @param {import('./visionApi').VisionIngredient} found
 * @param {object[]} pantryItems state.pantry.value.items
 */
export function toIngredientEntry(found, pantryItems = []) {
  const baseUnit = found.defaultUnit || 'g';
  const pantryItem = pantryItems.find((item) => samePantryIngredient(item, found._id));
  return {
    photo: loadableImage(found.photoUrl),
    data: {
      _id: found._id,
      display_name: found.name,
      g_per_serving: pantryItem ? pantryItem.quantity : found.quantity,
      defaultUnit: baseUnit,
      unit: pantryItem?.unit || baseUnit,
      // The catalog quantity to go back to if the pantry item goes away.
      referenceQuantity: found.quantity,
      fromPantry: Boolean(pantryItem),
      nutrition: found.nutrition,
      toConfirm: Boolean(found.confirm) || found.confidence === 'low',
    },
  };
}

/**
 * Thunk: adds the photo to the scan slice and analyses it in the background
 * (plan 015). The answer of a photo removed meanwhile is ignored.
 *
 * @param {{ uri: string, token: string }} photo
 * @param {{ analyze?: typeof analyzePhotoWithRetry }} [options] `analyze` is replaced in tests.
 */
export const scanPhoto =
  ({ uri, token }, { analyze = analyzePhotoWithRetry } = {}) =>
  async (dispatch, getState) => {
    sequence += 1;
    const id = `scan-${Date.now()}-${sequence}`;
    dispatch(addScanPhoto({ id, uri }));

    const result = await analyze(uri, token);
    const state = getState();
    if (!state.scan.value.photos.some((photo) => photo.id === id)) return;

    if (result.status !== 'ok') {
      // An expired session asks the user to sign in again, not to retry.
      const status = result.status === 'quota' ? 'quota' : result.status === 'unauthorized' ? 'signedOut' : 'error';
      dispatch(setScanPhotoStatus({ id, status }));
      return;
    }
    const pantryItems = state.pantry?.value?.items || [];
    for (const found of result.ingredients) {
      dispatch(addIngredient(toIngredientEntry(found, pantryItems)));
    }
    dispatch(addUnmatched(result.unmatched));
    if (result.ingredients.length === 0 && result.unmatched.length === 0) {
      dispatch(setScanPhotoStatus({ id, status: 'empty' }));
    } else {
      dispatch(removeScanPhoto(id));
    }
  };
