import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeLoggedOutUserState } from '../factories/user';
import HomeScreen from '../../screens/HomeScreen';

const nav = { navigate: jest.fn() };
const renderScreen = () =>
  renderWithProviders(<HomeScreen navigation={nav} />, {
    preloadedState: { user: makeLoggedOutUserState() },
    withNavigation: false,
  });

describe('HomeScreen TEST button', () => {
  const originalDev = global.__DEV__;
  afterEach(() => { global.__DEV__ = originalDev; });

  it('is not rendered in production builds (__DEV__ false)', () => {
    global.__DEV__ = false;
    renderScreen();
    expect(screen.queryByText('TEST')).toBeNull();
    expect(screen.getByText('SNAP 📸')).toBeTruthy();
    expect(screen.getByText('CONNECT')).toBeTruthy();
  });

  it('is rendered in development builds (__DEV__ true)', () => {
    global.__DEV__ = true;
    renderScreen();
    expect(screen.getByText('TEST')).toBeTruthy();
  });
});
