// profileNavigation — central rule for "tap on a username".
//
// Two sinks:
//   - own username → bottom-tab `Profile` (full editable view)
//   - someone else → stack `PublicProfile` (read-only)
//
// Why centralize? When this is sprinkled inline across screens, the
// "self vs other" check inevitably drifts (case-insensitive in one
// spot, exact-match in another). A single helper guarantees parity
// and gives us one place to evolve the rule (e.g., handle blocked
// users, deep links, future Mention components).

/**
 * Navigate to the appropriate profile route for `username`.
 *
 * @param navigation       react-navigation prop
 * @param username         the target username (case-sensitive against current)
 * @param currentUsername  the logged-in user's username (or undefined)
 */
export function navigateToProfile(navigation, username, currentUsername) {
  if (!navigation || !username) return;
  if (currentUsername && username === currentUsername) {
    navigation.navigate('TabNavigator', { screen: 'Profile' });
    return;
  }
  navigation.navigate('PublicProfile', { username });
}

export default navigateToProfile;
