// Plan 019, steps 3.1 and 3.2: publishing a recipe.
// - The name placed in the upload URL is encoded: a `?`, `#` or `/` in the
//   recipe name no longer cuts the path (the server cleans the name itself).
// - /recipes/add takes `picture` from the upload response, and its body holds
//   no username, date, votes or comments: the server sets them.
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeUserState } from '../factories/user';
import { mockFetchSequence } from '../mocks/api';
import * as ImagePicker from 'expo-image-picker';
import AddRecipeScreen from '../../screens/AddRecipeScreen';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///gallery.jpg' }],
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///camera.jpg' }],
  })),
}));

const TOKEN = 'a'.repeat(32);
const STORED_ID = 'user_test_id_Tarte-Tatin-1731398400000';

const nav = { navigate: jest.fn(), goBack: jest.fn() };

describe('AddRecipeScreen publish', () => {
  const originalAlert = global.alert;
  beforeEach(() => {
    global.alert = jest.fn();
  });
  afterEach(() => {
    global.alert = originalAlert;
  });

  it('encodes the upload name and publishes with the picture id the server gave', async () => {
    mockFetchSequence([
      { result: true, url: 'https://res.cloudinary.com/x.jpg', id: STORED_ID, picture: STORED_ID },
      { result: true },
    ]);
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: 'file:///photo.jpg' } },
    });

    fireEvent.changeText(screen.getByPlaceholderText('name*'), ' Tarte?#/Tatin ');
    // MyButton runs its action when the release animation ends.
    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const [[uploadUrl, uploadInit], [addUrl, addInit]] = global.fetch.mock.calls;

    expect(uploadUrl).toMatch(/\/upload\/Tarte%3F%23%2FTatin_\d+$/);
    expect(uploadInit.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });

    expect(addUrl).toContain('/recipes/add');
    const body = JSON.parse(addInit.body);
    expect(body.picture).toBe(STORED_ID);
    expect(body.name).toBe(' Tarte?#/Tatin ');
    for (const key of ['username', 'date', 'votes', 'comments']) {
      expect(body).not.toHaveProperty(key);
    }
    // Plan 020: a success toast, never the "Alert" dialog.
    expect(await screen.findByTestId('toast')).toHaveTextContent('Your recipe is published.');
    expect(global.alert).not.toHaveBeenCalled();
    // The first render of this screen passes 5 s when the whole suite runs in
    // parallel; alone, it takes well under that.
  }, 15000);
});

// Plan 017, step 28: servings, difficulty and unit could not be chosen on an
// iPhone (react-native-picker-select), so no ingredient could be added. They
// are now OptionPicker fields: a button that opens a list in a modal.
describe('AddRecipeScreen pickers', () => {
  const originalAlert = global.alert;
  beforeEach(() => {
    global.alert = jest.fn();
  });
  afterEach(() => {
    global.alert = originalAlert;
  });

  const pick = (field, option) => {
    fireEvent.press(screen.getByRole('button', { name: field }));
    fireEvent.press(screen.getByRole('button', { name: option }));
  };

  it('fills servings, difficulty and unit, then adds an ingredient and publishes them', async () => {
    mockFetchSequence([
      { result: true, url: 'https://res.cloudinary.com/x.jpg', id: STORED_ID, picture: STORED_ID },
      { result: true },
    ]);
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: 'file:///photo.jpg' } },
    });

    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    // Nothing chosen yet: the "0" placeholder is not announced as a value.
    expect(
      screen.getByRole('button', { name: 'Servings' }).props.accessibilityValue?.text,
    ).toBeUndefined();
    pick('Servings', '4');
    pick('Difficulty', '2');
    expect(screen.getByRole('button', { name: 'Servings' })).toHaveAccessibilityValue({
      text: '4',
    });
    expect(screen.getByRole('button', { name: 'Difficulty' })).toHaveAccessibilityValue({
      text: '2',
    });

    fireEvent.changeText(screen.getByPlaceholderText('Qty'), '200');
    pick('Unit', 'g');
    fireEvent.changeText(screen.getByPlaceholderText('Ingredient*'), 'flour');
    fireEvent.press(screen.getByText('Add ingredient'));
    expect(screen.getByText('ingredients added: 1')).toBeTruthy();

    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const body = JSON.parse(global.fetch.mock.calls[1][1].body);
    expect(body.servings).toBe(4);
    expect(body.difficulty).toBe(2);
    expect(body.ingredients).toEqual([
      expect.objectContaining({ name: 'flour', quantity: 200, unit: 'g  ' }),
    ]);
  }, 15000);

  it('offers a count of pieces as a unit', () => {
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: null } },
    });

    fireEvent.changeText(screen.getByPlaceholderText('Qty'), '3');
    pick('Unit', 'unit');
    expect(screen.getByRole('button', { name: 'Unit' })).toHaveAccessibilityValue({ text: 'unit' });
    fireEvent.changeText(screen.getByPlaceholderText('Ingredient*'), 'egg');
    fireEvent.press(screen.getByText('Add ingredient'));
    expect(screen.getByText('ingredients added: 1')).toBeTruthy();
  }, 15000);
});

// Plan 017, step 29: in iOS "padding" mode, KeyboardAvoidingView replaces its
// paddingBottom with the keyboard height, 0 when closed. The space for the
// floating tab bar was set there, so on an iPhone the card ran under the bar
// and hid "Add Recipe". The space now sits on the card.
describe('AddRecipeScreen above the floating tab bar', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps the tab bar space on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: null } },
    });

    // Zero insets under Jest: useTabBarHeight() is 60 (bar) + 8 (min bottom
    // inset) + 12 + 16 = 96, then 16 (spacing.md) of gap above the bar.
    const card = StyleSheet.flatten(screen.getByTestId('addRecipe-card').props.style);
    expect(card.marginBottom).toBe(96 + 16);
  });
});

// Plan 019, step 3.7: since Unicons left, both photo buttons rendered an empty
// TouchableOpacity, and no recipe could get its picture.
describe('AddRecipeScreen photo buttons', () => {
  const originalAlert = global.alert;
  beforeEach(() => {
    global.alert = jest.fn();
  });
  afterEach(() => {
    global.alert = originalAlert;
  });

  function renderForm() {
    return renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: null } },
    });
  }

  it.each([
    ['Choose a photo from the gallery', ImagePicker.launchImageLibraryAsync, 'file:///gallery.jpg'],
    ['Take a photo of the recipe', ImagePicker.launchCameraAsync, 'file:///camera.jpg'],
  ])(
    '"%s" opens its picker and shows the photo',
    async (label, launcher, uri) => {
      renderForm();
      fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
      fireEvent.press(screen.getByRole('button', { name: label }));

      await waitFor(() => expect(launcher).toHaveBeenCalledTimes(1));
      const photo = await screen.findByLabelText('photo');
      expect(photo.props.source).toEqual({ uri });
    },
    15000,
  );

  it('tells the user when the picker fails, without an unhandled rejection', async () => {
    ImagePicker.launchCameraAsync.mockRejectedValueOnce(new Error('camera busy'));
    renderForm();
    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    fireEvent.press(screen.getByRole('button', { name: 'Take a photo of the recipe' }));

    expect(await screen.findByTestId('toast')).toHaveTextContent(
      'The photo could not be opened. Try again.',
    );
    expect(global.alert).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('photo')).toBeNull();
  }, 15000);

  it('asks for the recipe name before opening a picker', async () => {
    renderForm();
    fireEvent.press(screen.getByRole('button', { name: 'Choose a photo from the gallery' }));
    fireEvent.press(screen.getByRole('button', { name: 'Take a photo of the recipe' }));

    // Plan 020: under the photo buttons, where the user just touched.
    expect(screen.getByTestId('addRecipe-photo-message')).toHaveTextContent(
      /^Fill in the fields above first/,
    );
    expect(global.alert).not.toHaveBeenCalled();
    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();

    // Typing the name clears it.
    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    expect(screen.queryByTestId('addRecipe-photo-message')).toBeNull();
  }, 15000);

  it('tells the user under the photo buttons when publishing without a photo', () => {
    renderForm();
    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');

    return waitFor(() =>
      expect(screen.getByTestId('addRecipe-photo-message')).toHaveTextContent(
        'Take or choose a photo of the recipe first.',
      ),
    ).then(() => expect(global.fetch).not.toHaveBeenCalled());
  }, 15000);
});

// Plan 020: a failed publication is an error toast, including the refused
// upload that used to fail silently.
describe('AddRecipeScreen publish failures', () => {
  const originalAlert = global.alert;
  beforeEach(() => {
    global.alert = jest.fn();
  });
  afterEach(() => {
    global.alert = originalAlert;
  });

  const publish = () => {
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: 'file:///photo.jpg' } },
    });
    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');
  };

  it('shows a refused upload, and sends no recipe', async () => {
    mockFetchSequence([{ result: false, error: 'Image too large' }]);
    publish();

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveTextContent(/The recipe was not published/);
    expect(toast).toHaveTextContent(/Image too large/);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.alert).not.toHaveBeenCalled();
  }, 15000);

  it('shows why the upload route refused the photo (error status with a JSON body)', async () => {
    mockFetchSequence([
      {
        body: { result: false, error: 'Upload service limit reached for today' },
        init: { status: 429, ok: false },
      },
    ]);
    publish();

    expect(await screen.findByTestId('toast')).toHaveTextContent(
      /Upload service limit reached for today/,
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  }, 15000);

  it('shows the server error of /recipes/add', async () => {
    mockFetchSequence([
      { result: true, picture: STORED_ID },
      { result: false, error: 'Missing ingredients' },
    ]);
    publish();

    expect(await screen.findByTestId('toast')).toHaveTextContent(/Missing ingredients/);
  }, 15000);

  it('shows a network error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockImplementation(() => Promise.reject(new Error('Network request failed')));
    publish();

    expect(await screen.findByTestId('toast')).toHaveTextContent(/Network error/);
    jest.restoreAllMocks();
  }, 15000);
});

// Plan 020: every text of the screen goes through useT(), unit labels too;
// the unit values sent to the backend do not change.
describe('AddRecipeScreen in French', () => {
  it('translates the form and the unit labels', () => {
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: {
        user: makeUserState(),
        picture: { value: null },
        locale: { value: { lang: 'fr' } },
      },
    });

    expect(screen.getByText('Ajoutez votre recette')).toBeTruthy();
    expect(screen.getByPlaceholderText('nom*')).toBeTruthy();
    expect(screen.getByText("Ajouter l'ingrédient")).toBeTruthy();
    expect(screen.getByText('ingrédients ajoutés : 0')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Unité' }));
    fireEvent.press(screen.getByRole('button', { name: 'c. à s.' }));
    expect(screen.getByRole('button', { name: 'Unité' })).toHaveAccessibilityValue({
      text: 'c. à s.',
    });
  }, 15000);
});

describe('AddRecipeScreen, a response that is not JSON', () => {
  it('says something went wrong, not that the network failed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: true, picture: STORED_ID }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new SyntaxError('Unexpected token <')),
      });
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: 'file:///photo.jpg' } },
    });
    fireEvent.changeText(screen.getByPlaceholderText('name*'), 'Tarte Tatin');
    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');

    const toast = await screen.findByTestId('toast');
    expect(toast).toHaveTextContent(/Something went wrong/);
    expect(toast).not.toHaveTextContent(/Network error/);
    jest.restoreAllMocks();
  }, 15000);
});
