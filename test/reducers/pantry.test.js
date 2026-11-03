// Reducer unit test — pure, no renderer, no providers. This is the cheapest
// and most stable kind of test: it imports the slice reducer + actions and
// asserts state transitions directly.
//
// Reference for writing your own: import the default reducer and the named
// actions, then call `reducer(state, action(payload))` and assert on the
// returned `.value`.

import reducer, {
  setPantry,
  addItem,
  updateItem,
  removeItem,
  setLoading,
  setError,
  clearPantry,
} from '../../reducers/pantry';

describe('pantry slice', () => {
  // The reducer's own initial state — obtained by calling it with undefined.
  const initial = reducer(undefined, { type: '@@INIT' });

  it('has the canonical { value: { items, loading, error } } initial state', () => {
    expect(initial).toEqual({
      value: { items: [], loading: false, error: null },
    });
  });

  it('setPantry replaces items and clears error (with ?? [] guard)', () => {
    const withError = reducer(initial, setError('boom'));
    const next = reducer(withError, setPantry([{ _id: 'a' }, { _id: 'b' }]));
    expect(next.value.items).toHaveLength(2);
    expect(next.value.error).toBeNull();

    // `setPantry(undefined)` must not crash — falls back to [].
    const cleared = reducer(next, setPantry(undefined));
    expect(cleared.value.items).toEqual([]);
  });

  it('addItem inserts a new item at its name place and replaces in place on duplicate _id', () => {
    const named = (_id, name) => ({ _id, qty: 1, ingredient: { name } });
    let state = reducer(initial, addItem(named('x', 'tomato')));
    state = reducer(state, addItem(named('y', 'Égg')));
    state = reducer(state, addItem(named('z', 'rice')));
    state = reducer(state, addItem(named('w', 'zucchini')));
    // Same order as GET /inventory (plan 013): by name, accents ignored.
    expect(state.value.items.map((i) => i._id)).toEqual(['y', 'z', 'x', 'w']);
    state = reducer(initial, addItem({ _id: 'x', qty: 1 }));
    state = reducer(state, addItem({ _id: 'y', qty: 1 }));

    // Same _id → replace in place, no duplicate.
    state = reducer(state, addItem({ _id: 'x', qty: 99 }));
    expect(state.value.items).toHaveLength(2);
    expect(state.value.items.find((i) => i._id === 'x').qty).toBe(99);

    // Missing _id is a no-op.
    const before = state.value.items.length;
    state = reducer(state, addItem({ qty: 5 }));
    expect(state.value.items).toHaveLength(before);
  });

  it('updateItem merges patch into the matching item; unknown _id is a no-op', () => {
    let state = reducer(initial, setPantry([{ _id: 'x', qty: 1, name: 'eggs' }]));
    state = reducer(state, updateItem({ _id: 'x', patch: { qty: 12 } }));
    expect(state.value.items[0]).toEqual({ _id: 'x', qty: 12, name: 'eggs' });

    const snapshot = state.value.items;
    state = reducer(state, updateItem({ _id: 'nope', patch: { qty: 0 } }));
    expect(state.value.items).toEqual(snapshot);
  });

  it('removeItem filters by id and is a no-op for unknown ids', () => {
    let state = reducer(initial, setPantry([{ _id: 'a' }, { _id: 'b' }]));
    state = reducer(state, removeItem('a'));
    expect(state.value.items.map((i) => i._id)).toEqual(['b']);

    state = reducer(state, removeItem('ghost'));
    expect(state.value.items.map((i) => i._id)).toEqual(['b']);
  });

  it('setLoading / setError coerce their payloads', () => {
    let state = reducer(initial, setLoading(1));
    expect(state.value.loading).toBe(true);
    state = reducer(state, setError('disk full'));
    expect(state.value.error).toBe('disk full');
    state = reducer(state, setError(undefined));
    expect(state.value.error).toBeNull();
  });

  it('clearPantry resets the whole value, not just items', () => {
    let state = reducer(initial, setPantry([{ _id: 'a' }]));
    state = reducer(state, setLoading(true));
    state = reducer(state, setError('x'));
    state = reducer(state, clearPantry());
    expect(state.value).toEqual({ items: [], loading: false, error: null });
  });
});
