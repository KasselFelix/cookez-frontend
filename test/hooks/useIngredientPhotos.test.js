/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 015 (A2, A3): Kickoff and Recap show the same image for an ingredient.
// The hook writes the catalog photo into the ingredient slice; Recap renders
// that `photo`, as Kickoff does, and the app never calls Pexels itself.
import React from 'react';
import { screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import useIngredientPhotos from '../../hooks/useIngredientPhotos';
import { resetIngredientPhotoCache } from '../../modules/ingredientPhoto';
import Recap from '../../components/Recap';

const ID = '0123456789abcdef01234567';
const PHOTO = 'https://images.pexels.com/photos/1/tomato.jpeg';

const picked = (overrides = {}) => ({
  photo: null,
  data: { _id: ID, display_name: 'tomato', g_per_serving: 100, defaultUnit: 'g', unit: 'g' },
  ...overrides,
});

function Probe() {
  useIngredientPhotos();
  return null;
}

beforeEach(() => {
  resetIngredientPhotoCache();
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ result: true, photoUrl: PHOTO }) })
  );
});

afterEach(() => {
  delete global.fetch;
});

describe('useIngredientPhotos', () => {
  it('fills the catalog photo of a picked ingredient into the slice', async () => {
    const { store } = renderWithProviders(<Probe />, {
      withNavigation: false,
      preloadedState: { ingredient: { value: [picked({ photo: 'strawberry.jpg' })] } },
    });
    await waitFor(() => expect(store.getState().ingredient.value[0].photo).toBe(PHOTO));
    expect(global.fetch.mock.calls[0][0]).toMatch(new RegExp(`/ingredients/${ID}/photo$`));
  });

  it('keeps a photo that is already loadable, without a request', async () => {
    const { store } = renderWithProviders(<Probe />, {
      withNavigation: false,
      preloadedState: { ingredient: { value: [picked({ photo: 'https://cdn.example.com/kept.jpg' })] } },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(store.getState().ingredient.value[0].photo).toBe('https://cdn.example.com/kept.jpg');
  });

  it('leaves a camera shot without a catalog id alone', async () => {
    const shot = { photo: 'file:///photo.jpg', data: { display_name: 'apple' } };
    renderWithProviders(<Probe />, {
      withNavigation: false,
      preloadedState: { ingredient: { value: [shot] } },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('Recap', () => {
  it('shows the photo of the slice, the one Kickoff shows, and never calls Pexels', async () => {
    renderWithProviders(<Recap {...picked({ photo: PHOTO })} />, { withNavigation: false });
    expect(screen.getByTestId('recap-ingredient-photo').props.source).toEqual({ uri: PHOTO });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const urls = global.fetch.mock.calls.map(([url]) => String(url));
    expect(urls.filter((url) => url.includes('pexels.com'))).toEqual([]);
  });
});
