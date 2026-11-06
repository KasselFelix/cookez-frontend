/* global jest, describe, it, expect, beforeEach */
// Plan 015: SNAP needs an account; a photo is sent to POST /vision/analyze as soon
// as it is taken, at about 1024 px, and its slot says it is being analysed.
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeLoggedOutUserState, makeUserState } from '../factories/user';
import AuthGateProvider from '../../contexts/AuthGateProvider';
import KickoffScreen from '../../screens/KickoffScreen';

const mockCamera = {
  takePictureAsync: jest.fn(async () => ({ uri: 'file:///shot.jpg' })),
  getAvailablePictureSizesAsync: jest.fn(async () => ['4000x3000', '1280x960', '640x480']),
};

jest.mock('expo-camera', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  const CameraView = ReactActual.forwardRef((props, ref) => {
    ReactActual.useImperativeHandle(ref, () => mockCamera);
    ReactActual.useEffect(() => {
      props.onCameraReady?.();
    }, []);
    return <View testID="camera" pictureSize={props.pictureSize} />;
  });
  return {
    CameraView,
    useCameraPermissions: () => [{ granted: true, status: 'granted' }, jest.fn()],
  };
});

const navigation = { navigate: jest.fn() };

const renderKickoff = (user) =>
  renderWithProviders(
    <AuthGateProvider>
      <KickoffScreen navigation={navigation} />
    </AuthGateProvider>,
    { preloadedState: { user } }
  );

const pendingFetch = () => new Promise(() => {});

beforeEach(() => {
  global.fetch = jest.fn(pendingFetch);
});

describe('KickoffScreen scan', () => {
  it('shows the photo tip', async () => {
    renderKickoff(makeLoggedOutUserState());
    expect(await screen.findByText('1 to 5 foods per photo, well lit')).toBeTruthy();
  });

  it('asks a guest to create an account instead of taking the photo', async () => {
    renderKickoff(makeLoggedOutUserState());
    fireEvent.press(await screen.findByTestId('kickoff-snap'));
    expect(await screen.findByText('Create a free account to recognise ingredients from your photos.')).toBeTruthy();
    expect(mockCamera.takePictureAsync).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/vision/'))).toBe(false);
  });

  it('picks a ~1024 px picture size and sends the photo right away', async () => {
    const user = makeUserState();
    renderKickoff(user);
    await waitFor(() => expect(screen.getByTestId('camera').props.pictureSize).toBe('1280x960'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('kickoff-snap'));
    });

    expect(mockCamera.takePictureAsync).toHaveBeenCalledWith({ quality: 0.7 });
    const call = global.fetch.mock.calls.find(([url]) => String(url).endsWith('/vision/analyze'));
    expect(call).toBeDefined();
    expect(call[1].headers).toEqual({ Authorization: `Bearer ${user.value.token}` });
    expect(await screen.findByText('Analysing…')).toBeTruthy();
  });
});
