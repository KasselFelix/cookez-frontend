/* global describe, it, expect */
import { ALLERGEN_KEYS, joinAllergies, splitAllergies } from '../../modules/allergenOptions';
import en from '../../i18n/translations/en.json';
import fr from '../../i18n/translations/fr.json';

describe('allergenOptions', () => {
  it('lists the 14 regulated allergens, each translated', () => {
    expect(new Set(ALLERGEN_KEYS).size).toBe(14);
    ALLERGEN_KEYS.forEach((key) => {
      expect(fr.settings.allergens[key]).toBeTruthy();
      expect(en.settings.allergens[key]).toBeTruthy();
    });
  });

  it('splits a stored list into chips and free text', () => {
    expect(splitAllergies(['soy', 'kiwi', 'sesame', 'arachides'])).toEqual({
      keys: ['soy', 'sesame'],
      other: 'kiwi, arachides',
    });
  });

  it('treats a missing list as empty', () => {
    expect(splitAllergies(undefined)).toEqual({ keys: [], other: '' });
  });

  it('joins chips and free text, trimmed and without duplicates', () => {
    expect(joinAllergies(['soy'], ' kiwi, , soy ,ananas ')).toEqual(['soy', 'kiwi', 'ananas']);
  });

  it('keeps every legacy free-text term through a split and a join', () => {
    const stored = ['peanuts', 'arachides', 'crustacés'];
    const { keys, other } = splitAllergies(stored);
    expect(joinAllergies(keys, other).sort()).toEqual([...stored].sort());
  });
});
