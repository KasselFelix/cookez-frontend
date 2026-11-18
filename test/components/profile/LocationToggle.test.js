// LocationToggle (plan 020): its messages are toasts, not alerts — an info
// when location is off or refused, an error when saving fails.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { mockFetchError, mockFetchJsonAlways } from '../../mocks/api';
import LocationToggle from '../../../components/profile/LocationToggle';

jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));
const Location = require('expo-location');

const render = (consent = false) =>
  renderWithProviders(<LocationToggle />, {
    withNavigation: false,
    preloadedState: {
      locale: { value: { lang: 'en' } },
      user: { value: { username: 'chef', token: 'tok', location: { consent } } },
    },
  });

describe('LocationToggle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an info toast when location services are off', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(false);
    render();

    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(await screen.findByText('Location services off')).toBeTruthy();
    expect(screen.getByTestId('toast')).toBeTruthy();
  });

  it('shows an info toast when the permission is refused', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mockFetchJsonAlways({ result: true, updated: { location: { consent: false } } });
    render();

    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(await screen.findByText('Permission denied')).toBeTruthy();
  });

  it('shows an error toast when saving fails', async () => {
    mockFetchError();
    render(true);

    fireEvent(screen.getByRole('switch'), 'valueChange', false);

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
  });
});

// Plan 019: the save goes through putUserProfile (modules/recipesApi.js).
describe('LocationToggle, saved', () => {
  it('sends consent=false by PUT /users/profile and stores the diff', async () => {
    mockFetchJsonAlways({ result: true, updated: { location: { consent: false } } });
    const { store } = render(true);

    fireEvent(screen.getByRole('switch'), 'valueChange', false);

    await waitFor(() => expect(store.getState().user.value.location.consent).toBe(false));
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.invalid/users/profile');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ location: { consent: false } });
  });
});

describe('LocationToggle, refused permission and failed save', () => {
  it('keeps the save error instead of the refusal info', async () => {
    Location.hasServicesEnabledAsync.mockResolvedValue(true);
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mockFetchError();
    render();

    fireEvent(screen.getByRole('switch'), 'valueChange', true);

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
    expect(screen.queryByText('Permission denied')).toBeNull();
  });
});
