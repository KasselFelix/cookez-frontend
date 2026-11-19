// ToastProvider and Toast (plan 020): one non-blocking message at a time,
// replaced by the next one, closed on touch or after its delay, announced to
// the screen reader.

import React from 'react';
import { AccessibilityInfo, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { toastDuration, useToast } from '../../contexts/ToastProvider';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { finishAnimations, holdAnimations } from '../helpers/animations';

function Trigger({ toast, label = 'show' }) {
  const { show } = useToast();
  return (
    <Pressable accessibilityRole="button" onPress={() => show(toast)}>
      <Text>{label}</Text>
    </Pressable>
  );
}

// Lets the recommended-timeout promise resolve so the hide timer is set.
const flushTimeout = () => act(async () => {});

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    jest
      .spyOn(AccessibilityInfo, 'getRecommendedTimeoutMillis')
      .mockImplementation((ms) => Promise.resolve(ms));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows the message, with its title, and nothing before', async () => {
    renderWithProviders(
      <Trigger toast={{ type: 'success', title: 'Done', message: 'Recipe published' }} />,
      {
        withNavigation: false,
      },
    );
    expect(screen.queryByTestId('toast')).toBeNull();

    fireEvent.press(screen.getByText('show'));
    await flushTimeout();

    expect(screen.getByTestId('toast')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Recipe published')).toBeTruthy();
  });

  it('replaces the current toast with the new one', async () => {
    renderWithProviders(
      <>
        <Trigger toast={{ type: 'info', message: 'First' }} label="first" />
        <Trigger toast={{ type: 'error', message: 'Second' }} label="second" />
      </>,
      { withNavigation: false },
    );

    fireEvent.press(screen.getByText('first'));
    await flushTimeout();
    fireEvent.press(screen.getByText('second'));
    await flushTimeout();

    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getAllByTestId('toast')).toHaveLength(1);
  });

  it('closes on touch of its close button', async () => {
    renderWithProviders(<Trigger toast={{ type: 'info', message: 'Coming soon' }} />, {
      withNavigation: false,
    });
    fireEvent.press(screen.getByText('show'));
    await flushTimeout();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Coming soon')).toBeNull();
  });

  it('arms no timer for a toast closed before its delay is known', async () => {
    renderWithProviders(<Trigger toast={{ type: 'info', message: 'Quick' }} />, {
      withNavigation: false,
    });
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    // The fade-out keeps running, as on a device.
    holdAnimations();

    fireEvent.press(screen.getByText('show'));
    // Closed before the recommended-timeout promise resolves, twice.
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await flushTimeout();

    const base = toastDuration({ type: 'info', message: 'Quick' });
    expect(setTimeoutSpy.mock.calls.some(([, ms]) => ms >= base)).toBe(false);
    // One fade-out, not one per tap.
    expect(global.__reanimatedHeld).toHaveLength(1);

    act(() => finishAnimations());
    expect(screen.queryByText('Quick')).toBeNull();
  });

  it('closes by itself after its delay, stretched by the accessibility setting', async () => {
    AccessibilityInfo.getRecommendedTimeoutMillis.mockImplementation(() => Promise.resolve(20000));
    renderWithProviders(<Trigger toast={{ type: 'error', message: 'Upload failed' }} />, {
      withNavigation: false,
    });
    fireEvent.press(screen.getByText('show'));
    await flushTimeout();

    const base = toastDuration({ type: 'error', message: 'Upload failed' });
    expect(AccessibilityInfo.getRecommendedTimeoutMillis).toHaveBeenCalledWith(base);

    act(() => jest.advanceTimersByTime(base + 100));
    expect(screen.getByText('Upload failed')).toBeTruthy();

    act(() => jest.advanceTimersByTime(20000));
    expect(screen.queryByText('Upload failed')).toBeNull();
  });

  it('keeps the replacing toast for its own full delay', async () => {
    renderWithProviders(
      <>
        <Trigger toast={{ type: 'info', message: 'First' }} label="first" />
        <Trigger toast={{ type: 'info', message: 'Second' }} label="second" />
      </>,
      { withNavigation: false },
    );
    fireEvent.press(screen.getByText('first'));
    await flushTimeout();
    act(() => jest.advanceTimersByTime(3000));
    fireEvent.press(screen.getByText('second'));
    await flushTimeout();

    // The first toast's timer would have fired here.
    act(() => jest.advanceTimersByTime(1500));
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('announces the toast to the screen reader on iOS', async () => {
    renderWithProviders(
      <Trigger toast={{ type: 'success', title: 'Done', message: 'Recipe published' }} />,
      {
        withNavigation: false,
      },
    );
    fireEvent.press(screen.getByText('show'));
    await flushTimeout();

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Done. Recipe published',
    );
  });

  it('clears its timer on unmount', async () => {
    const { unmount } = renderWithProviders(<Trigger toast={{ type: 'info', message: 'Bye' }} />, {
      withNavigation: false,
    });
    fireEvent.press(screen.getByText('show'));
    await flushTimeout();
    // The press also leaves a timer of its own: count the toast's only.
    const shown = jest.getTimerCount();

    unmount();
    expect(jest.getTimerCount()).toBe(shown - 1);
  });

  it('gives an error at least 5 s, and a long text more time', () => {
    expect(toastDuration({ type: 'error', message: 'No' })).toBeGreaterThanOrEqual(5000);
    expect(toastDuration({ type: 'info', message: 'No' })).toBeLessThan(5000);
    expect(toastDuration({ type: 'info', message: 'x'.repeat(120) })).toBeGreaterThan(
      toastDuration({ type: 'info', message: 'x'.repeat(20) }),
    );
    expect(toastDuration({ type: 'info', message: 'x'.repeat(1000) })).toBe(10000);
  });
});

describe('useToast without a provider', () => {
  it('returns a show that does nothing', () => {
    render(<Trigger toast={{ type: 'info', message: 'Nowhere' }} />);
    fireEvent.press(screen.getByText('show'));
    expect(screen.queryByText('Nowhere')).toBeNull();
  });
});
