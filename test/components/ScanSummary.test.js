/* global jest, describe, it, expect */
// Plan 015: Recap shows the analyses still running, the failed ones, and sends an
// unknown name back to Kickoff's search.
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ScanSummary from '../../components/recap/ScanSummary';

const scanState = (photos, unmatched = []) => ({
  scan: { value: { photos, unmatched, pendingSearch: null } },
});

describe('ScanSummary', () => {
  it('renders nothing when no photo is pending or failed and no name is left', () => {
    renderWithProviders(<ScanSummary />, {
      preloadedState: scanState([{ id: '1', uri: 'u', status: 'empty' }]),
      withNavigation: false,
    });
    expect(screen.queryByTestId('scan-summary')).toBeNull();
  });

  it('counts the pending and the failed photos', () => {
    renderWithProviders(<ScanSummary />, {
      preloadedState: scanState([
        { id: '1', uri: 'a', status: 'pending' },
        { id: '2', uri: 'b', status: 'pending' },
        { id: '3', uri: 'c', status: 'quota' },
      ]),
      withNavigation: false,
    });
    expect(screen.getByText('2 photos being analysed…')).toBeTruthy();
    expect(screen.getByText('1 photo could not be analysed')).toBeTruthy();
  });

  it('asks Kickoff to search an unknown name', () => {
    const onSearch = jest.fn();
    const { store } = renderWithProviders(<ScanSummary onSearch={onSearch} />, {
      preloadedState: scanState([], ['yuzu kosho', 'pitaya']),
      withNavigation: false,
    });
    fireEvent.press(screen.getByLabelText('Search for yuzu kosho'));
    expect(onSearch).toHaveBeenCalled();
    expect(store.getState().scan.value).toMatchObject({ unmatched: ['pitaya'], pendingSearch: 'yuzu kosho' });

    fireEvent.press(screen.getByLabelText('Dismiss pitaya'));
    expect(store.getState().scan.value.unmatched).toEqual([]);
  });
});
