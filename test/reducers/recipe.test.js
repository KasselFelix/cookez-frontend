// Plan 017, points 1 and 26 — the recipe slice keeps one table of known
// recipes and two lists of ids: the Dashboard catalog and the ResultScreen
// search. Each writer touches only its own list.

import reducer, {
  addCommentToRecipe,
  addRecipe,
  clearRecipes,
  removeRecipe,
  selectCatalogRecipes,
  selectResultRecipes,
  setCatalogRecipes,
  setRecipeDetail,
  setResultRecipes,
  updateCommentVotes,
  updateRecipeVote,
} from '../../reducers/recipe';

const initial = reducer(undefined, { type: '@@INIT' });
const asRoot = (recipe) => ({ recipe });
const names = (recipes) => recipes.map((r) => r.name);

const catalog = [
  {
    _id: 'c1',
    name: 'Golompke',
    ingredients: [{ ingredient: 'i1', quantity: 1 }],
    imageUrl: 'c1.jpg',
  },
  {
    _id: 'c2',
    name: 'Tarte Tatin',
    ingredients: [{ ingredient: 'i2', quantity: 1 }],
    imageUrl: 'c2.jpg',
  },
];

describe('recipe slice', () => {
  it('starts with an empty table and empty lists', () => {
    expect(initial).toEqual({ value: [], catalogIds: [], resultIds: [] });
  });

  it('a search result never empties or replaces the catalog (point 1)', () => {
    let state = reducer(initial, setCatalogRecipes(catalog));
    state = reducer(state, setResultRecipes([]));
    expect(names(selectCatalogRecipes(asRoot(state)))).toEqual(['Golompke', 'Tarte Tatin']);
    expect(selectResultRecipes(asRoot(state))).toEqual([]);

    state = reducer(
      state,
      setResultRecipes([
        { _id: 'r1', name: 'Apple Salad' },
        { _id: 'c2', name: 'Tarte Tatin' },
      ]),
    );
    expect(names(selectCatalogRecipes(asRoot(state)))).toEqual(['Golompke', 'Tarte Tatin']);
    expect(names(selectResultRecipes(asRoot(state)))).toEqual(['Apple Salad', 'Tarte Tatin']);
  });

  it('a reloaded catalog leaves the results in place', () => {
    let state = reducer(initial, setResultRecipes([{ _id: 'r1', name: 'Apple Salad' }]));
    state = reducer(state, setCatalogRecipes(catalog));
    expect(names(selectResultRecipes(asRoot(state)))).toEqual(['Apple Salad']);
  });

  it('a recipe opened from the profile joins neither list (point 26)', () => {
    let state = reducer(initial, setCatalogRecipes(catalog));
    state = reducer(state, setResultRecipes([{ _id: 'r1', name: 'Apple Salad' }]));
    state = reducer(state, setRecipeDetail({ _id: 'p1', name: 'Profile Pie', comments: [] }));
    state = reducer(state, addRecipe({ _id: 's1', name: 'Search hit' }));

    expect(names(selectCatalogRecipes(asRoot(state)))).toEqual(['Golompke', 'Tarte Tatin']);
    expect(names(selectResultRecipes(asRoot(state)))).toEqual(['Apple Salad']);
    expect(state.value.map((r) => r._id)).toEqual(expect.arrayContaining(['p1', 's1']));
  });

  it('merges a recipe met twice into one entry, without duplicates', () => {
    let state = reducer(initial, setCatalogRecipes([...catalog, catalog[0]]));
    expect(state.catalogIds).toEqual(['c1', 'c2']);
    state = reducer(
      state,
      setResultRecipes([{ _id: 'c1', name: 'Golompke', missingIngredients: ['x'] }]),
    );
    expect(state.value.filter((r) => r._id === 'c1')).toHaveLength(1);
    // The catalog field and the search field live side by side.
    expect(state.value.find((r) => r._id === 'c1')).toMatchObject({
      imageUrl: 'c1.jpg',
      missingIngredients: ['x'],
    });
  });

  it('a catalog copy with bare ingredient ids keeps the populated rows', () => {
    const populated = [{ ingredient: { _id: 'i1', display_name: 'cabbage' }, quantity: 1 }];
    let state = reducer(
      initial,
      setRecipeDetail({ _id: 'c1', name: 'Golompke', ingredients: populated }),
    );
    state = reducer(state, setCatalogRecipes(catalog));
    expect(state.value.find((r) => r._id === 'c1').ingredients).toEqual(populated);
  });

  it('a copy with bare comment ids keeps the comment objects', () => {
    const comments = [{ _id: 'k1', message: 'Great' }];
    let state = reducer(initial, setCatalogRecipes([{ _id: 'c1', name: 'Golompke', comments }]));
    state = reducer(state, setResultRecipes([{ _id: 'c1', name: 'Golompke', comments: ['k1'] }]));
    expect(state.value.find((r) => r._id === 'c1').comments).toEqual(comments);
  });

  it('addRecipe leaves a recipe already in the table untouched', () => {
    let state = reducer(
      initial,
      setCatalogRecipes([{ _id: 'c1', name: 'Golompke', votes: [{ note: 5 }] }]),
    );
    state = reducer(state, addRecipe({ _id: 'c1', name: 'Golompke', votes: [] }));
    expect(state.value).toEqual([{ _id: 'c1', name: 'Golompke', votes: [{ note: 5 }] }]);
  });

  it('a vote updates the recipe in both lists at once', () => {
    let state = reducer(initial, setCatalogRecipes(catalog));
    state = reducer(state, setResultRecipes([{ _id: 'c1', name: 'Golompke' }]));
    state = reducer(state, updateRecipeVote({ _id: 'c1', votes: [{ note: 5 }] }));
    expect(selectCatalogRecipes(asRoot(state))[0].votes).toEqual([{ note: 5 }]);
    expect(selectResultRecipes(asRoot(state))[0].votes).toEqual([{ note: 5 }]);
  });

  it('removeRecipe drops it from the table and both lists', () => {
    let state = reducer(initial, setCatalogRecipes(catalog));
    state = reducer(state, setResultRecipes([{ _id: 'c1', name: 'Golompke' }]));
    state = reducer(state, removeRecipe({ _id: 'c1' }));
    expect(state.value.map((r) => r._id)).toEqual(['c2']);
    expect(state.catalogIds).toEqual(['c2']);
    expect(state.resultIds).toEqual([]);
  });

  it('clearRecipes resets everything (logout)', () => {
    let state = reducer(initial, setCatalogRecipes(catalog));
    state = reducer(state, setResultRecipes([{ _id: 'r1' }]));
    expect(reducer(state, clearRecipes())).toEqual(initial);
  });

  it('selectors return the same array while nothing changed', () => {
    const state = reducer(initial, setCatalogRecipes(catalog));
    expect(selectCatalogRecipes(asRoot(state))).toBe(selectCatalogRecipes(asRoot(state)));
  });
});

// Plan 021: a comment keeps its counts only, from either backend shape.
describe('recipe slice comment votes', () => {
  const oldComment = {
    _id: 'k1',
    username: 'chef',
    message: 'Great',
    up: ['u1'],
    down: [],
    usersAlreadyUpVoted: ['alex'],
    usersAlreadyDownVoted: [],
  };
  const withComment = (comment) =>
    reducer(initial, setCatalogRecipes([{ _id: 'c1', name: 'Golompke', comments: [comment] }]));
  const commentOf = (state) => state.value[0].comments[0];

  it.each([
    ['new shape', { _id: 'k1', upCount: 2, downCount: 1 }],
    ['old shape', { _id: 'k1', up: ['u1', 'u2'], down: ['u3'], usersAlreadyUpVoted: ['a', 'b'] }],
  ])('updateCommentVotes stores the counts of the %s, without voter lists', (label, voted) => {
    const state = reducer(
      withComment(oldComment),
      updateCommentVotes({ recipeId: 'c1', commentId: 'k1', comment: voted }),
    );
    expect(commentOf(state)).toEqual({
      _id: 'k1',
      username: 'chef',
      message: 'Great',
      upCount: 2,
      downCount: 1,
    });
  });

  it('updateCommentVotes leaves the other comments alone', () => {
    let state = reducer(
      initial,
      setCatalogRecipes([{ _id: 'c1', comments: [oldComment, { _id: 'k2', upCount: 4 }] }]),
    );
    state = reducer(
      state,
      updateCommentVotes({ recipeId: 'c1', commentId: 'k1', comment: { upCount: 0 } }),
    );
    expect(state.value[0].comments[1]).toEqual({ _id: 'k2', upCount: 4 });
  });

  it('addCommentToRecipe stores the comment as sent, without voter lists', () => {
    let state = reducer(initial, setCatalogRecipes([{ _id: 'c1', comments: [] }]));
    const fresh = { _id: 'k3', username: 'alex', message: 'Yum', upCount: 0, downCount: 0 };
    state = reducer(state, addCommentToRecipe({ recipeId: 'c1', comment: fresh }));
    expect(commentOf(state)).toEqual(fresh);
  });
});
