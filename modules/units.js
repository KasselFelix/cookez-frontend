// Unit formatting utility for ingredient quantities.
//
// Two distinct surfaces, two distinct functions :
//   - formatQuantity(q, u, defaultUnit?)   → display sur RecipeScreen / ShoppingList
//   - formatQuantityForAmazon(q, u)        → URL Amazon search (toujours
//                                             métrique, toujours ceil, drop
//                                             micro-quantités)
//
// Les deux retournent { value: string, unit: string } pour que les appelants
// puissent rendre `${value}${unit}` ou bâtir une query string sans refaire
// d'opérations numériques.
//
// SINGLE SOURCE OF TRUTH pour les facteurs de conversion : `convertToBaseUnit`
// dans `modules/unitConversion.js` (port 1:1 du backend). Ici on garde juste
// un mini-mapping NON_METRIC_BASE_UNIT qui dit, par alias d'unité, si c'est
// une masse (g) ou un volume (ml) — info nécessaire pour l'output uniquement.

import { convertToBaseUnit } from './unitConversion';

const METRIC_MASS = new Set(['g', 'gram', 'grams', 'gramme', 'grammes']);
const METRIC_VOLUME = new Set(['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres']);
const PURE_COUNT = new Set(['unit', 'units', 'unite', 'piece', 'pieces', 'entier']);

// Mini-map : alias non-métrique → base unit (output après conversion).
// Aligné EXACTEMENT avec les cases du switch backend `convertToBaseUnit`
// (cookez-backend/routes/recipes.js lignes 76-126). Les noms ici sont
// déjà accent-stripped (cf. normalizeUnit qui supprime les accents via NFD).
const NON_METRIC_BASE_UNIT = {
  // Cuillères → ml
  tbsp:                 'ml',
  tablespoon:           'ml',
  cs:                   'ml',
  'cuillere a soupe':   'ml',
  tsp:                  'ml',
  teaspoon:             'ml',
  cc:                   'ml',
  'cuillere a cafe':    'ml',
  'c.a.c':              'ml',
  // Contenants → ml
  cup:                  'ml',
  tasse:                'ml',
  glass:                'ml',
  verre:                'ml',
  bowl:                 'ml',
  bol:                  'ml',
  // Petites quantités
  pinch:                'g',
  pincee:               'g',
  drop:                 'ml',
  goutte:               'ml',
  // Anglo-saxonnes → g
  oz:                   'g',
  ounce:                'g',
  once:                 'g',
  lb:                   'g',
  pound:                'g',
  livre:                'g',
};

// Lowercase + trim + strip accents (NFD). Mirror exact du backend pour
// que 'pincée' / 'pincee' / 'PINCÉE' matchent la même entrée.
function normalizeUnit(unit) {
  if (!unit) return '';
  return String(unit).toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// 2 décimales max, trim des zéros trailing : 1 → "1", 1.5 → "1.5", 1.50 → "1.5"
function round2(value) {
  const r = Math.round(value * 100) / 100;
  return String(r);
}

// Ceil à 1 décimale : 1.05 → "1.1", 1 → "1"
function ceil1(value) {
  const c = Math.ceil(value * 10) / 10;
  return String(c);
}

// Helper interne pour les unités métriques : applique seuil 1000 et formatage.
// g/ml sous le seuil → entier (Math.floor pour ne pas dépasser la quantité
// nominale), avec plancher à 1 pour éviter "0g salt" quand la quantité
// nominale × ratio de scaling < 1 (ex : 2g × 0.25 = 0.5 → "1g"). Garanti par
// l'early return q ≤ 0 dans formatQuantity : tout flux arrivant ici a qBase > 0.
// kg/L après conversion → 2 décimales max.
function formatMetric(qBase, baseUnit) {
  const isMass = METRIC_MASS.has(baseUnit) || baseUnit === 'g';
  const isVolume = METRIC_VOLUME.has(baseUnit) || baseUnit === 'ml';

  if (isMass && qBase >= 1000) {
    return { value: round2(qBase / 1000), unit: 'kg' };
  }
  if (isVolume && qBase >= 1000) {
    return { value: round2(qBase / 1000), unit: 'L' };
  }
  // g/ml sub-1000 → entier (pas de décimale), plancher à 1
  return { value: String(Math.max(1, Math.floor(qBase))), unit: isMass ? 'g' : 'ml' };
}

// DISPLAY format : préserve l'unité d'origine si possible, max 2 décimales,
// conversion vers métrique supérieur uniquement au seuil 1000.
//
// `defaultUnit` (optionnel) — override la base unit utilisée lors de la
// conversion non-métrique → métrique. Ex. : `formatQuantity(9, 'tsp')`
// donne `45ml` (NON_METRIC_BASE_UNIT.tsp = 'ml') par défaut, mais
// `formatQuantity(9, 'tsp', 'g')` donne `45g` (pour les ingrédients
// solides dont `defaultUnit = 'g'` comme la farine).
export function formatQuantity(quantity, unit, defaultUnit = null) {
  const q = Number(quantity);
  const u = normalizeUnit(unit);

  if (!Number.isFinite(q) || q <= 0) {
    return { value: '0', unit: unit || 'g' };
  }

  // 1. Pure-count : drop unit (artefact code sans valeur lisible)
  if (PURE_COUNT.has(u)) {
    return { value: String(Math.ceil(q)), unit: '' };
  }

  // 2. Convertible non-métrique : convertir vers base si ≥ 9
  if (NON_METRIC_BASE_UNIT[u]) {
    if (q < 9) {
      return { value: String(Math.ceil(q)), unit: unit };
    }
    const qMetric = convertToBaseUnit(q, u, 1);
    const baseUnit = (defaultUnit === 'g' || defaultUnit === 'ml')
      ? defaultUnit
      : NON_METRIC_BASE_UNIT[u];
    return formatMetric(qMetric, baseUnit);
  }

  // 3 + 4 + 5. Métriques natives
  if (METRIC_MASS.has(u) || METRIC_VOLUME.has(u)) {
    return formatMetric(q, u);
  }

  // 6. Fallback unit inconnue : ceil + unité brute (pas de conversion)
  return { value: String(Math.ceil(q)), unit: unit || 'g' };
}

// AMAZON URL format : toujours métrique, toujours ceil, drop micro-quantités.
export function formatQuantityForAmazon(quantity, unit) {
  const q = Number(quantity);
  const u = normalizeUnit(unit);

  if (!Number.isFinite(q) || q <= 0) {
    return { value: '', unit: '' };
  }

  // 1. Pure-count : drop unit, garde le count
  if (PURE_COUNT.has(u)) {
    return { value: String(Math.ceil(q)), unit: '' };
  }

  // 2. Convertible : convertir vers base immédiatement
  let qMetric = q;
  let baseUnit;
  if (NON_METRIC_BASE_UNIT[u]) {
    qMetric = convertToBaseUnit(q, u, 1);
    baseUnit = NON_METRIC_BASE_UNIT[u];
  } else if (METRIC_MASS.has(u)) {
    baseUnit = 'g';
  } else if (METRIC_VOLUME.has(u)) {
    baseUnit = 'ml';
  } else {
    // Unit inconnue : ceil + brut
    return { value: String(Math.ceil(q)), unit: unit || 'g' };
  }

  // 3. Métrique : ceil + drop micro + bascule kg/L
  const m = Math.ceil(qMetric);

  if (m < 5) {
    return { value: '', unit: '' };
  }
  if (baseUnit === 'g' && m >= 1000) {
    return { value: ceil1(m / 1000), unit: 'kg' };
  }
  if (baseUnit === 'ml' && m >= 1000) {
    return { value: ceil1(m / 1000), unit: 'L' };
  }
  return { value: String(m), unit: baseUnit };
}
