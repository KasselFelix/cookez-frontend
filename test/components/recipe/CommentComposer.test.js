import { fireEvent, waitFor } from '@testing-library/react-native';

import CommentComposer from '../../../components/recipe/CommentComposer';
import { renderWithProviders } from '../../helpers/renderWithProviders';
import { makeUserState } from '../../factories/user';

// Plan 016, PR 3: POST /comments/add used to carry the session token in its
// body. It now travels in the Authorization header only.
describe('CommentComposer session token', () => {
  it('posts the comment with the token in the header, not in the body', async () => {
    const user = makeUserState();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: true, comment: { _id: 'c1', message: 'Great dish' } }),
    });
    const onClose = jest.fn();
    const screen = renderWithProviders(<CommentComposer recipeId="r1" onClose={onClose} />, {
      preloadedState: { user },
      withNavigation: false,
    });

    fireEvent.changeText(screen.getByLabelText('Comment text input'), 'Great dish');
    fireEvent.press(screen.getByLabelText('Post comment'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/comments\/add$/);
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.value.token}`,
    });
    expect(JSON.parse(init.body)).toEqual({ message: 'Great dish', recipe: 'r1' });
  });
});
