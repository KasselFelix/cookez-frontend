import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeProvider';

export default function PillChip({ children, active = false, icon, onPress, style }) {
  const css = useTheme();
  const isString = typeof children === 'string';
  const containerStyle = [
    styles.container,
    {
      borderRadius: css.radius.pill,
      // Theme tokens: the active chip takes the primary button colors.
      backgroundColor: active ? css.button.primaryBg : css.palette.surfaceCard,
      borderColor: active ? css.button.primaryBg : css.palette.neutral300,
    },
    style,
  ];

  const inner = (
    <View style={styles.inner}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      {isString ? (
        <Text
          style={[
            styles.text,
            {
              fontFamily: css.typography.fontUI,
              fontSize: css.typography.overlineSize,
              color: active ? css.button.primaryText : css.palette.neutral900,
            },
          ]}
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isString ? children : 'Chip'}
        hitSlop={8}
        style={containerStyle}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
});

export { PillChip };
