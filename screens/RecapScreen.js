// RecapScreen — Plan 003 Phase C.4.
//
// Before this refactor the screen had a single "meal type" dropdown that
// conflated origin and tags. Phase C splits that into three theme-aware
// filter blocks (servings stepper, origin picker, multi-select tags)
// backed by the new `recipeFilters` slice. Tokens come from the active
// theme via `useTheme()` so the screen now switches with light/dark/
// pastel themes; strings go through `useT()`.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import Popover from 'react-native-popover-view';

import { clearIngredients } from '../reducers/ingredient';
import {
  setOrigins,
  setServings,
  incrementServings,
  decrementServings,
  toggleTag,
} from '../reducers/recipeFilters';
import MyButton from '../components/MyButton';
import MySmallButton from '../components/MySmallButton';
import Recap from '../components/Recap';
import ServingsStepper from '../components/recipeFilters/ServingsStepper';
import OriginPicker from '../components/recipeFilters/OriginPicker';
import TagsMultiSelect from '../components/recipeFilters/TagsMultiSelect';
import buttonStyles from '../styles/Button';
import { useTheme } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';

export default function RecapScreen({ navigation }) {
  const css = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.value);
  const filters = useSelector((state) => state.recipeFilters.value);
  const [showPopover, setShowPopover] = useState(false);

  // The slice now defaults currentServings to 1, so the stepper never
  // displays "-" or null. Increment/decrement just delegate to the
  // slice reducers which clamp [1, 12].
  const handleIncrement = useCallback(() => {
    dispatch(incrementServings());
  }, [dispatch]);

  const handleDecrement = useCallback(() => {
    dispatch(decrementServings());
  }, [dispatch]);

  const handleClearAll = () => {
    setShowPopover(false);
    dispatch(clearIngredients());
  };

  // Inner-scroll "more below" indicator. Tracking three measurements:
  //  - contentH (full list height)         via onContentSizeChange
  //  - visibleH (ScrollView frame height)  via onLayout
  //  - scrollY (current offset)            via onScroll
  // Indicator shows iff list is taller than its frame AND user isn't
  // already at (or within 12px of) the bottom.
  const galleryScrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    contentH: 0,
    visibleH: 0,
    scrollY: 0,
  });
  const showScrollHint =
    scrollState.contentH > scrollState.visibleH &&
    scrollState.scrollY + scrollState.visibleH < scrollState.contentH - 12;

  const hintY = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;

  // Loop the bounce + fade pulse while the indicator is visible. The loop
  // is restarted on each show because Animated.loop stops on cleanup,
  // and the dependencies (showScrollHint) act as the gate.
  useEffect(() => {
    if (!showScrollHint) {
      hintY.setValue(0);
      hintOpacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(hintY, {
            toValue: 6,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hintY, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(hintOpacity, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(hintOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [showScrollHint, hintY, hintOpacity]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: css.palette.secondary500 },
      ]}
    >
      <View style={styles.header}>
        <MySmallButton
          dataFlow={() => navigation.navigate('Kickoff')}
          text={
            <FontAwesome
              name="angle-double-left"
              size={30}
              color={css.palette.white}
            />
          }
          buttonType={buttonStyles.buttonSmall}
        />
        <Text
          style={{
            fontSize: css.typography.h5Size,
            fontFamily: css.typography.fontHeading,
            color: css.palette.neutral900,
          }}
          accessibilityRole="header"
        >
          {ingredients.length === 1
            ? t('recap.ingredient')
            : t('recap.ingredients')}
        </Text>
        <Popover
          placement="floating"
          backgroundStyle={styles.popoverBackground}
          isVisible={showPopover}
          onRequestClose={() => setShowPopover(false)}
          from={
            <TouchableOpacity accessibilityLabel={t('recap.confirmClear')}>
              <MySmallButton
                dataFlow={() => setShowPopover(true)}
                text={
                  <FontAwesome
                    name="times"
                    size={25}
                    color={css.palette.error}
                  />
                }
                buttonType={buttonStyles.buttonSmall}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.popoverContainer}>
            <Text
              style={{
                color: css.palette.neutral900,
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.bodySize,
                textAlign: 'center',
              }}
            >
              {ingredients.length > 0
                ? t('recap.confirmClear')
                : t('recap.noIngredients')}
            </Text>
            {ingredients.length > 0 && (
              <View style={styles.removeBtnRow}>
                <TouchableOpacity
                  onPress={() => setShowPopover(false)}
                  accessibilityLabel={t('common.cancel')}
                  style={[
                    styles.popoverBtn,
                    { backgroundColor: css.palette.secondary500 },
                  ]}
                >
                  <FontAwesome
                    name="times"
                    size={22}
                    color={css.palette.error}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClearAll}
                  accessibilityLabel={t('common.yes')}
                  style={[
                    styles.popoverBtn,
                    { backgroundColor: css.palette.secondary500 },
                  ]}
                >
                  <FontAwesome
                    name="check"
                    size={22}
                    color={css.palette.success}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Popover>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1 — Ingredient gallery */}
        <SectionHeading css={css}>{t('recap.step1')}</SectionHeading>
        {ingredients.length === 0 ? (
          <Animatable.View
            animation="slideInDown"
            duration={700}
            style={styles.emptyBlock}
          >
            <Text
              style={{
                color: css.palette.neutral700,
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.bodySize,
                textAlign: 'center',
              }}
            >
              {t('recap.emptyHint1')}
            </Text>
            <Text
              style={{
                color: css.palette.neutral700,
                fontFamily: css.typography.fontBody,
                fontSize: css.typography.bodySize,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {t('recap.emptyHint2')}
            </Text>
          </Animatable.View>
        ) : (
          <View style={styles.galleryWrapper}>
            <ScrollView
              ref={galleryScrollRef}
              style={styles.galleryScroll}
              contentContainerStyle={styles.galleryScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onLayout={(e) => {
                // Synthetic events are pooled in React Native — extract the
                // value synchronously before scheduling the state update,
                // otherwise `e.nativeEvent` may be nulled when setState runs.
                const h = e.nativeEvent.layout.height;
                setScrollState((s) => ({ ...s, visibleH: h }));
              }}
              onContentSizeChange={(_w, h) =>
                setScrollState((s) => ({ ...s, contentH: h }))
              }
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                setScrollState((s) => ({ ...s, scrollY: y }));
              }}
              scrollEventThrottle={16}
            >
              <View style={styles.gallery}>
                {ingredients.map((data) => (
                  <Recap key={data.data.display_name} {...data} />
                ))}
              </View>
            </ScrollView>
            {showScrollHint && (
              <TouchableOpacity
                onPress={() =>
                  galleryScrollRef.current?.scrollToEnd({ animated: true })
                }
                accessibilityRole="button"
                accessibilityLabel={t('recap.scrollMore')}
                hitSlop={10}
                style={styles.scrollHint}
              >
                <Animated.View
                  style={{
                    transform: [{ translateY: hintY }],
                    opacity: hintOpacity,
                  }}
                >
                  <FontAwesome
                    name="angle-double-down"
                    size={28}
                    color={css.palette.primary800}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 2 — Origin (multi-select cuisine filter) */}
        <SectionHeading css={css}>{`${t('recap.step2')} 🌍`}</SectionHeading>
        <View style={styles.filterRow}>
          <OriginPicker
            value={filters.selectedOrigins}
            onChange={(v) => dispatch(setOrigins(v))}
          />
        </View>

        {/* Step 3 — Servings */}
        <SectionHeading css={css}>{`${t('recap.step3')} 👨‍👩‍👧‍👦`}</SectionHeading>
        <View style={styles.filterRow}>
          <ServingsStepper
            value={filters.currentServings}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        </View>

        {/* Step 4 — Tags */}
        <SectionHeading css={css}>{`${t('recap.step4')} 🏷️`}</SectionHeading>
        <View style={styles.filterRow}>
          <TagsMultiSelect
            value={filters.selectedTags}
            onToggle={(tag) => dispatch(toggleTag(tag))}
          />
        </View>
      </ScrollView>

      {/* Sticky CTA — stays anchored at the bottom regardless of scroll,
          so the user's thumb always finds it. paddingBottom uses the
          safe-area inset so the button doesn't sit on top of the device's
          gesture bar / nav bar. */}
      <View
        style={[
          styles.stickyCta,
          {
            backgroundColor: css.palette.secondary500,
            paddingBottom: 12 + insets.bottom,
          },
        ]}
      >
        <MyButton
          dataFlow={() => navigation.navigate('Result')}
          text={t('recap.goToResults')}
          buttonType={buttonStyles.buttonTwo}
        />
      </View>
    </SafeAreaView>
  );
}

function SectionHeading({ css, children }) {
  return (
    <Text
      style={[
        styles.sectionHeading,
        {
          color: css.palette.neutral900,
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h5Size,
        },
      ]}
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '15%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
  },
  popoverBackground: {
    backgroundColor: 'transparent',
  },
  popoverContainer: {
    width: 280,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  removeBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 100,
    marginTop: 8,
  },
  popoverBtn: {
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 100,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    // Bottom inset matches stickyCta height so the last filter card
    // isn't hidden under the floating button.
    paddingBottom: 96,
  },
  stickyCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  sectionHeading: {
    marginTop: 16,
    marginBottom: 8,
    width: '90%',
  },
  filterRow: {
    width: '90%',
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    width: '90%',
  },
  gallery: {
    alignItems: 'center',
    width: '100%',
  },
  galleryWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  // Cap the ingredient list at ~4 visible cards (~105px each + 10px gap).
  // Beyond that the user scrolls inside the inner ScrollView while the
  // outer screen remains anchored, keeping the Tags/Origin sections in view.
  galleryScroll: {
    width: '100%',
    maxHeight: 420,
  },
  galleryScrollContent: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  scrollHint: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 2,
    padding: 6,
  },
  cta: {
    marginTop: 24,
    alignItems: 'center',
  },
});
