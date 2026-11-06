// Development gallery (registered under __DEV__ in App.js, opened by the TEST button of the home
// screen). It shows the design tokens and the shared components of Cookez in the active theme,
// with a bar to switch between the five themes. Maestro captures it (`/ui-check gallery`), and
// a Jest test renders it in every theme.
//
// Data shown here is invented: the gallery never calls the API.
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useThemeControls } from '../contexts/ThemeProvider';
import useT from '../i18n/useT';
import { THEME_KEYS } from '../styles/themes';
import buttonStyles from '../styles/Button';
import MyButton from '../components/MyButton';
import MySmallButton from '../components/MySmallButton';
import PillChip from '../components/profile/PillChip';
import BadgeCircle from '../components/profile/BadgeCircle';
import MatchBadge from '../components/result/MatchBadge';
import SeasonalBadge from '../components/result/SeasonalBadge';
import Recipe from '../components/Recipe';
import InventoryItemCard from '../components/inventory/InventoryItemCard';
import InventorySearchBar from '../components/inventory/InventorySearchBar';
import InventoryEmptyState from '../components/inventory/InventoryEmptyState';
import ErrorScreen from '../components/result/ErrorScreen';
import OfflineScreen from '../components/result/OfflineScreen';
import StaleCacheBanner from '../components/result/StaleCacheBanner';
import NutritionPill from '../components/recipe/NutritionPill';
import NutritionSheet from '../components/recipe/NutritionSheet';
import ThemePickerSheet from '../components/profile/ThemePickerSheet';
import TestScreen from './TestScreen';

const SAMPLE_RECIPE = {
  _id: 'gallery-recipe',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  origin: ['Tunisia'],
  difficulty: 2,
  preparationTime: 25,
  votes: [{ note: 4 }, { note: 5 }],
  ingredients: [],
  steps: [],
  matchRatio: 85,
  isSeasonal: true,
};

const SAMPLE_PANTRY_ITEM = {
  _id: 'gallery-pantry-item',
  ingredient: { name: 'Tomato' },
  quantity: 4,
  unit: 'pc',
  storageLocation: 'fridge',
  daysUntilExpiry: 2,
};

const SAMPLE_NUTRITION = { calories: 320, protein: 18, carbs: 22, fat: 17 };

const TYPE_SCALE = ['h1', 'h2', 'h3', 'h4', 'body', 'bodySm', 'caption'];

function Section({ id, title, children }) {
  const css = useTheme();
  return (
    <View testID={`gallery-section-${id}`} style={[styles.section, { gap: css.spacing.sm }]}>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: css.typography.fontHeading,
          fontSize: css.typography.h3Size,
          color: css.palette.neutral900,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Swatch({ name, color }) {
  const css = useTheme();
  return (
    <View style={styles.swatch}>
      <View
        style={[
          styles.swatchColor,
          { backgroundColor: color, borderRadius: css.radius.sm, borderColor: css.palette.neutral300 },
        ]}
      />
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: css.typography.captionSize, color: css.palette.neutral700 }}>
        {name}
      </Text>
    </View>
  );
}

export default function DevGalleryScreen() {
  const css = useTheme();
  const t = useT();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { themeKey, setTheme } = useThemeControls();
  const nutritionSheetRef = useRef(null);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [chipActive, setChipActive] = useState(true);

  const colors = Object.entries(css.palette).filter(([, value]) => typeof value === 'string' && value.startsWith('#'));
  const caption = { fontSize: css.typography.captionSize, color: css.palette.neutral700 };

  return (
    <View testID="gallery-screen" style={[styles.root, { backgroundColor: css.palette.background, paddingTop: insets.top }]}>
      <View style={[styles.themeBar, { gap: css.spacing.xs, padding: css.spacing.sm }]}>
        {THEME_KEYS.map((key) => (
          <PillChip
            key={key}
            active={key === themeKey}
            onPress={() => setTheme(key)}
            style={styles.themeChip}
          >
            {key}
          </PillChip>
        ))}
      </View>

      <ScrollView
        testID="gallery-scroll"
        contentContainerStyle={{ padding: css.spacing.md, gap: css.spacing.lg, paddingBottom: insets.bottom + css.spacing.xxl }}
      >
        <Text
          testID="gallery-title"
          style={{ fontFamily: css.typography.fontDisplay, fontSize: css.typography.h1Size, color: css.palette.neutral900 }}
        >
          {t('devGallery.title')}
        </Text>

        <Section id="tokens" title={t('devGallery.sections.tokens')}>
          <View style={[styles.wrap, { gap: css.spacing.sm }]}>
            {colors.map(([name, value]) => <Swatch key={name} name={name} color={value} />)}
          </View>
          {TYPE_SCALE.map((step) => (
            <Text
              key={step}
              style={{ fontFamily: css.typography.fontBody, fontSize: css.typography[`${step}Size`], color: css.palette.neutral900 }}
            >
              {`${step} · ${css.typography[`${step}Size`]}`}
            </Text>
          ))}
          <View style={[styles.wrap, { gap: css.spacing.sm }]}>
            {Object.entries(css.radius).filter(([name]) => name !== 'camera').map(([name, value]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.radiusBox, { borderRadius: Math.min(value, 28), backgroundColor: css.palette.primary800 }]} />
                <Text style={caption}>{`${name} ${value}`}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section id="buttons" title={t('devGallery.sections.buttons')}>
          <MyButton dataFlow={() => {}} text="PRIMARY" buttonType={buttonStyles.buttonOne} />
          <MyButton dataFlow={() => {}} text="SECONDARY" buttonType={buttonStyles.buttonTwo} />
          <MySmallButton dataFlow={() => {}} text="SMALL" buttonType={buttonStyles.buttonSmall} />
        </Section>

        <Section id="chips" title={t('devGallery.sections.chips')}>
          <View style={[styles.wrap, { gap: css.spacing.sm }]}>
            <PillChip active={chipActive} onPress={() => setChipActive(!chipActive)}>Active</PillChip>
            <PillChip active={!chipActive} onPress={() => setChipActive(!chipActive)}>Inactive</PillChip>
            <MatchBadge ratio={85} />
            <MatchBadge ratio={55} />
            <MatchBadge ratio={20} />
            <SeasonalBadge />
          </View>
          <BadgeCircle
            icon={<Text style={{ fontSize: css.typography.h4Size }}>🍳</Text>}
            label="Badge"
          />
        </Section>

        <Section id="cards" title={t('devGallery.sections.cards')}>
          <Recipe {...SAMPLE_RECIPE} navigation={navigation} />
          <InventoryItemCard item={SAMPLE_PANTRY_ITEM} onEdit={() => {}} onDelete={() => {}} />
        </Section>

        <Section id="fields" title={t('devGallery.sections.fields')}>
          <InventorySearchBar value={search} onChange={setSearch} onAddPress={() => {}} />
        </Section>

        <Section id="states" title={t('devGallery.sections.states')}>
          <StaleCacheBanner />
          <View style={[styles.stateBox, { borderColor: css.palette.neutral300, borderRadius: css.radius.md }]}>
            <InventoryEmptyState onAdd={() => {}} />
          </View>
          <View style={[styles.stateBox, { borderColor: css.palette.neutral300, borderRadius: css.radius.md }]}>
            <ErrorScreen onRetry={() => {}} />
          </View>
          <View style={[styles.stateBox, { borderColor: css.palette.neutral300, borderRadius: css.radius.md }]}>
            <OfflineScreen onRetry={() => {}} />
          </View>
        </Section>

        <Section id="nutrition" title={t('devGallery.sections.nutrition')}>
          <NutritionPill caloriesPerServing={SAMPLE_NUTRITION.calories} onPress={() => nutritionSheetRef.current?.snapToIndex(0)} />
        </Section>

        <Section id="sheets" title={t('devGallery.sections.sheets')}>
          <MyButton
            dataFlow={() => nutritionSheetRef.current?.snapToIndex(0)}
            text={t('devGallery.openNutritionSheet')}
            buttonType={buttonStyles.buttonTwo}
          />
          <MyButton
            dataFlow={() => setThemeSheetVisible(true)}
            text={t('devGallery.openThemeSheet')}
            buttonType={buttonStyles.buttonTwo}
          />
        </Section>

        <Section id="sandbox" title={t('devGallery.sections.sandbox')}>
          <View style={[styles.stateBox, { borderColor: css.palette.neutral300, borderRadius: css.radius.md }]}>
            <TestScreen />
          </View>
        </Section>
      </ScrollView>

      <NutritionSheet ref={nutritionSheetRef} nutritionPerServing={SAMPLE_NUTRITION} />
      <ThemePickerSheet visible={themeSheetVisible} onClose={() => setThemeSheetVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  themeBar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  themeChip: { minHeight: 44, justifyContent: 'center' },
  section: {},
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  swatch: { alignItems: 'center', width: 80 },
  swatchColor: { width: 48, height: 48, borderWidth: StyleSheet.hairlineWidth },
  radiusBox: { width: 56, height: 56 },
  stateBox: { height: 320, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
