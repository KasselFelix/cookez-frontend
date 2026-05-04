import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../contexts/ThemeProvider';
import { useResponsive } from '../../styles/responsive';
import css from '../../styles/Global'

/**
 * ProfileScreenContainer
 * Shared layout shell for ProfileScreen, SettingsScreen, PublicProfileScreen.
 *
 * Responsibilities:
 *  - SafeAreaView with the project's standard `top` edge.
 *  - Optional ScrollView (default true) with consistent contentContainer.
 *  - Centers content horizontally and caps width at `css.layout.maxContentWidth`
 *    (720 px) on tablets — phones receive 100% width.
 *  - Lets callers inject a non-scrolling header above the scroll area
 *    (e.g. SettingsScreen and PublicProfileScreen back-button bar).
 *
 * Props:
 *  - children       (node)        — the screen's main content
 *  - header         (node)        — optional fixed header rendered above ScrollView
 *  - scroll         (bool)        — wrap children in ScrollView (default true)
 *  - contentStyle   (style)       — appended to inner content container
 *  - scrollContentStyle (style)   — appended to ScrollView contentContainerStyle
 *  - safeAreaEdges  (string[])    — defaults to ['top']
 */
export default function ProfileScreenContainer({
  children,
  header,
  scroll = true,
  contentStyle,
  scrollContentStyle,
  safeAreaEdges = ['top'],
}) {
  const css = useTheme();
  const { width } = useResponsive();
  const isWide = width > css.layout.maxContentWidth;
  // On wide viewports, cap the inner content to maxContentWidth and center it.
  // On narrow viewports, let it stretch to fill the screen edge-to-edge.
  const innerWidthStyle = isWide
    ? { width: css.layout.maxContentWidth, alignSelf: 'center' }
    : { width: '100%' };

  if (!scroll) {
    return (
      <SafeAreaView style={styles.container} edges={safeAreaEdges}>
        {header}
        <View style={[styles.staticContent, innerWidthStyle, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: css.palette.surfaceCard }]} edges={safeAreaEdges}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.scrollInner, innerWidthStyle, contentStyle]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: css.spacing.xxxl,
  },
  scrollInner: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});

export { ProfileScreenContainer };
