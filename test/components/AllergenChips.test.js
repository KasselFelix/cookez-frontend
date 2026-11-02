/* global describe, it, expect, jest */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import AllergenChips from '../../components/settings/AllergenChips';
import { renderWithProviders } from '../helpers/renderWithProviders';

describe('AllergenChips', () => {
  it('offers the 14 allergens and marks the selected ones', () => {
    renderWithProviders(<AllergenChips value={['soy']} onChange={jest.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(14);
    expect(screen.getByRole('checkbox', { checked: true })).toBeTruthy();
  });

  it('adds an allergen without mutating the value', () => {
    const value = ['soy'];
    const onChange = jest.fn();
    renderWithProviders(<AllergenChips value={value} onChange={onChange} />);
    fireEvent.press(screen.getAllByRole('checkbox', { checked: false })[0]);
    expect(onChange).toHaveBeenCalledWith(['soy', 'gluten']);
    expect(value).toEqual(['soy']);
  });

  it('removes a selected allergen', () => {
    const onChange = jest.fn();
    renderWithProviders(<AllergenChips value={['soy']} onChange={onChange} />);
    fireEvent.press(screen.getByRole('checkbox', { checked: true }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
