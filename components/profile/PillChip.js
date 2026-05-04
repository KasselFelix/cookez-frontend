import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import css from '../../styles/Global';
import { useTheme } from '../../contexts/ThemeProvider';

export default function PillChip({ children, active = false, icon, onPress, style }) {
  const css = useTheme();
  const isString = typeof children === 'string';
  const containerStyle = [
    styles.container,
    active ? styles.active : [styles.inactive, {backgroundColor: css.palette.surfaceCard}] ,
    style,
  ];

  const inner = (
    <View style={styles.inner}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      {isString ? (
        <Text
          style={[styles.text, active ? {color: css.palette.white} : {color: css.palette.neutral900}]}
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
    borderRadius: css.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  inactive: {
    borderColor: css.palette.neutral300,
    backgroundColor: css.palette.surfaceCard,
  },
  active: {
    backgroundColor: css.palette.neutral900,
    borderColor: css.palette.neutral900,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 4,
  },
  text: {
    fontFamily: css.typography.fontUI,
    fontSize: 11,
    fontWeight: '500',
  },
});

export { PillChip };
