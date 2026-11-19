// Plan 019, step 3.1 (audit 2.15): a comment vote sends the comment id only.
// The backend reads the voter from the token in the Authorization header.
//
// Plan 021: the counts and the user's own vote come from either backend
// shape (counts and user.commentVotes, or the old voter lists), and a vote
// updates both the comment counts and user.commentVotes.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { makeRecipeState } from '../../factories/recipe';
import { makeUserState } from '../../factories/user';
import { mockFetchJsonAlways } from '../../mocks/api';
import CommentCard from '../../../components/recipe/CommentCard';
import CommentsSection from '../../../components/recipe/CommentsSection';

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

// The section reads the comment from the store, so a vote shows on screen.
const renderSection = (comment, userOverrides = {}) =>
  renderWithProviders(<CommentsSection recipeId="r1" onPromptCompose={() => {}} />, {
    withNavigation: false,
    preloadedState: {
      locale: { value: { lang: 'en' } },
      user: makeUserState({ username: 'testuser', ...userOverrides }),
      recipe: makeRecipeState([{ _id: 'r1', name: 'Rice bowl', comments: [comment] }]),
    },
  });

const base = { _id: 'c1', username: 'chef', message: 'Tasty', date: '2026-11-01T00:00:00.000Z' };
const upButton = () => screen.getByRole('button', { name: /^Upvote comment/ });
const downButton = () => screen.getByRole('button', { name: /^Downvote comment/ });

describe('CommentCard vote state, both backend shapes', () => {
  it('new shape: counts from the comment, vote from user.commentVotes', () => {
    renderSection({ ...base, upCount: 3, downCount: 1 }, { commentVotes: { c1: 'up' } });

    expect(screen.getByRole('button', { name: 'Upvote comment, 3 upvotes' })).toBeSelected();
    expect(
      screen.getByRole('button', { name: 'Downvote comment, 1 downvotes' }),
    ).not.toBeSelected();
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('old shape: counts and vote from the voter lists', () => {
    renderSection({
      ...base,
      up: ['u1'],
      down: ['u2', 'u3'],
      usersAlreadyUpVoted: ['other'],
      usersAlreadyDownVoted: ['testuser', 'other2'],
    });

    expect(screen.getByRole('button', { name: 'Upvote comment, 1 upvotes' })).not.toBeSelected();
    expect(screen.getByRole('button', { name: 'Downvote comment, 2 downvotes' })).toBeSelected();
    expect(screen.getByText('-1')).toBeTruthy();
  });

  it('null in user.commentVotes wins over the old lists', () => {
    renderSection(
      { ...base, up: ['u1'], down: [], usersAlreadyUpVoted: ['testuser'] },
      { commentVotes: { c1: null } },
    );
    expect(upButton()).not.toBeSelected();
  });

  it('a key missing from user.commentVotes falls back on the old lists', () => {
    renderSection(
      { ...base, up: ['u1'], down: [], usersAlreadyUpVoted: ['testuser'] },
      { commentVotes: { other: 'down' } },
    );
    expect(upButton()).toBeSelected();
  });

  it.each([
    ['new shape', { upCount: 1, downCount: 0 }],
    ['old shape', { up: ['user_test_id'], down: [], usersAlreadyUpVoted: ['testuser'] }],
  ])('an upvote answered in the %s updates the count and the highlight', async (label, voted) => {
    mockFetchJsonAlways({ result: true, upVote: true, downVote: false, comment: voted });
    const { store } = renderSection({ ...base, upCount: 0, downCount: 0 });
    expect(upButton()).not.toBeSelected();

    fireEvent.press(upButton());

    await waitFor(() => expect(upButton()).toBeSelected());
    expect(screen.getByRole('button', { name: 'Upvote comment, 1 upvotes' })).toBeTruthy();
    expect(store.getState().user.value.commentVotes).toEqual({ c1: 'up' });
    const stored = store.getState().recipe.value[0].comments[0];
    expect(stored).not.toHaveProperty('usersAlreadyUpVoted');
    expect(stored).not.toHaveProperty('up');
  });

  it('a second tap removes the vote: null in user.commentVotes, highlight gone', async () => {
    mockFetchJsonAlways({
      result: true,
      upVote: false,
      downVote: false,
      comment: { upCount: 0, downCount: 0 },
    });
    const { store } = renderSection(
      { ...base, upCount: 1, downCount: 0 },
      { commentVotes: { c1: 'up' } },
    );
    expect(upButton()).toBeSelected();

    fireEvent.press(upButton());

    await waitFor(() => expect(upButton()).not.toBeSelected());
    expect(store.getState().user.value.commentVotes).toEqual({ c1: null });
    expect(downButton()).not.toBeSelected();
  });
});
