// InlineMessage (plan 020): the message shown inside a modal or under a
// field, with its own background, read by the screen reader.

import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';

import InlineMessage from '../../../components/feedback/InlineMessage';
import { renderWithProviders } from '../../helpers/renderWithProviders';

const render = (ui) => renderWithProviders(ui, { withNavigation: false });

describe('InlineMessage', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing without a message', () => {
    render(<InlineMessage testID="msg" message="" />);
    expect(screen.queryByTestId('msg')).toBeNull();
  });

  it('shows an error as an alert, on its own background', () => {
    render(<InlineMessage testID="msg" message="Wrong password" />);

    const box = screen.getByTestId('msg');
    expect(screen.getByText('Wrong password')).toBeTruthy();
    expect(box.props.accessibilityRole).toBe('alert');
    expect(StyleSheet.flatten(box.props.style).backgroundColor).toBeTruthy();
  });

  it('shows an info or a warning as plain text', () => {
    render(<InlineMessage testID="msg" type="warning" message="Unknown terms: foo" />);
    expect(screen.getByTestId('msg').props.accessibilityRole).toBe('text');
  });

  it('announces each new message on iOS', () => {
    const { rerender } = render(<InlineMessage message="First" />);
    rerender(<InlineMessage message="Second" />);

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(1, 'First');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(2, 'Second');
  });
});
