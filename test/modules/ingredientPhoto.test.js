/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 015 (A2): the catalog photo, through the backend's Pexels cache, is the
// only image source of an ingredient.
import {
  fetchIngredientPhoto,
  loadableImage,
  resetIngredientPhotoCache,
} from '../../modules/ingredientPhoto';

const ID = '0123456789abcdef01234567';
const respond = (body) => Promise.resolve({ json: () => Promise.resolve(body) });

beforeEach(() => {
  resetIngredientPhotoCache();
  global.fetch = jest.fn(() => respond({ result: true, photoUrl: 'https://images.pexels.com/a.jpeg' }));
});

afterEach(() => {
  delete global.fetch;
});

describe('loadableImage', () => {
  it.each([
    ['https://images.pexels.com/a.jpeg', 'https://images.pexels.com/a.jpeg'],
    ['http://cdn.example.com/b.jpg', 'http://cdn.example.com/b.jpg'],
    ['strawberry.jpg', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('%p gives %p', (input, expected) => {
    expect(loadableImage(input)).toBe(expected);
  });
});

describe('fetchIngredientPhoto', () => {
  it('asks the backend photo route, never Pexels', async () => {
    expect(await fetchIngredientPhoto(ID)).toBe('https://images.pexels.com/a.jpeg');
    const [url] = global.fetch.mock.calls[0];
    expect(url).toMatch(new RegExp(`/ingredients/${ID}/photo$`));
    expect(url).not.toContain('pexels.com');
  });

  it('sends one request per id', async () => {
    await Promise.all([fetchIngredientPhoto(ID), fetchIngredientPhoto(ID)]);
    await fetchIngredientPhoto(ID);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not ask for an id that is not a catalog id', async () => {
    expect(await fetchIngredientPhoto('tomato')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('gives null when the catalog has no photo', async () => {
    global.fetch.mockImplementation(() => respond({ result: true, photoUrl: null }));
    expect(await fetchIngredientPhoto(ID)).toBeNull();
  });

  it('tries again after a network failure', async () => {
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    expect(await fetchIngredientPhoto(ID)).toBeNull();
    expect(await fetchIngredientPhoto(ID)).toBe('https://images.pexels.com/a.jpeg');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
