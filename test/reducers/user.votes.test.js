// Plan 021: the user's own votes live on the user and are kept up to date
// after each vote. A removed vote is written as null, never by deleting the
// key, and logging out drops them.
import reducer, {
  addUserToStore,
  removeUserToStore,
  setCommentVote,
  setRecipeVote,
  updateUserInStore,
} from '../../reducers/user';

const signedIn = reducer(undefined, addUserToStore({ _id: 'u1', username: 'alex', token: 't' }));

describe('user slice votes', () => {
  it('records a comment vote on a user signed in without the map (old backend)', () => {
    const state = reducer(signedIn, setCommentVote({ commentId: 'c1', vote: 'up' }));
    expect(state.value.commentVotes).toEqual({ c1: 'up' });
    expect(state.value.username).toBe('alex');
  });

  it('keeps the other votes of the map', () => {
    const start = reducer(signedIn, updateUserInStore({ commentVotes: { c0: 'down' } }));
    const state = reducer(start, setCommentVote({ commentId: 'c1', vote: 'up' }));
    expect(state.value.commentVotes).toEqual({ c0: 'down', c1: 'up' });
  });

  it('a removed comment vote becomes null, the key stays', () => {
    const voted = reducer(signedIn, setCommentVote({ commentId: 'c1', vote: 'up' }));
    const state = reducer(voted, setCommentVote({ commentId: 'c1', vote: null }));
    expect(state.value.commentVotes).toEqual({ c1: null });
    expect(Object.keys(state.value.commentVotes)).toEqual(['c1']);
  });

  it('records a recipe note', () => {
    const state = reducer(signedIn, setRecipeVote({ recipeId: 'r1', note: 4 }));
    expect(state.value.recipeVotes).toEqual({ r1: 4 });
  });

  it('ignores a vote without id', () => {
    expect(reducer(signedIn, setCommentVote({ vote: 'up' }))).toEqual(signedIn);
    expect(reducer(signedIn, setRecipeVote({ note: 3 }))).toEqual(signedIn);
  });

  it('logging out drops both maps', () => {
    let state = reducer(signedIn, setCommentVote({ commentId: 'c1', vote: 'up' }));
    state = reducer(state, setRecipeVote({ recipeId: 'r1', note: 4 }));
    state = reducer(state, removeUserToStore());
    expect(state.value).toEqual({ username: null, token: null });
  });
});
