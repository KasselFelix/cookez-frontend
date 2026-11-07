/* global describe, it, expect */
// ResultScreen cards: what a recipe of POST /recipes/result shows, and what
// stays hidden when the data is missing ("0 min", "votes: 0").
import { toResultCard } from '../../modules/resultCard';

describe('toResultCard', () => {
  it('derives the rating, the owned share, the missing count and the flag', () => {
    const card = toResultCard(
      {
        origin: ['France'],
        preparationTime: 45,
        difficulty: 2,
        votes: [{ note: 5 }, { note: 4 }],
        matchRatio: 74.6,
        missingIngredients: [{ name: 'cream' }, { name: 'bacon' }],
        isSeasonal: true,
      },
      'fr',
    );
    expect(card).toMatchObject({ minutes: 45, difficulty: 2, rating: '4.5', votes: 2, match: 75, missing: 2, seasonal: true });
    expect(card.origins).toEqual([{ flag: '🇫🇷', name: 'France' }]);
  });

  it('hides what the recipe does not have', () => {
    expect(toResultCard({ preparationTime: 0, votes: [], origin: '' })).toMatchObject({
      minutes: null,
      difficulty: null,
      rating: null,
      votes: 0,
      match: null,
      missing: 0,
      seasonal: false,
      origins: [],
    });
  });

  it('shows an unknown origin without a flag', () => {
    expect(toResultCard({ origin: 'Atlantis' }).origins).toEqual([{ flag: null, name: 'Atlantis' }]);
  });
});
