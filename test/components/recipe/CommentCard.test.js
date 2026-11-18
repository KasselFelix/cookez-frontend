/* global describe, it, expect */
// Plan 019, step 3.1 (audit 2.15): a comment vote sends the comment id only.
// The backend reads the voter from the token in the Authorization header.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { makeUserState } from '../../factories/user';
import { mockFetchJsonAlways } from '../../mocks/api';
import CommentCard from '../../../components/recipe/CommentCard';

const TOKEN = 'a'.repeat(32);

const renderCard = () =>
  renderWithProviders(
    <CommentCard _id="c1" recipeId="r1" username="chef" message="Tasty" up={[]} down={[]} />,
    { withNavigation: false, preloadedState: { user: makeUserState({ username: 'testuser' }) } },
  );

describe('CommentCard votes', () => {
  it.each([
    ['Upvote comment, 0 upvotes', '/comments/upvote'],
    ['Downvote comment, 0 downvotes', '/comments/downvote'],
  ])(
    '%s: sends the comment id, no username, with the token in the header',
    async (label, route) => {
      mockFetchJsonAlways({
        result: true,
        comment: { up: [], down: [], usersAlreadyUpVoted: [], usersAlreadyDownVoted: [] },
      });
      renderCard();

      fireEvent.press(screen.getByRole('button', { name: label }));

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toContain(route);
      expect(JSON.parse(init.body)).toEqual({ _id: 'c1' });
      expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    },
  );
});
