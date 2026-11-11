// sessionNavigation — HomeScreen (SNAP / CONNECT) is the start screen only.
//
// Once signed in, HomeScreen and Login must not stay under the tabs: the
// Android back gesture would bring the user back to them. Entering the app
// therefore RESETS the root stack to the tabs alone, and signing out resets it
// to HomeScreen alone, so no signed-in screen stays reachable by going back.

// A tab screen holds the tab navigator's prop: reset must reach the root stack.
function rootOf(navigation) {
  let root = navigation;
  while (root.getParent?.()) root = root.getParent();
  return root;
}

/**
 * Makes the tabs the only route of the root stack.
 *
 * @param navigation react-navigation prop of a root-stack screen (or a child)
 * @param {string} [screen] tab to open, the Dashboard by default
 */
export function enterApp(navigation, screen = 'UserDashboard') {
  rootOf(navigation).reset({
    index: 0,
    routes: [{ name: 'TabNavigator', params: { screen } }],
  });
}

/**
 * Makes HomeScreen the only route of the root stack (sign out, guest "home").
 *
 * @param navigation react-navigation prop of a root-stack screen (or a child)
 */
export function exitToHome(navigation) {
  rootOf(navigation).reset({ index: 0, routes: [{ name: 'Home' }] });
}
