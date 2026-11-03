/* global describe, it, expect */
import { bayesianScores, rankByPreparationTime, rankRecipes } from '../../modules/recipeRanking';

const votes = (...notes) => notes.map((note, i) => ({ username: `u${i}`, note }));
const names = (list) => list.map((r) => r.name);

describe('rankRecipes without a search', () => {
  it('orders by Bayesian vote score, then by name', () => {
    const list = [
      { _id: '1', name: 'Zucchini Bread', votes: [] },
      { _id: '2', name: 'Apple Pie', votes: [] },
      { _id: '3', name: 'Soup', votes: votes(5, 5, 5, 5) },
      { _id: '4', name: 'Stew', votes: votes(2) },
    ];
    expect(names(rankRecipes(list))).toEqual(['Soup', 'Apple Pie', 'Zucchini Bread', 'Stew']);
  });

  it('gives the same order whatever the input order', () => {
    const list = [
      { _id: 'b', name: 'Tarte Tatin', votes: [] },
      { _id: 'a', name: 'Galuskies', votes: [] },
      { _id: 'c', name: 'Paleo Stuffed Cabbage', votes: [] },
    ];
    expect(names(rankRecipes(list))).toEqual(names(rankRecipes([...list].reverse())));
    expect(names(rankRecipes(list))).toEqual(['Galuskies', 'Paleo Stuffed Cabbage', 'Tarte Tatin']);
  });
});

describe('rankRecipes with a search', () => {
  it('puts name relevance before votes, and votes only break ties', () => {
    const list = [
      // Rated 1/5 but with many votes: still after every better name match.
      { _id: '1', name: 'Easy Japchae', matchRank: 2, votes: votes(1, 1, 1, 1, 1) },
      // No vote: scored at the mean of the rated recipes, 3.
      { _id: '2', name: 'Japchae Bowl', matchRank: 1, votes: [] },
      { _id: '3', name: 'Japchae Salad', matchRank: 1, votes: votes(5, 5) },
      { _id: '4', name: 'Japchae', matchRank: 0, votes: [] },
    ];
    expect(names(rankRecipes(list, { searching: true }))).toEqual([
      'Japchae',
      'Japchae Salad',
      'Japchae Bowl',
      'Easy Japchae',
    ]);
  });

  it('without votes, puts the shortest name first inside a tier', () => {
    const list = [
      { _id: '1', name: 'Pad See Ew', matchRank: 1, votes: [] },
      { _id: '2', name: 'Pad Thai', matchRank: 1, votes: [] },
      { _id: '3', name: 'Pad Thai With Shrimp', matchRank: 1, votes: [] },
    ];
    expect(names(rankRecipes(list, { searching: true }))).toEqual(['Pad Thai', 'Pad See Ew', 'Pad Thai With Shrimp']);
  });

  it('ignores matchRank when not searching', () => {
    const list = [
      { _id: '1', name: 'B', matchRank: 0, votes: [] },
      { _id: '2', name: 'A', matchRank: 3, votes: [] },
    ];
    expect(names(rankRecipes(list))).toEqual(['A', 'B']);
  });
});

describe('helpers', () => {
  it('scores a recipe without votes at the mean of the rated ones', () => {
    const rated = { name: 'R', votes: votes(4) };
    const unrated = { name: 'U', votes: [] };
    expect(bayesianScores([rated, unrated]).get(unrated)).toBe(4);
  });

  it('sorts the quick filter by preparation time, then name', () => {
    const list = [
      { _id: '1', name: 'B', preparationTime: 10 },
      { _id: '2', name: 'A', preparationTime: 10 },
      { _id: '3', name: 'C', preparationTime: 5 },
      { _id: '4', name: 'D' },
    ];
    expect(names(rankByPreparationTime(list))).toEqual(['C', 'A', 'B', 'D']);
  });
});
