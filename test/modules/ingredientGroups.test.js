// Unit tests for groupIngredients() — Plan 007 altGroup rendering.
//
// The function is a pure JS utility (no React, no Redux), so no provider
// wrapper is needed. Tests cover:
//   1. Two rows sharing altGroup:1 collapse into one "X or Y" row
//   2. Standalone rows (no altGroup) pass through unchanged — one row each
//   3. Mixed: some grouped, some standalone — preserves list order
//   4. Empty array returns empty array
//   5. A group with a single member (safety net) treats it as standalone

import { groupIngredients, withoutBlockedMembers } from '../../modules/ingredientGroups';

describe('withoutBlockedMembers', () => {
  const butter = { name: 'butter', altGroup: 1, quantity: 100, unit: 'g', blockedByAllergy: true };
  const margarine = { name: 'margarine', altGroup: 1, quantity: null, unit: null };
  const tomato = { name: 'tomato', altGroup: null, quantity: 2, unit: 'unit' };

  it('swaps a blocked member for the safe one, with its quantity', () => {
    expect(withoutBlockedMembers([butter, margarine, tomato])).toEqual([
      { ...margarine, quantity: 100, unit: 'g' },
      tomato,
    ]);
  });

  it('keeps the quantity a safe member already has', () => {
    const own = { ...margarine, quantity: 50, unit: 'ml' };
    expect(withoutBlockedMembers([butter, own])).toEqual([own]);
  });

  it('leaves a recipe without a blocked row untouched', () => {
    const open = { ...butter, blockedByAllergy: undefined };
    expect(withoutBlockedMembers([open, margarine, tomato])).toEqual([open, margarine, tomato]);
  });

  it('accepts a missing list', () => {
    expect(withoutBlockedMembers(undefined)).toEqual([]);
  });
});

const CONNECTOR = 'or';

/** Build a minimal scaled ingredient row */
function makeIng(name, altGroup = null, displayQuantity = '100', displayUnit = 'g') {
  return { name, altGroup, displayQuantity, displayUnit };
}

describe('groupIngredients', () => {
  it('collapses two rows sharing altGroup into one "X or Y" row', () => {
    const input = [
      makeIng('butter', 1, '100', 'g'),
      makeIng('margarine', 1, null, null), // second member carries null qty
    ];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('butter or margarine');
    expect(result[0].displayQuantity).toBe('100');
    expect(result[0].displayUnit).toBe('g');
    expect(result[0].isAltGroup).toBe(true);
  });

  it('passes standalone ingredients through unchanged — one row each', () => {
    const input = [
      makeIng('flour', null, '200', 'g'),
      makeIng('salt', null, '5', 'g'),
      makeIng('eggs', null, '2', 'units'),
    ];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(3);
    expect(result[0].displayName).toBe('flour');
    expect(result[1].displayName).toBe('salt');
    expect(result[2].displayName).toBe('eggs');
    result.forEach((row) => expect(row.isAltGroup).toBe(false));
  });

  it('places the grouped row at the first member\'s position', () => {
    const input = [
      makeIng('flour', null, '200', 'g'),
      makeIng('butter', 1, '100', 'g'),       // first member of group
      makeIng('margarine', 1, null, null),     // second member of group
      makeIng('sugar', null, '50', 'g'),
    ];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(3);
    expect(result[0].displayName).toBe('flour');
    expect(result[1].displayName).toBe('butter or margarine');
    expect(result[2].displayName).toBe('sugar');
  });

  it('handles three alternatives in one group', () => {
    const input = [
      makeIng('butter', 2, '100', 'g'),
      makeIng('margarine', 2, null, null),
      makeIng('coconut oil', 2, null, null),
    ];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('butter or margarine or coconut oil');
  });

  it('supports multiple independent groups in the same list', () => {
    const input = [
      makeIng('butter', 1, '100', 'g'),
      makeIng('margarine', 1, null, null),
      makeIng('flour', null, '200', 'g'),
      makeIng('milk', 2, '200', 'ml'),
      makeIng('oat milk', 2, null, null),
    ];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(3);
    expect(result[0].displayName).toBe('butter or margarine');
    expect(result[1].displayName).toBe('flour');
    expect(result[2].displayName).toBe('milk or oat milk');
  });

  it('treats a group with only one member as standalone (safety net)', () => {
    // This should not occur in production (a single-member altGroup is
    // semantically pointless) but the code must not crash.
    const input = [makeIng('butter', 99, '100', 'g')];
    const result = groupIngredients(input, CONNECTOR);

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('butter');
    expect(result[0].isAltGroup).toBe(false);
  });

  it('returns an empty array for empty input', () => {
    expect(groupIngredients([], CONNECTOR)).toEqual([]);
  });

  it('uses the provided connector (fr: "ou")', () => {
    const input = [
      makeIng('beurre', 1, '100', 'g'),
      makeIng('margarine', 1, null, null),
    ];
    const result = groupIngredients(input, 'ou');

    expect(result[0].displayName).toBe('beurre ou margarine');
  });
});
