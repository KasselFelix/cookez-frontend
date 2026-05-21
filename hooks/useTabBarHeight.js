// useTabBarHeight — returns the total vertical space occupied by the floating
// glass-capsule tab bar, including its bottom safe-area offset and the breathing
// room around the capsule. Use it on tab screens to pad scrollable containers
// (FlatList/ScrollView contentContainerStyle.paddingBottom) so the last item
// is never cropped under the floating bar.
//
// The constants are exported so layout code (e.g. floating action buttons,
// snap-points) can align with the bar geometry without re-hardcoding values.

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BAR_HEIGHT = 60;
export const BAR_MARGIN_BOTTOM = 12;
export const BAR_PADDING_HORIZONTAL = 16;
// Extra breathing space between the last content row and the top edge of the
// floating capsule. Keeps a clean visual gap on every screen.
export const BAR_CONTENT_BUFFER = 16;

export default function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  // Mirrors FloatingTabBar's wrapper math:
  //   paddingBottom = Math.max(insets.bottom, 8) + BAR_MARGIN_BOTTOM
  // Plus the capsule height itself + a final 16-pt content buffer.
  return (
    BAR_HEIGHT
    + Math.max(insets.bottom, 8)
    + BAR_MARGIN_BOTTOM
    + BAR_CONTENT_BUFFER
  );
}
