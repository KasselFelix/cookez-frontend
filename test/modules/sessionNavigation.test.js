/* global jest, describe, it, expect */
// HomeScreen (SNAP / CONNECT) is the start screen only: once signed in, the
// back gesture must never return to it, so entering the app resets the root
// stack instead of pushing the tabs over HomeScreen.
import { enterApp, exitToHome } from '../../modules/sessionNavigation';

const makeNav = (parent) => ({ reset: jest.fn(), getParent: () => parent });

describe('sessionNavigation', () => {
  it('enterApp leaves the tabs as the only route, on the Dashboard', () => {
    const nav = makeNav();
    enterApp(nav);
    expect(nav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'TabNavigator', params: { screen: 'UserDashboard' } }],
    });
  });

  it('enterApp can open another tab', () => {
    const nav = makeNav();
    enterApp(nav, 'Kickoff');
    expect(nav.reset.mock.calls[0][0].routes[0].params).toEqual({ screen: 'Kickoff' });
  });

  it('exitToHome leaves HomeScreen as the only route', () => {
    const nav = makeNav();
    exitToHome(nav);
    expect(nav.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  });

  it('resets the root stack when called from a tab screen', () => {
    const root = makeNav();
    const tab = makeNav(root);
    enterApp(tab);
    expect(tab.reset).not.toHaveBeenCalled();
    expect(root.reset).toHaveBeenCalledTimes(1);
  });
});
