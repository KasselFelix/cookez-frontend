/* global jest, describe, it, expect */
// Plan 015: a photo is analysed as soon as it is taken; its ingredients enter the
// ingredient slice with the catalog id and photo, its unknown names wait for a
// search, and the answer of a deleted photo is ignored.
import { makeStore } from '../helpers/renderWithProviders';
import { scanPhoto, toIngredientEntry } from '../../modules/scanPhoto';
import { removeScanPhoto } from '../../reducers/scan';

const TOMATO = {
  _id: 'a'.repeat(24),
  name: 'tomato',
  photoUrl: 'https://cdn.example/tomato.jpg',
  defaultUnit: 'unit',
  quantity: 120,
  nutrition: { calories_100g: 18 },
  confidence: 'high',
  confirm: false,
};
const CHEDDAR = { ...TOMATO, _id: 'b'.repeat(24), name: 'cheddar cheese', photoUrl: null, defaultUnit: 'g', confirm: true };
const GARLIC = { ...TOMATO, _id: 'c'.repeat(24), name: 'garlic', confidence: 'low' };

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

describe('toIngredientEntry', () => {
  it('keeps the catalog id and photo, and flags what to confirm', () => {
    expect(toIngredientEntry(TOMATO)).toEqual({
      photo: 'https://cdn.example/tomato.jpg',
      data: {
        _id: TOMATO._id,
        display_name: 'tomato',
        g_per_serving: 120,
        defaultUnit: 'unit',
        unit: 'unit',
        referenceQuantity: 120,
        fromPantry: false,
        nutrition: { calories_100g: 18 },
        toConfirm: false,
      },
    });
    expect(toIngredientEntry(CHEDDAR).data.toConfirm).toBe(true);
    expect(toIngredientEntry(GARLIC).data.toConfirm).toBe(true);
    expect(toIngredientEntry(CHEDDAR).photo).toBeNull();
  });

  it('takes the quantity and unit of the pantry when the user has the ingredient', () => {
    const pantry = [{ ingredient: { _id: TOMATO._id }, quantity: 3, unit: 'unit' }];
    expect(toIngredientEntry({ ...TOMATO, defaultUnit: 'g' }, pantry).data).toMatchObject({
      g_per_serving: 3,
      unit: 'unit',
      referenceQuantity: 120,
      fromPantry: true,
    });
  });
});

describe('scanPhoto', () => {
  it('shows the photo as pending, then replaces it with its ingredients', async () => {
    const store = makeStore();
    const answer = deferred();
    const analyze = jest.fn(() => answer.promise);
    const done = store.dispatch(scanPhoto({ uri: 'file:///1.jpg', token: 'tok' }, { analyze }));

    expect(analyze).toHaveBeenCalledWith('file:///1.jpg', 'tok');
    expect(store.getState().scan.value.photos).toEqual([expect.objectContaining({ uri: 'file:///1.jpg', status: 'pending' })]);

    answer.resolve({ status: 'ok', ingredients: [TOMATO, CHEDDAR], unmatched: ['yuzu kosho'] });
    await done;

    const state = store.getState();
    expect(state.scan.value.photos).toEqual([]);
    expect(state.scan.value.unmatched).toEqual(['yuzu kosho']);
    expect(state.ingredient.value.map((i) => [i.data._id, i.data.display_name, i.data.toConfirm])).toEqual([
      [TOMATO._id, 'tomato', false],
      [CHEDDAR._id, 'cheddar cheese', true],
    ]);
  });

  it('ignores the answer of a photo deleted before it came', async () => {
    const store = makeStore();
    const answer = deferred();
    const done = store.dispatch(scanPhoto({ uri: 'file:///2.jpg', token: 't' }, { analyze: () => answer.promise }));
    const { id } = store.getState().scan.value.photos[0];
    store.dispatch(removeScanPhoto(id));

    answer.resolve({ status: 'ok', ingredients: [TOMATO], unmatched: ['yuzu'] });
    await done;

    expect(store.getState().ingredient.value).toEqual([]);
    expect(store.getState().scan.value).toEqual({ photos: [], unmatched: [], pendingSearch: null });
  });

  it.each([
    ['quota', 'quota'],
    ['error', 'error'],
    ['unauthorized', 'error'],
  ])('keeps the photo with status %s → %s', async (status, expected) => {
    const store = makeStore();
    await store.dispatch(scanPhoto({ uri: 'file:///3.jpg', token: 't' }, { analyze: async () => ({ status }) }));
    expect(store.getState().scan.value.photos).toEqual([expect.objectContaining({ status: expected })]);
  });

  it('marks a photo without food as empty', async () => {
    const store = makeStore();
    await store.dispatch(
      scanPhoto({ uri: 'file:///4.jpg', token: 't' }, { analyze: async () => ({ status: 'ok', ingredients: [], unmatched: [] }) })
    );
    expect(store.getState().scan.value.photos).toEqual([expect.objectContaining({ status: 'empty' })]);
  });

  it('runs several photos at once, each with its own answer', async () => {
    const store = makeStore();
    const first = deferred();
    const second = deferred();
    const answers = [first, second];
    const analyze = jest.fn(() => answers.shift().promise);
    const a = store.dispatch(scanPhoto({ uri: 'file:///a.jpg', token: 't' }, { analyze }));
    const b = store.dispatch(scanPhoto({ uri: 'file:///b.jpg', token: 't' }, { analyze }));
    expect(store.getState().scan.value.photos).toHaveLength(2);

    second.resolve({ status: 'ok', ingredients: [GARLIC], unmatched: [] });
    await b;
    expect(store.getState().scan.value.photos.map((p) => p.uri)).toEqual(['file:///a.jpg']);

    first.resolve({ status: 'quota' });
    await a;
    expect(store.getState().scan.value.photos).toEqual([expect.objectContaining({ uri: 'file:///a.jpg', status: 'quota' })]);
    expect(store.getState().ingredient.value.map((i) => i.data.display_name)).toEqual(['garlic']);
  });
});
