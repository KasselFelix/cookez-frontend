import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ErrorScreen from '../../components/result/ErrorScreen';

describe('ErrorScreen (Plan 006 B3)', () => {
  it('renders and calls onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    renderWithProviders(<ErrorScreen onRetry={onRetry} />, { withNavigation: false });
    expect(screen.getByTestId('result-error-screen')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
