// SignUp (plan 020): a failed sign-up shows its error inside the modal; the
// network error, swallowed before, is shown too.
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockFetchError, mockFetchJson } from '../mocks/api';
import SignUp from '../../components/SignUp';

// MyButton runs its action at the end of its press-out animation.
const pressButton = (label) => fireEvent(screen.getByRole('button', { name: label }), 'pressOut');

async function openAndSubmit() {
  renderWithProviders(<SignUp navigation={{ reset: jest.fn(), navigate: jest.fn() }} />);
  pressButton('SIGN UP');
  fireEvent.changeText(await screen.findByPlaceholderText('username'), 'chef');
  pressButton('Signup');
}

describe('SignUp', () => {
  it('shows the server error in the modal, then clears it on typing', async () => {
    mockFetchJson({ result: false, error: 'User already exists' });
    await openAndSubmit();

    expect(await screen.findByText('User already exists')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('email'), 'chef@example.com');
    expect(screen.queryByTestId('signup-error')).toBeNull();
  });

  it('shows a network error in the modal', async () => {
    mockFetchError();
    await openAndSubmit();

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
  });
});
