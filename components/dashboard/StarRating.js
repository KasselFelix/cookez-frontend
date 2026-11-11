// StarRating — five stars, the average vote rounded down.
// FontAwesome stays until the Lucide migration (plan 018, step 4).
import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeProvider';

/**
 * @param {{ votes?: { note: number }[], size?: number, style?: object }} props
 */
export default function StarRating({ votes, size = 13, style }) {
  const css = useTheme();
  const avg = votes?.length
    ? votes.reduce((s, v) => s + v.note, 0) / votes.length
    : 0;
  const rounded = Math.floor(avg);

  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: 5 }, (_, i) => (
        <FontAwesome
          key={i}
          name="star"
          size={size}
          color={i < rounded ? css.palette.warning : css.palette.neutral300}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
