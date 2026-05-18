// Build an Amazon search URL with an affiliate tag attached.
//
// Why parameterize on locale + amazonConfig?
//   - The user's `locale` slice already drives i18n; using the same
//     signal to choose amazon.fr vs amazon.com keeps "language" and
//     "marketplace" in lockstep (a French-speaking user lands on the
//     French store, where they can actually buy).
//   - `amazonConfig` is server-provided (Plan 003 Phase A returns it on
//     every /recipes/result response and we stash it in the appConfig
//     slice). Passing it in keeps this builder pure — the link still
//     resolves to a valid Amazon URL even if the tag is missing,
//     just without affiliate revenue.
//
// Defense-in-depth : on applique formatQuantityForAmazon ici (et non
// dans les appelants) pour garantir que toute URL Amazon — présente ou
// future — bénéficie automatiquement de la conversion métrique + ceil +
// drop des micro-quantités. Les appelants passent les valeurs brutes.
//
// `URLSearchParams` handles the encoding — important for ingredients
// containing spaces, accents, or special characters.

import { formatQuantityForAmazon } from './units';

export function buildAmazonUrl({
  ingredientName,
  quantity,
  unit,
  locale,
  amazonConfig,
}) {
  const isFR = locale === 'fr';
  const tld = isFR ? 'fr' : 'com';
  const tag = isFR ? amazonConfig?.tag_fr : amazonConfig?.tag_com;

  let qtyLabel = '';
  if (quantity != null && unit != null) {
    const { value, unit: u } = formatQuantityForAmazon(quantity, unit);
    qtyLabel = `${value}${u}`;
  }
  const q = `${ingredientName} ${qtyLabel}`.trim();
  const params = new URLSearchParams({ k: q });
  if (tag) params.set('tag', tag);
  return `https://amazon.${tld}/s?${params.toString()}`;
}
