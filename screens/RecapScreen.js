// RecapScreen — Plan 003 Phase C.4.
//
// Before this refactor the screen had a single "meal type" dropdown that
// conflated origin and tags. Phase C splits that into three theme-aware
// filter blocks (servings stepper, origin picker, multi-select tags)
// backed by the new `recipeFilters` slice. Tokens come from the active
// theme via `useTheme()` so the screen now switches with light/dark/
// pastel themes; strings go through `useT()`.

import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import Popover from 'react-native-popover-view';

import { clearIngredients } from '../reducers/ingredient';
import {
  setOrigin,
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
  const dispatch = useDispatch();
  const ingredients = useSelector((state) => state.ingredient.value);
  const filters = useSelector((state) => state.recipeFilters.value);
  const [showPopover, setShowPopover] = useState(false);

  // First press of "+" when no override is set yet jumps to a sensible
  // default (2 servings) — incrementing from null would otherwise land
  // on 1 which feels wrong for a "more people" gesture.
  const handleIncrement = useCallback(() => {
    if (filters.currentServings == null) {
      dispatch(setServings(2));
    } else {
      dispatch(incrementServings());
    }
  }, [dispatch, filters.currentServings]);

  const handleDecrement = useCallback(() => {
    if (filters.currentServings == null) {
      dispatch(setServings(1));
    } else {
      dispatch(decrementServings());
    }
  }, [dispatch, filters.currentServings]);

  const handleClearAll = () => {
    setShowPopover(false);
    dispatch(clearIngredients());
  };

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
          <View style={styles.gallery}>
            {ingredients.map((data) => (
              <Recap key={data.data.display_name} {...data} />
            ))}
          </View>
        )}

        {/* Step 2 — Servings */}
        <SectionHeading css={css}>{`${t('recap.step2')} 👨‍👩‍👧‍👦`}</SectionHeading>
        <View style={styles.filterRow}>
          <ServingsStepper
            value={filters.currentServings}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        </View>

        {/* Step 3 — Origin */}
        <SectionHeading css={css}>{`${t('recap.step3')} 🌍`}</SectionHeading>
        <View style={styles.filterRow}>
          <OriginPicker
            value={filters.selectedOrigin}
            onChange={(v) => dispatch(setOrigin(v))}
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

        <View style={styles.cta}>
          <MyButton
            dataFlow={() => navigation.navigate('Result')}
            text={t('recap.goToResults')}
            buttonType={buttonStyles.buttonTwo}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 32,
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
  cta: {
    marginTop: 24,
    alignItems: 'center',
  },
});
