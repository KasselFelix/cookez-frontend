// ConfirmPill — "to confirm" mark of a scanned ingredient the analysis was not
// sure about (plan 015). Tapping it accepts the ingredient.

import { Pressable, StyleSheet, Text } from 'react-native';
import { useDispatch } from 'react-redux';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { setIngredientConfirmed } from '../../reducers/ingredient';

/**
 * @param {{ name: string, style?: object }} props `name` is the ingredient's display_name.
 */
export default function ConfirmPill({ name, style }) {
  const css = useTheme();
  const t = useT();
  const dispatch = useDispatch();

  return (
    <Pressable
      onPress={() => dispatch(setIngredientConfirmed({ display_name: name }))}
      accessibilityRole="button"
      accessibilityLabel={t('kickoff.scan.confirmA11y', { name })}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      testID="confirm-pill"
      style={[
        styles.pill,
        {
          backgroundColor: css.palette.warningBg,
          borderColor: css.palette.warning,
          borderRadius: css.radius.pill,
          paddingHorizontal: css.spacing.sm,
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        // warningBg stays pale in every theme: the text stays dark.
        style={{
          color: css.palette.black,
          fontFamily: css.typography.fontUI,
          fontSize: css.typography.captionSize,
          fontWeight: '700',
        }}
      >
        {t('kickoff.scan.toConfirm')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    paddingVertical: 2,
    alignSelf: 'center',
  },
});
