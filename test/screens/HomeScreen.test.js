import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
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

// Signed in, CONNECT and SNAP replace the stack: HomeScreen does not stay
// under the tabs, so the back gesture cannot return to it.
// MyButton runs its action when the release animation ends.
const release = (testID) => fireEvent(screen.getByTestId(testID), 'pressOut');

describe('HomeScreen when signed in', () => {
  const renderSignedIn = (navigation) =>
    renderWithProviders(<HomeScreen navigation={navigation} />, {
      preloadedState: { user: { value: { token: 'session-token', username: 'chef' } } },
      withNavigation: false,
    });

  it('CONNECT resets the stack to the Dashboard tab', async () => {
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    renderSignedIn(navigation);
    release('home-connect');
    await waitFor(() => expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'TabNavigator', params: { screen: 'UserDashboard' } }],
    }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('SNAP resets the stack to the Scan tab', async () => {
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    renderSignedIn(navigation);
    release('home-snap');
    await waitFor(() => expect(navigation.reset).toHaveBeenCalledTimes(1));
    expect(navigation.reset.mock.calls[0][0].routes).toEqual([
      { name: 'TabNavigator', params: { screen: 'Kickoff' } },
    ]);
  });

  it('signed out, SNAP and CONNECT still push over HomeScreen', async () => {
    const navigation = { navigate: jest.fn(), reset: jest.fn() };
    renderWithProviders(<HomeScreen navigation={navigation} />, {
      preloadedState: { user: makeLoggedOutUserState() },
      withNavigation: false,
    });
    release('home-snap');
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Kickoff'));
    release('home-connect');
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('Login'));
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});
