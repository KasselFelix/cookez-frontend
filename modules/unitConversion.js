// Port frontend de la logique de conversion d'unités du backend.
// MIRROR de cookez-backend/routes/recipes.js lignes 22-142.
//
// IMPORTANT : toute modification ici DOIT être répercutée dans le backend
// (et inversement). La cohérence du calcul required/possessed dépend du
// switch identique des deux côtés. Si le backend ajoute une unité (ex.
// "litre", "gallon"), l'ajouter ici aussi.
//
// Pourquoi côté front : RecipeScreen recompute `shoppingList` client-side
// pour réagir au stepper local de servings sans re-fetch. La fonction
// `convertToBaseUnit` normalise les unités en g/ml/units pour pouvoir
// soustraire required - possessed.

// Ingrédients basiques exclus de la shopping list (rarement achetés à la
// demande, considérés comme toujours disponibles dans une cuisine).
export const BASIC_INGREDIENTS = ['salt', 'sugar', 'pepper', 'oil', 'water', 'flour'];

// Normalisation pour comparaison de noms (lowercase, drop modifiers, trim
// pluriels EN). Mirror exact du backend pour matcher BASIC_INGREDIENTS.
export const normalize = (str) => {
  if (!str) return '';
  return str.trim().toLowerCase()
    .replace(/\b(large|small|organic|clove|fresh|cloves|clove of)\b/gi, '')
    .replace(/es$/, '').replace(/([^e])s$/, '$1')
    .replace(/\s+/g, ' ').trim();
};

// Convertit n'importe quelle unité culinaire vers l'unité de base (g, ml,
// ou poids estimé pour 'unit'/'piece' via `referenceWeight`).
//
// @param {number} quantity
// @param {string} unit
// @param {number} referenceWeight - Poids/volume d'1 'unit' (ex. 60g pour 1 œuf)
// @returns {number} Quantité dans la base unit (g ou ml selon l'unité d'origine)
export const convertToBaseUnit = (quantity, unit, referenceWeight = 1) => {
  if (!unit) return quantity;

  // Lowercase + drop accents (é → e) pour matcher 'pincée' / 'pincee'.
  // [̀-ͯ] = combining diacritical marks (laissés après NFD)
  const u = unit.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  let r = Number(quantity) || 0;

  switch (u) {
    // --- MASSES ET VOLUMES STANDARDS ---
    case 'kg':
    case 'kilo':
    case 'l':
    case 'litre':
      r *= 1000;
      break;
    case 'dl':
    case 'decilitre':
      r *= 100;
      break;
    case 'cl':
    case 'centilitre':
      r *= 10;
      break;
    case 'mg':
      r /= 1000;
      break;

    // --- CUILLÈRES (MÉTRIQUE STANDARD) ---
    case 'tbsp':
    case 'tablespoon':
    case 'cs':
    case 'cuillere a soupe':
      r *= 15;
      break;
    case 'tsp':
    case 'teaspoon':
    case 'cc':
    case 'cuillere a cafe':
    case 'c.a.c':
      r *= 5;
      break;

    // --- CONTENANTS DOMESTIQUES ---
    case 'cup':
    case 'tasse':
      r *= 250;
      break;
    case 'glass':
    case 'verre':
      r *= 200;
      break;
    case 'bowl':
    case 'bol':
      r *= 400;
      break;

    // --- PETITES QUANTITÉS ---
    case 'pinch':
    case 'pincee':
      r *= 1;
      break;
    case 'drop':
    case 'goutte':
      r *= 0.05;
      break;

    // --- ANGLO-SAXONNES (APPROX) ---
    case 'oz':
    case 'ounce':
    case 'once':
      r *= 28.35;
      break;
    case 'lb':
    case 'pound':
    case 'livre':
      r *= 453.59;
      break;

    // --- UNITÉS ENTIÈRES (référence par ingrédient) ---
    case 'unit':
    case 'unite':
    case 'piece':
    case 'entier':
      r *= referenceWeight;
      break;

    default:
      // 'g', 'ml', ou unité inconnue → pas de transformation
      break;
  }

  return r;
};
