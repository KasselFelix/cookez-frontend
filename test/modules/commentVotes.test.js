// Plan 021: votes read from either backend shape. The new one sends counts on
// the comment and the user's own votes on the user; the old one sends voter
// lists. In the user's maps, null means "no vote" and a missing key "unknown".
import {
  commentCounts,
  userCommentVote,
  userRecipeVote,
  voteFromResponse,
} from '../../modules/commentVotes';

const user = { _id: 'u1', username: 'alex' };

describe('commentCounts', () => {
  it('reads the counts of the new shape', () => {
    expect(commentCounts({ upCount: 3, downCount: 1 })).toEqual({ up: 3, down: 1 });
  });

  it('falls back on the voter lists of the old shape', () => {
    expect(commentCounts({ up: ['a', 'b'], down: ['c'] })).toEqual({ up: 2, down: 1 });
  });

  it('prefers the counts when both shapes are present', () => {
    expect(commentCounts({ upCount: 0, downCount: 0, up: ['a'], down: ['b'] })).toEqual({
      up: 0,
      down: 0,
    });
  });

  it('counts 0 for a comment with no votes at all', () => {
    expect(commentCounts({})).toEqual({ up: 0, down: 0 });
    expect(commentCounts(undefined)).toEqual({ up: 0, down: 0 });
  });
});

describe('userCommentVote', () => {
  it('reads the user map of the new shape', () => {
    const me = { ...user, commentVotes: { c1: 'up', c2: 'down' } };
    expect(userCommentVote({ _id: 'c1' }, me)).toBe('up');
    expect(userCommentVote({ _id: 'c2' }, me)).toBe('down');
  });

  it('null in the map means no vote, even if the old lists name the user', () => {
    const me = { ...user, commentVotes: { c1: null } };
    expect(userCommentVote({ _id: 'c1', usersAlreadyUpVoted: ['alex'] }, me)).toBeNull();
  });

  it('a missing key falls back on the old lists', () => {
    const me = { ...user, commentVotes: { other: 'up' } };
    expect(userCommentVote({ _id: 'c1', usersAlreadyUpVoted: ['alex'] }, me)).toBe('up');
    expect(userCommentVote({ _id: 'c1', usersAlreadyDownVoted: ['alex'] }, user)).toBe('down');
  });

  it('no map and no lists: no vote', () => {
    expect(userCommentVote({ _id: 'c1', upCount: 2 }, user)).toBeNull();
    expect(userCommentVote({ _id: 'c1', usersAlreadyUpVoted: ['alex'] }, {})).toBeNull();
  });
});

describe('voteFromResponse', () => {
  it('reads the upVote and downVote flags', () => {
    expect(voteFromResponse({ upVote: true, downVote: false })).toBe('up');
    expect(voteFromResponse({ upVote: false, downVote: true })).toBe('down');
  });

  it('both flags false: the vote was removed', () => {
    expect(voteFromResponse({ upVote: false, downVote: false })).toBeNull();
    expect(voteFromResponse({})).toBeNull();
  });
});

describe('userRecipeVote', () => {
  it('reads the user map of the new shape', () => {
    expect(
      userRecipeVote({ _id: 'r1', votes: [{ note: 2 }] }, { ...user, recipeVotes: { r1: 4 } }),
    ).toBe(4);
  });

  it('null in the map means no vote, even if votes[].user names the user', () => {
    const recipe = { _id: 'r1', votes: [{ user: 'u1', note: 3 }] };
    expect(userRecipeVote(recipe, { ...user, recipeVotes: { r1: null } })).toBeNull();
  });

  it('a missing key falls back on votes[].user', () => {
    const recipe = {
      _id: 'r1',
      votes: [
        { user: 'u2', note: 5 },
        { user: 'u1', note: 3 },
      ],
    };
    expect(userRecipeVote(recipe, { ...user, recipeVotes: {} })).toBe(3);
    expect(userRecipeVote(recipe, user)).toBe(3);
  });

  it('public votes without user: no vote', () => {
    expect(userRecipeVote({ _id: 'r1', votes: [{ note: 5 }] }, user)).toBeNull();
    expect(userRecipeVote({ _id: 'r1' }, {})).toBeNull();
  });
});
