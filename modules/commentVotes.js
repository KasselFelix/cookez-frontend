// Comment and recipe votes, read from whichever shape the backend sends
// (plan 021).
//
// New shape: a comment carries counts only (`upCount`, `downCount`), and the
// user's own votes travel with the user (`user.commentVotes`:
// { commentId: 'up' | 'down' | null }, `user.recipeVotes`:
// { recipeId: note | null }), from /users/signin and /users/me.
// Old shape: voter lists on the comment (`up`, `down`, `usersAlreadyUpVoted`,
// `usersAlreadyDownVoted`) and on the recipe (`votes[].user`).
//
// In the user's maps, `null` means "no vote" and a missing key means
// "unknown": only a missing key falls back to the old fields. The fallbacks go
// once the plan 021 backend is in production and the app update applied.

const hasKey = (map, key) =>
  typeof map === 'object' && map !== null && Object.prototype.hasOwnProperty.call(map, key);

const count = (value, list) => {
  if (Number.isFinite(value)) return value;
  return Array.isArray(list) ? list.length : 0;
};

/**
 * Up and down counts of a comment.
 *
 * @param {object} comment Comment as the API or the store holds it.
 * @returns {{ up: number, down: number }}
 */
export function commentCounts(comment) {
  return {
    up: count(comment?.upCount, comment?.up),
    down: count(comment?.downCount, comment?.down),
  };
}

/**
 * The user's vote on a comment.
 *
 * @param {object} comment Comment with its `_id`.
 * @param {object} user `state.user.value`.
 * @returns {'up' | 'down' | null}
 */
export function userCommentVote(comment, user) {
  const id = comment?._id != null ? String(comment._id) : null;
  if (id && hasKey(user?.commentVotes, id)) {
    const vote = user.commentVotes[id];
    return vote === 'up' || vote === 'down' ? vote : null;
  }
  const name = user?.username;
  if (!name) return null;
  if (Array.isArray(comment?.usersAlreadyUpVoted) && comment.usersAlreadyUpVoted.includes(name)) {
    return 'up';
  }
  if (
    Array.isArray(comment?.usersAlreadyDownVoted) &&
    comment.usersAlreadyDownVoted.includes(name)
  ) {
    return 'down';
  }
  return null;
}

/**
 * The user's vote after POST /comments/upvote or /comments/downvote, read from
 * the `upVote` and `downVote` flags of its response. A second tap on the same
 * arrow removes the vote: both flags are false.
 *
 * @param {object} data Response body.
 * @returns {'up' | 'down' | null}
 */
export function voteFromResponse(data) {
  if (data?.upVote === true) return 'up';
  if (data?.downVote === true) return 'down';
  return null;
}

/**
 * The note the user gave a recipe, or null.
 *
 * @param {object} recipe Recipe with its `_id` and `votes`.
 * @param {object} user `state.user.value`.
 * @returns {number | null}
 */
export function userRecipeVote(recipe, user) {
  const id = recipe?._id != null ? String(recipe._id) : null;
  if (id && hasKey(user?.recipeVotes, id)) {
    const note = user.recipeVotes[id];
    return Number.isFinite(note) ? note : null;
  }
  const myId = user?._id != null ? String(user._id) : null;
  if (!myId || !Array.isArray(recipe?.votes)) return null;
  const mine = recipe.votes.find((v) => v?.user != null && String(v.user) === myId);
  return Number.isFinite(mine?.note) ? mine.note : null;
}
