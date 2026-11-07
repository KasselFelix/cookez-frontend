import React from 'react';
import { Linking, Text } from 'react-native';
import { act, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders } from '../../helpers/renderWithProviders';
import { useThemeControls } from '../../../contexts/ThemeProvider';
import DevThemeLink from '../../../components/dev/DevThemeLink';

function ThemeKeyProbe() {
  const { themeKey } = useThemeControls();
  return <Text testID="theme-key">{themeKey}</Text>;
}

const renderLink = () =>
  renderWithProviders(
    <>
      <DevThemeLink />
      <ThemeKeyProbe />
    </>,
    { withNavigation: false },
  );

describe('DevThemeLink', () => {
  let urlHandler;
  const remove = jest.fn();

  beforeEach(async () => {
    // setTheme persists the key and ThemeProvider hydrates from it: start every test on light.
    await AsyncStorage.clear();
    urlHandler = undefined;
    remove.mockClear();
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockImplementation((event, handler) => {
      urlHandler = handler;
      return { remove };
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('applies the theme of a dev theme link received while running', async () => {
    renderLink();
    expect(screen.getByTestId('theme-key')).toHaveTextContent('light');
    act(() => urlHandler({ url: 'cookez-dev://dev/theme?name=dark' }));
    await waitFor(() => expect(screen.getByTestId('theme-key')).toHaveTextContent('dark'));
  });

  it('applies the theme of the link that opened the app', async () => {
    Linking.getInitialURL.mockResolvedValue('cookez-dev://dev/theme?name=pastelPeach');
    renderLink();
    await waitFor(() => expect(screen.getByTestId('theme-key')).toHaveTextContent('pastelPeach'));
  });

  it('ignores other links and unsubscribes on unmount', async () => {
    const { unmount } = renderLink();
    act(() => urlHandler({ url: 'cookez://dev/theme?name=dark' }));
    await act(async () => {});
    expect(screen.getByTestId('theme-key')).toHaveTextContent('light');
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
