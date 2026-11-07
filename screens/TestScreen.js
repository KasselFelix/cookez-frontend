// Dev-only screen — playground for visualizing/iterating UI components.
// Shown first in the dev gallery (TEST button on HomeScreen).
//
// Current content (2026-11-07): the ResultScreen cards (proposal A, validated)
// with complete invented recipes — origin flag, time, difficulty, rating,
// seasonal leaf, owned share — on the result background of the active theme.
// Nothing calls the API.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeProvider';
import { ResultHero, ResultRow } from '../components/result/ResultCard';

const RECIPES = [
  { _id: 'r1', name: 'Ratatouille', origin: ['France'], picture: 'ratatouille', matchRatio: 100, missingIngredients: [], preparationTime: 45, difficulty: 2, votes: [{ note: 5 }, { note: 4 }, { note: 5 }], isSeasonal: true },
  { _id: 'r2', name: 'Quiche lorraine', origin: ['France'], picture: 'quiche_lorraine', matchRatio: 75, missingIngredients: [{ name: 'cream' }, { name: 'bacon' }], preparationTime: 50, difficulty: 3, votes: [{ note: 4 }] },
  { _id: 'r3', name: 'Salade niçoise', origin: ['Atlantis'], picture: 'salade_nicoise', matchRatio: 60, missingIngredients: [{ name: 'tuna' }], preparationTime: 20, difficulty: 1, votes: [], isSeasonal: true },
  { _id: 'r4', name: 'Recipe without a photo', origin: [], matchRatio: 40, missingIngredients: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] },
];

export default function TestScreen() {
  const css = useTheme();
  const [best, ...rest] = RECIPES;
  return (
    <View testID="test-screen" style={[styles.root, { backgroundColor: css.result.background, padding: css.spacing.md, gap: css.spacing.sm }]}>
      <View testID="sandbox-badges">
        <ResultHero recipe={best} onPress={() => {}} />
      </View>
      {rest.map((recipe) => (
        <ResultRow key={recipe._id} recipe={recipe} onPress={() => {}} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
});
