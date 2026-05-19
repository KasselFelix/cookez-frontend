// Dev-only screen — playground pour visualiser/itérer des composants
// graphiques. Accessible via le bouton "TEST" sur HomeScreen.
//
// Itération courante : 3 redesigns du KickoffScreen (mode loggué) pour
// arbitrer la hiérarchie visuelle entre la pantry BDD et la zone
// camera + slots photos. Sélecteur "Variant A/B/C" en haut.
//
// Volontairement autonome : mocks inline pour la grille pantry et la
// camera viewport. Aucun bind Redux/CameraView ici — on compare des
// LAYOUTS, pas des comportements. Les vrais tokens (`css.spacing`,
// `css.radius`, `css.shadow`, `css.palette`) sont utilisés pour que les
// proportions soient fidèles à la production.

import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeProvider';

// ----------------------------------------------------------------------------
// Mock data — reproduit fidèlement les 4 items pantry du screenshot
// (milk, butter, tomato, egg) + 1 slot search déjà rempli pour rendre
// la scène plus représentative qu'un état vide.
// ----------------------------------------------------------------------------
const PANTRY = [
  { id: '1', name: 'Milk', qty: '1L', emoji: '🥛' },
  { id: '2', name: 'Butter', qty: '250g', emoji: '🧈' },
  { id: '3', name: 'Tomato', qty: '4', emoji: '🍅' },
  { id: '4', name: 'Egg', qty: '6', emoji: '🥚' },
  { id: '5', name: 'Garlic', qty: '1', emoji: '🧄' },
  { id: '6', name: 'Onion', qty: '2', emoji: '🧅' },
];

const FILLED_SLOT = { name: 'Basil', emoji: '🌿' };

// ----------------------------------------------------------------------------
// TestScreen — host + variant switcher
// ----------------------------------------------------------------------------
export default function TestScreen({ navigation }) {
  const css = useTheme();
  const [variant, setVariant] = useState('A');

  return (
    <View style={[styles.root, { backgroundColor: css.palette.surface }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: css.palette.neutral200 || '#e5e7eb' },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
        >
          <FontAwesome name="angle-left" size={28} color={css.palette.neutral900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: css.palette.neutral900 }]}>
          Kickoff redesigns
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <VariantSwitcher value={variant} onChange={setVariant} />

      <View style={styles.stage}>
        {variant === 'A' && <VariantA />}
        {variant === 'B' && <VariantB />}
        {variant === 'C' && <VariantC />}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// Variant switcher — segmented control au-dessus du stage
// ----------------------------------------------------------------------------
function VariantSwitcher({ value, onChange }) {
  const css = useTheme();
  const items = [
    { key: 'A', label: 'A · Pantry-first' },
    { key: 'B', label: 'B · Tabs' },
    { key: 'C', label: 'C · Stepper' },
  ];

  return (
    <View
      style={[
        switcherStyles.wrap,
        { backgroundColor: css.palette.neutral100 || '#f1f5f9' },
      ]}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={[
              switcherStyles.tab,
              active && {
                backgroundColor: css.palette.primary800,
                ...css.shadow.sm,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Variant ${it.key}`}
          >
            <Text
              style={[
                switcherStyles.tabText,
                {
                  color: active ? css.palette.white : css.palette.neutral700,
                  fontFamily: css.typography.fontUI,
                },
              ]}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const switcherStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
    borderRadius: 99,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ============================================================================
// VARIANT A — "Pantry-first"
// ----------------------------------------------------------------------------
// Pattern : la pantry devient la zone principale (grid en haut, plein
// largeur). La camera est réduite à une carte compacte 16:9 sous la
// grille, et les slots remplis s'affichent en chips horizontaux inline
// avec un CTA "Cook" sticky.
// Trade-off : sacrifie l'immersion camera (moins d'effet "wow") au
// profit d'une hiérarchie claire — l'utilisateur loggué a déjà sa
// pantry, donc on lui montre d'abord ce qu'il possède.
// ============================================================================
function VariantA() {
  const css = useTheme();
  const cols = Dimensions.get('window').width < 380 ? 3 : 4;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header section — la pantry est the hero */}
      <View style={vA.header}>
        <Text
          style={[
            vA.kicker,
            {
              color: css.palette.primary800,
              fontFamily: css.typography.fontUI,
            },
          ]}
        >
          YOUR PANTRY · {PANTRY.length} ITEMS
        </Text>
        <Text
          style={[
            vA.title,
            {
              color: css.palette.neutral900,
              fontFamily: css.typography.fontHeading,
              fontSize: css.typography.h2Size,
            },
          ]}
        >
          Tap to cook with what you have
        </Text>
      </View>

      {/* Pantry grid — surface principale */}
      <PantryGridMock cols={cols} />

      {/* Inline selection chips */}
      <SelectionChips />

      {/* Camera card compacte */}
      <Text
        style={[
          vA.sectionLabel,
          {
            color: css.palette.neutral700,
            fontFamily: css.typography.fontUI,
          },
        ]}
      >
        Or scan something new
      </Text>
      <View style={[vA.cameraCard, { ...css.shadow.md }]}>
        <View style={[vA.cameraInner, { backgroundColor: css.palette.black }]}>
          <FontAwesome name="camera" size={32} color={css.palette.white} />
          <Text
            style={[
              vA.cameraHint,
              { color: css.palette.white, fontFamily: css.typography.fontUI },
            ]}
          >
            Tap to open camera
          </Text>
        </View>
        <TouchableOpacity
          style={[vA.searchPill, { backgroundColor: css.palette.surfaceCard }]}
          accessibilityRole="button"
          accessibilityLabel="Search ingredients"
        >
          <FontAwesome name="search" size={14} color={css.palette.neutral700} />
          <Text style={[vA.searchText, { color: css.palette.neutral700 }]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sticky CTA simulé en bas de scroll */}
      <View style={[vA.cta, { backgroundColor: css.palette.primary800, ...css.shadow.heavy }]}>
        <Text style={[vA.ctaText, { color: css.palette.white, fontFamily: css.typography.fontHeading }]}>
          Find recipes
        </Text>
        <View style={vA.ctaBadge}>
          <Text style={[vA.ctaBadgeText, { color: css.palette.primary800 }]}>3</Text>
        </View>
        <FontAwesome name="angle-double-right" size={22} color={css.palette.white} />
      </View>
    </ScrollView>
  );
}

const vA = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  title: { fontWeight: '700', lineHeight: 30 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cameraCard: {
    marginHorizontal: 16,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cameraInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cameraHint: { fontSize: 12, fontWeight: '500' },
  searchPill: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  searchText: { fontSize: 13, fontWeight: '600' },
  cta: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 60,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  ctaText: { fontSize: 16, fontWeight: '700' },
  ctaBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 99,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBadgeText: { fontSize: 13, fontWeight: '700' },
});

// ============================================================================
// VARIANT B — "Tabs / Camera + Pantry"
// ----------------------------------------------------------------------------
// Pattern : segments "Pantry / Camera" — une source à la fois.
// Camera plein écran (immersif) quand Camera est actif. Pantry grid en
// liste verticale quand Pantry est actif. Le compteur "X selected"
// reste en bottom bar, partagé entre les deux modes.
// Trade-off : nécessite un tap supplémentaire pour passer d'une source
// à l'autre, mais élimine totalement la confusion entre les deux
// "sources d'ingrédients" du screenshot actuel.
// ============================================================================
function VariantB() {
  const css = useTheme();
  const [mode, setMode] = useState('pantry');
  const cols = Dimensions.get('window').width < 380 ? 3 : 4;

  return (
    <View style={{ flex: 1 }}>
      {/* Source picker — gros segments cliquables */}
      <View style={[vB.segments, { backgroundColor: css.palette.neutral100 || '#f1f5f9' }]}>
        <Pressable
          onPress={() => setMode('pantry')}
          style={[
            vB.segment,
            mode === 'pantry' && {
              backgroundColor: css.palette.surfaceCard,
              ...css.shadow.sm,
            },
          ]}
        >
          <FontAwesome
            name="archive"
            size={16}
            color={mode === 'pantry' ? css.palette.primary800 : css.palette.neutral700}
          />
          <Text
            style={[
              vB.segmentLabel,
              {
                color: mode === 'pantry' ? css.palette.primary800 : css.palette.neutral700,
                fontFamily: css.typography.fontUI,
              },
            ]}
          >
            Pantry · {PANTRY.length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('camera')}
          style={[
            vB.segment,
            mode === 'camera' && {
              backgroundColor: css.palette.surfaceCard,
              ...css.shadow.sm,
            },
          ]}
        >
          <FontAwesome
            name="camera"
            size={16}
            color={mode === 'camera' ? css.palette.primary800 : css.palette.neutral700}
          />
          <Text
            style={[
              vB.segmentLabel,
              {
                color: mode === 'camera' ? css.palette.primary800 : css.palette.neutral700,
                fontFamily: css.typography.fontUI,
              },
            ]}
          >
            Scan new
          </Text>
        </Pressable>
      </View>

      {/* Body — switch sur mode */}
      {mode === 'pantry' ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <PantryGridMock cols={cols} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
          <View
            style={[
              vB.camera,
              { backgroundColor: css.palette.black, ...css.shadow.heavy },
            ]}
          >
            <FontAwesome name="camera-retro" size={56} color="rgba(255,255,255, 0.4)" />
            <Text style={[vB.cameraText, { color: 'rgba(255,255,255, 0.7)' }]}>
              Camera preview
            </Text>
            {/* Snap shutter inside camera */}
            <View style={vB.shutterWrap}>
              <View style={[vB.shutterRing, { borderColor: css.palette.white }]}>
                <View
                  style={[vB.shutterInner, { backgroundColor: css.palette.white }]}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Bottom bar partagé — sélection + CTA */}
      <View
        style={[
          vB.bottomBar,
          {
            backgroundColor: css.palette.surfaceCard,
            borderTopColor: css.palette.neutral200 || '#e5e7eb',
            ...css.shadow.lg,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              vB.bottomLabel,
              { color: css.palette.neutral700, fontFamily: css.typography.fontUI },
            ]}
          >
            Selected
          </Text>
          <Text
            style={[
              vB.bottomCount,
              { color: css.palette.neutral900, fontFamily: css.typography.fontHeading },
            ]}
          >
            3 ingredients
          </Text>
        </View>
        <View style={[vB.bottomCta, { backgroundColor: css.palette.primary800 }]}>
          <Text style={[vB.bottomCtaText, { color: css.palette.white }]}>Cook</Text>
          <FontAwesome name="angle-double-right" size={20} color={css.palette.white} />
        </View>
      </View>
    </View>
  );
}

const vB = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 99,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 99,
  },
  segmentLabel: { fontSize: 13, fontWeight: '700' },
  camera: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cameraText: { fontSize: 13, fontWeight: '500' },
  shutterWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  bottomCount: { fontSize: 16, fontWeight: '700' },
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 99,
  },
  bottomCtaText: { fontSize: 15, fontWeight: '700' },
});

// ============================================================================
// VARIANT C — "Stepper / Drawer overlay"
// ----------------------------------------------------------------------------
// Pattern : camera plein écran (immersion totale), pantry exposée
// comme un drawer "peek" en bas qui se déploie. Indicateur de progrès
// "1 → 2 → 3" en haut pour rythmer le parcours.
// Trade-off : la pantry n'est plus visible d'emblée (peek limité à 90pt)
// — l'utilisateur doit l'expanser. Plus immersif mais demande un geste
// d'apprentissage (drag handle).
// ============================================================================
function VariantC() {
  const css = useTheme();
  const cols = Dimensions.get('window').width < 380 ? 3 : 4;

  return (
    <View style={{ flex: 1 }}>
      {/* Stepper */}
      <View style={vC.stepper}>
        <Step n={1} label="Pantry" active css={css} />
        <View style={[vC.stepDash, { backgroundColor: css.palette.neutral200 || '#e5e7eb' }]} />
        <Step n={2} label="Scan" css={css} />
        <View style={[vC.stepDash, { backgroundColor: css.palette.neutral200 || '#e5e7eb' }]} />
        <Step n={3} label="Cook" css={css} />
      </View>

      {/* Camera as background */}
      <View style={[vC.camera, { backgroundColor: css.palette.black }]}>
        <FontAwesome name="camera-retro" size={72} color="rgba(255,255,255, 0.25)" />
        <View style={vC.cameraControls}>
          <Pressable style={vC.camIconBtn}>
            <FontAwesome name="rotate-right" size={20} color={css.palette.white} />
          </Pressable>
          <Pressable style={vC.camIconBtn}>
            <FontAwesome name="flash" size={20} color={css.palette.white} />
          </Pressable>
        </View>

        {/* Snap shutter */}
        <View style={vC.shutterWrap}>
          <Pressable style={[vC.shutter, { borderColor: css.palette.white }]}>
            <View style={[vC.shutterCore, { backgroundColor: css.palette.white }]} />
          </Pressable>
        </View>
      </View>

      {/* Pantry drawer peek */}
      <View
        style={[
          vC.drawer,
          {
            backgroundColor: css.palette.surfaceCard,
            ...css.shadow.heavy,
          },
        ]}
      >
        <View style={[vC.handle, { backgroundColor: css.palette.neutral300 || '#d1d5db' }]} />
        <View style={vC.drawerHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                vC.drawerKicker,
                { color: css.palette.primary800, fontFamily: css.typography.fontUI },
              ]}
            >
              YOUR PANTRY
            </Text>
            <Text
              style={[
                vC.drawerTitle,
                { color: css.palette.neutral900, fontFamily: css.typography.fontHeading },
              ]}
            >
              {PANTRY.length} items ready
            </Text>
          </View>
          <View style={[vC.cookFab, { backgroundColor: css.palette.primary800, ...css.shadow.md }]}>
            <Text style={[vC.cookFabCount, { color: css.palette.white }]}>3</Text>
            <FontAwesome name="angle-double-right" size={18} color={css.palette.white} />
          </View>
        </View>

        {/* Pantry chips horizontal scroll — preview du contenu du drawer */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {PANTRY.map((item, idx) => {
            const selected = idx < 3;
            return (
              <View
                key={item.id}
                style={[
                  vC.chip,
                  {
                    backgroundColor: selected
                      ? css.palette.primary800
                      : css.palette.neutral100 || '#f1f5f9',
                    borderColor: selected
                      ? css.palette.primary800
                      : css.palette.neutral200 || '#e5e7eb',
                  },
                ]}
              >
                <Text style={vC.chipEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    vC.chipLabel,
                    {
                      color: selected ? css.palette.white : css.palette.neutral900,
                      fontFamily: css.typography.fontUI,
                    },
                  ]}
                >
                  {item.name}
                </Text>
                {selected && (
                  <FontAwesome name="check-circle" size={14} color={css.palette.white} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function Step({ n, label, active, css }) {
  return (
    <View style={vC.step}>
      <View
        style={[
          vC.stepDot,
          {
            backgroundColor: active ? css.palette.primary800 : 'transparent',
            borderColor: active ? css.palette.primary800 : css.palette.neutral300 || '#d1d5db',
          },
        ]}
      >
        <Text
          style={[
            vC.stepDotText,
            { color: active ? css.palette.white : css.palette.neutral700 },
          ]}
        >
          {n}
        </Text>
      </View>
      <Text
        style={[
          vC.stepLabel,
          {
            color: active ? css.palette.neutral900 : css.palette.neutral700,
            fontFamily: css.typography.fontUI,
            fontWeight: active ? '700' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const vC = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 12 },
  stepDash: { flex: 1, height: 1 },
  camera: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 220,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  camIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: { width: 56, height: 56, borderRadius: 28 },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  drawerKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  drawerTitle: { fontSize: 18, fontWeight: '700' },
  cookFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 99,
  },
  cookFabCount: { fontSize: 14, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
});

// ============================================================================
// Shared mocks — pantry grid + selection chips
// ============================================================================
function PantryGridMock({ cols }) {
  const css = useTheme();

  return (
    <View style={gridStyles.grid}>
      {PANTRY.map((item, idx) => {
        const selected = idx < 3;
        const cellWidth = `${100 / cols - 2}%`;
        return (
          <View
            key={item.id}
            style={[
              gridStyles.cell,
              {
                width: cellWidth,
                backgroundColor: selected
                  ? css.palette.primary500 || css.palette.primary800
                  : css.palette.surfaceCard,
                borderColor: selected
                  ? css.palette.primary800
                  : css.palette.neutral200 || '#e5e7eb',
                ...css.shadow.sm,
              },
            ]}
          >
            <View
              style={[
                gridStyles.img,
                {
                  backgroundColor: selected
                    ? 'rgba(255,255,255,0.18)'
                    : (css.palette.secondary200 || '#e6f4ea'),
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                gridStyles.name,
                {
                  color: selected ? css.palette.white : css.palette.neutral900,
                  fontFamily: css.typography.fontUI,
                },
              ]}
            >
              {item.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                gridStyles.qty,
                {
                  color: selected ? 'rgba(255,255,255,0.8)' : css.palette.neutral700,
                  fontFamily: css.typography.fontBody,
                },
              ]}
            >
              {item.qty}
            </Text>
            {selected && (
              <View style={[gridStyles.check, { backgroundColor: css.palette.primary800 }]}>
                <FontAwesome name="check" size={10} color="white" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: '1%',
  },
  cell: {
    padding: 8,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  img: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  qty: { fontSize: 11 },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function SelectionChips() {
  const css = useTheme();
  // 3 mock items pour matérialiser "ce que tu as déjà sélectionné"
  const items = [
    { emoji: '🥛', name: 'Milk' },
    { emoji: '🧈', name: 'Butter' },
    { emoji: FILLED_SLOT.emoji, name: FILLED_SLOT.name },
  ];

  return (
    <View style={chipsStyles.wrap}>
      <Text
        style={[
          chipsStyles.label,
          { color: css.palette.neutral700, fontFamily: css.typography.fontUI },
        ]}
      >
        SELECTED · {items.length}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {items.map((it, i) => (
          <View
            key={i}
            style={[
              chipsStyles.chip,
              {
                backgroundColor: css.palette.primary800,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{it.emoji}</Text>
            <Text style={[chipsStyles.chipText, { color: css.palette.white }]}>
              {it.name}
            </Text>
            <FontAwesome name="times-circle" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        ))}
        <View
          style={[
            chipsStyles.chip,
            {
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: css.palette.neutral300 || '#d1d5db',
            },
          ]}
        >
          <FontAwesome name="plus" size={12} color={css.palette.neutral700} />
          <Text style={[chipsStyles.chipText, { color: css.palette.neutral700 }]}>
            Add
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const chipsStyles = StyleSheet.create({
  wrap: { marginTop: 12, marginBottom: 8 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});

// ============================================================================
// Root styles
// ============================================================================
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSpacer: { width: 28 },
  stage: { flex: 1 },
});
