// NutritionPill — compact, tappable pill in RecipeScreen's meta row that
// surfaces calories *per serving* (convention universelle, cohérent
// avec le NutritionSheet qui affiche aussi par portion fixe).
//
// Visual : pill dorée avec halo extérieur + orbes floues qui flottent à
// l'intérieur (effet "lampe à lave" subtil). Signale le caractère
// interactif (ouvre la NutritionSheet au tap) sans être agressif.
//
// Architecture :
//   - Skia natif (Canvas + Shadow + RadialGradient + BlurMask Circle)
//   - 8 orbes animées via Reanimated 4 (withSequence + withRepeat)
//   - 100% theme-aware via `useTheme()` — toutes les couleurs viennent
//     de la rampe accent (accent200/300/400/500) du thème actif.
//
// Renvoie null quand `caloriesPerServing` est null pour ne jamais rendre
// un badge "0 kcal" qui mentirait sur les données.

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  RadialGradient,
  RoundedRect,
  Shadow,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';

// Pill dimensions match the other metaPills in RecipeScreen's metaRow.
// Canvas est plus grand pour laisser de la place au halo extérieur ;
// les marges négatives sur le Pressable replient l'excédent dans le
// layout (la layout box = pill size, le glow déborde visuellement).
const PILL_W = 90;
const PILL_H = 24;
const CANVAS_W = 130;
const CANVAS_H = 50;
const PILL_X = (CANVAS_W - PILL_W) / 2;
const PILL_Y = (CANVAS_H - PILL_H) / 2;
const PILL_R = PILL_H / 2;
const PILL_CLIP = rrect(rect(PILL_X, PILL_Y, PILL_W, PILL_H), PILL_R, PILL_R);

function withAlpha(hex, alpha) {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 8 orbes — keyframes 0% → 33% → 66% → loop back to 0%. Amplitudes larges
// en x (14-91, traverse toute la pill), centrées verticalement autour de
// y=24 (centre vertical). Durées asynchrones pour éviter la synchro.
// Positions/r/blur scalées depuis la version preview (140×40 → 90×24).
const ORBS = [
  { p: { x: [20, 65, 39], y: [19, 29, 24], d: 6500 }, r: 6, blur: 2, cat: 'warm2' },
  { p: { x: [78, 20, 59], y: [25, 22, 29], d: 7200 }, r: 7, blur: 3, cat: 'warm1' },
  { p: { x: [14, 71, 33], y: [22, 26, 19], d: 6800 }, r: 9, blur: 4, cat: 'coolA' },
  { p: { x: [91, 26, 65], y: [26, 19, 24], d: 7500 }, r: 7, blur: 4, cat: 'coolA' },
  { p: { x: [26, 84, 46], y: [24, 22, 29], d: 7000 }, r: 9, blur: 6, cat: 'coolB' },
  { p: { x: [59, 20, 78], y: [23, 26, 19], d: 7800 }, r: 7, blur: 4, cat: 'coolB' },
  { p: { x: [39, 84, 26], y: [20, 28, 24], d: 7300 }, r: 6, blur: 3, cat: 'warm1' },
  { p: { x: [71, 20, 46], y: [25, 22, 26], d: 7600 }, r: 6, blur: 2, cat: 'warm2' },
];

function useOrbCoords(path) {
  const cx = useSharedValue(path.x[0]);
  const cy = useSharedValue(path.y[0]);

  useEffect(() => {
    const seg = path.d / 3;
    const ease = Easing.linear;

    cx.value = withRepeat(
      withSequence(
        withTiming(path.x[1], { duration: seg, easing: ease }),
        withTiming(path.x[2], { duration: seg, easing: ease }),
        withTiming(path.x[0], { duration: seg, easing: ease }),
      ),
      -1,
      false
    );
    cy.value = withRepeat(
      withSequence(
        withTiming(path.y[1], { duration: seg, easing: ease }),
        withTiming(path.y[2], { duration: seg, easing: ease }),
        withTiming(path.y[0], { duration: seg, easing: ease }),
      ),
      -1,
      false
    );
  }, [cx, cy, path]);

  return { cx, cy };
}

function Orb({ orb, color }) {
  const { cx, cy } = useOrbCoords(orb.p);
  // Opacité uniforme — toutes les orbes sont dans la rampe accent (du
  // même thème), donc on n'a plus besoin du contraste warm/cool extrême
  // qui justifiait le différentiel d'alpha. Effet plus discret, juste
  // une texture lumineuse.
  return (
    <Circle cx={cx} cy={cy} r={orb.r} color={withAlpha(color, 0.55)}>
      <BlurMask blur={orb.blur} style="normal" />
    </Circle>
  );
}

export default function NutritionPill({ caloriesPerServing, onPress }) {
  const css = useTheme();
  const t = useT();

  if (caloriesPerServing == null) return null;
  const kcal = Math.round(caloriesPerServing);

  // 100% theme-aware — fond, glow et orbes utilisent uniquement la
  // rampe accent (accent200/300/400/500). Halo doré subtil, plus discret
  // que la version "UIverse full" (qui mixait bleu/magenta fixes).
  const colors = {
    glowNear: css.palette.accent500,
    glowFar: css.palette.accent400,
    radialInner: css.palette.accent200,
    radialOuter: css.palette.accent500,
    warm1: css.palette.accent500,
    warm2: css.palette.accent300,
    coolA: css.palette.accent400,
    coolB: css.palette.accent500,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('recipe.nutrition.openSheet')}
      hitSlop={8}
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Canvas style={[styles.canvas, { pointerEvents: 'none' }]}>
        <RoundedRect x={PILL_X} y={PILL_Y} width={PILL_W} height={PILL_H} r={PILL_R}>
          <Shadow dx={0} dy={0} blur={4}  color={withAlpha(colors.glowNear, 0.9)} />
          <Shadow dx={0} dy={0} blur={14} color={withAlpha(colors.glowFar, 0.4)} />
          <RadialGradient
            c={vec(CANVAS_W / 2, CANVAS_H / 2)}
            r={PILL_W * 0.55}
            colors={[colors.radialInner, colors.radialOuter]}
          />
        </RoundedRect>

        <Group clip={PILL_CLIP}>
          {ORBS.map((orb, i) => (
            <Orb key={i} orb={orb} color={colors[orb.cat]} />
          ))}
        </Group>

        <RoundedRect x={PILL_X} y={PILL_Y} width={PILL_W} height={PILL_H} r={PILL_R}>
          <LinearGradient
            start={vec(PILL_X, PILL_Y)}
            end={vec(PILL_X, PILL_Y + PILL_H)}
            colors={[
              'rgba(255, 250, 215, 0.45)',
              'rgba(255, 250, 215, 0)',
              'rgba(255, 223, 52, 0)',
              'rgba(255, 223, 52, 0.25)',
            ]}
            positions={[0, 0.3, 0.7, 1]}
          />
        </RoundedRect>
      </Canvas>

      <View style={styles.contentWrap} pointerEvents="none">
        <FontAwesome name="bolt" size={14} color="white" />
        <Text style={[styles.text, { fontFamily: css.typography.fontUI }]}>
          {t('recipe.nutrition.kcal', { count: kcal })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Le Pressable contribue PILL_W × PILL_H au layout flex (même taille
  // visible que les autres metaPills) — PAS de marges négatives, sinon
  // elles rétractent l'espace flex voisin et provoquent un overlap des
  // *pills* adjacentes (≠ overlap du *halo*).
  //
  // Le canvas Skia est en position absolute et déborde visuellement
  // par-dessus les voisins sans affecter le layout. Le halo rayonne
  // donc *au-dessus* des pills voisines (effet "lampe à lave" intentionnel)
  // mais ne pousse plus leur position.
  pressable: {
    width: PILL_W,
    height: PILL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'absolute',
    width: CANVAS_W,
    height: CANVAS_H,
    // Décalage négatif pour recentrer le canvas autour du Pressable.
    // Le canvas dépasse de (CANVAS_W - PILL_W)/2 = 20px de chaque côté
    // horizontalement, et (CANVAS_H - PILL_H)/2 = 13px verticalement.
    // Le débordement est purement visuel (rendu Skia hors layout box).
    top: -(CANVAS_H - PILL_H) / 2,
    left: -(CANVAS_W - PILL_W) / 2,
  },
  contentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
