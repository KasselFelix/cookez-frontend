import React from 'react';
import CommentCard from './recipe/CommentCard';

/**
 * Comments — DEPRECATED legacy export.
 *
 * Originally a stateful component handling vote/edit/delete inline. Refactored
 * to a thin presentational wrapper around `CommentCard` (the new social bubble).
 * Single source of truth for comments now lives in Redux
 * (`state.recipe.value[].comments`) — `update` and other ad-hoc callbacks
 * are accepted but ignored.
 *
 * Prefer importing `components/recipe/CommentCard` directly in new code.
 *
 * Accepted props (all optional, all forwarded to CommentCard):
 *   _id, username, message, date, up, down, usersAlreadyUpVoted, usersAlreadyDownVoted
 */
export default function Comments(props) {
  const {
    // eslint-disable-next-line no-unused-vars
    update,
    // eslint-disable-next-line no-unused-vars
    upDownCountInitial,
    // eslint-disable-next-line no-unused-vars
    alreadyUp,
    // eslint-disable-next-line no-unused-vars
    alreadyDown,
    // eslint-disable-next-line no-unused-vars
    recipe,
    ...rest
  } = props;

  return (
    <CommentCard
      {...rest}
      up={rest.up ?? []}
      down={rest.down ?? []}
      usersAlreadyUpVoted={rest.usersAlreadyUpVoted ?? []}
      usersAlreadyDownVoted={rest.usersAlreadyDownVoted ?? []}
    />
  );
}
