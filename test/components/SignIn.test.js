// SignIn (plan 020): a failed sign-in shows its error inside the modal,
// where a toast would stay hidden, and typing again clears it.
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { mockFetchError, mockFetchJson } from '../mocks/api';
import SignIn from '../../components/SignIn';

// MyButton runs its action at the end of its press-out animation.
const pressButton = (label) => fireEvent(screen.getByRole('button', { name: label }), 'pressOut');

async function openAndSubmit() {
  renderWithProviders(<SignIn navigation={{ reset: jest.fn(), navigate: jest.fn() }} />);
  pressButton('SIGN IN');
  fireEvent.changeText(await screen.findByTestId('login-username'), 'chef');
  fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
  pressButton('Signin');
}

describe('SignIn', () => {
  it('shows the server error in the modal, then clears it on typing', async () => {
    mockFetchJson({ result: false, error: 'User not found or wrong password' });
    await openAndSubmit();

    expect(await screen.findByText('User not found or wrong password')).toBeTruthy();
    expect(screen.getByTestId('login-error')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('login-password'), 'right');
    expect(screen.queryByTestId('login-error')).toBeNull();
  });

  it('shows a network error in the modal', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchError();
    await openAndSubmit();

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
  });
});
