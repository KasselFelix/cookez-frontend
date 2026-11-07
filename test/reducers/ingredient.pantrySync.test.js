/* global describe, it, expect */
// A picked ingredient that started from the pantry quantity goes back to the
// catalog reference once its pantry item is deleted. Reported on 2026-11-06:
// 5 tomatoes deleted from the pantry, a new scan still showed "5 unit" in Recap
// until a logout.
import { makeStore } from '../helpers/renderWithProviders';
import { scanPhoto } from '../../modules/scanPhoto';
import { addIngredient, syncIngredientsWithPantry, updateIngredientQuantity } from '../../reducers/ingredient';

const TOMATO_ID = 'a'.repeat(24);
const TOMATO = {
  _id: TOMATO_ID,
  name: 'tomato',
  photoUrl: null,
  defaultUnit: 'g',
  quantity: 120,
  confidence: 'high',
  confirm: false,
};
const pantryTomatoes = (quantity = 5) => [{ _id: 'p1', ingredient: { _id: TOMATO_ID, name: 'tomato', defaultUnit: 'g' }, quantity, unit: 'unit' }];
const pantryState = (items) => ({ pantry: { value: { items, loading: false, error: null } } });
const tomatoData = (store) => store.getState().ingredient.value.find((i) => i.data._id === TOMATO_ID)?.data;
const scanTomato = (store) =>
  store.dispatch(
    scanPhoto({ uri: 'file:///t.jpg', token: 't' }, { analyze: async () => ({ status: 'ok', ingredients: [TOMATO], unmatched: [] }) })
  );

describe('syncIngredientsWithPantry', () => {
  it('reproduces the report: scan, pantry item deleted, back on Kickoff, then a new scan', async () => {
    const store = makeStore(pantryState(pantryTomatoes()));
    await scanTomato(store);
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 5, unit: 'unit', fromPantry: true });

    // Pantry item deleted in Profile, then Kickoff gets the focus again.
    store.dispatch(syncIngredientsWithPantry([]));
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 120, unit: 'g', fromPantry: false });

    await scanTomato(store);
    expect(store.getState().ingredient.value).toHaveLength(1);
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 120, unit: 'g' });
  });

  it('follows a pantry quantity change', async () => {
    const store = makeStore(pantryState(pantryTomatoes()));
    await scanTomato(store);
    store.dispatch(syncIngredientsWithPantry(pantryTomatoes(3)));
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 3, unit: 'unit', fromPantry: true });
  });

  it('switches an ingredient picked from the catalog to the pantry once the user owns it, and back', () => {
    const store = makeStore();
    store.dispatch(addIngredient({ photo: null, data: { _id: TOMATO_ID, display_name: 'tomato', g_per_serving: 120, defaultUnit: 'g', unit: 'g' } }));
    store.dispatch(syncIngredientsWithPantry(pantryTomatoes()));
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 5, unit: 'unit', referenceQuantity: 120, fromPantry: true });
    store.dispatch(syncIngredientsWithPantry([]));
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 120, unit: 'g', fromPantry: false });
  });

  it('keeps a quantity the user typed for an ingredient the pantry does not have', () => {
    const store = makeStore();
    store.dispatch(addIngredient({ photo: null, data: { _id: TOMATO_ID, display_name: 'tomato', g_per_serving: 120, defaultUnit: 'g', unit: 'g', fromPantry: false } }));
    store.dispatch(updateIngredientQuantity({ display_name: 'tomato', quantity: 300 }));
    store.dispatch(syncIngredientsWithPantry([]));
    expect(tomatoData(store)).toMatchObject({ g_per_serving: 300, unit: 'g' });
  });
});
