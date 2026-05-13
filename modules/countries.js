// ISO 3166-1 alpha-2 country list with English + French display names.
// `name` is the canonical English form — also used as the persisted value
// in Recipe.origin (BDD source of truth), so consistency matters.
// `nameFr` is shown in the UI when the active locale is `fr`.
//
// Flag emoji is derived from the ISO code via Unicode regional-indicator
// codepoints — works on iOS out of the box; Android falls back to text.

export function flagEmoji(code) {
  if (typeof code !== 'string' || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

// Canonical list. English `name` is the value stored in BDD.
// Subset: a few of the top cuisines + most-populated countries. Easy to
// extend later — adding here is enough for the picker to surface them.
export const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', nameFr: 'Afghanistan' },
  { code: 'AL', name: 'Albania', nameFr: 'Albanie' },
  { code: 'DZ', name: 'Algeria', nameFr: 'Algérie' },
  { code: 'AR', name: 'Argentina', nameFr: 'Argentine' },
  { code: 'AM', name: 'Armenia', nameFr: 'Arménie' },
  { code: 'AU', name: 'Australia', nameFr: 'Australie' },
  { code: 'AT', name: 'Austria', nameFr: 'Autriche' },
  { code: 'BD', name: 'Bangladesh', nameFr: 'Bangladesh' },
  { code: 'BE', name: 'Belgium', nameFr: 'Belgique' },
  { code: 'BR', name: 'Brazil', nameFr: 'Brésil' },
  { code: 'BG', name: 'Bulgaria', nameFr: 'Bulgarie' },
  { code: 'KH', name: 'Cambodia', nameFr: 'Cambodge' },
  { code: 'CM', name: 'Cameroon', nameFr: 'Cameroun' },
  { code: 'CA', name: 'Canada', nameFr: 'Canada' },
  { code: 'CL', name: 'Chile', nameFr: 'Chili' },
  { code: 'CN', name: 'China', nameFr: 'Chine' },
  { code: 'CO', name: 'Colombia', nameFr: 'Colombie' },
  { code: 'CR', name: 'Costa Rica', nameFr: 'Costa Rica' },
  { code: 'HR', name: 'Croatia', nameFr: 'Croatie' },
  { code: 'CU', name: 'Cuba', nameFr: 'Cuba' },
  { code: 'CZ', name: 'Czechia', nameFr: 'Tchéquie' },
  { code: 'DK', name: 'Denmark', nameFr: 'Danemark' },
  { code: 'DO', name: 'Dominican Republic', nameFr: 'République dominicaine' },
  { code: 'EC', name: 'Ecuador', nameFr: 'Équateur' },
  { code: 'EG', name: 'Egypt', nameFr: 'Égypte' },
  { code: 'EE', name: 'Estonia', nameFr: 'Estonie' },
  { code: 'ET', name: 'Ethiopia', nameFr: 'Éthiopie' },
  { code: 'FI', name: 'Finland', nameFr: 'Finlande' },
  { code: 'FR', name: 'France', nameFr: 'France' },
  { code: 'GE', name: 'Georgia', nameFr: 'Géorgie' },
  { code: 'DE', name: 'Germany', nameFr: 'Allemagne' },
  { code: 'GH', name: 'Ghana', nameFr: 'Ghana' },
  { code: 'GR', name: 'Greece', nameFr: 'Grèce' },
  { code: 'HU', name: 'Hungary', nameFr: 'Hongrie' },
  { code: 'IS', name: 'Iceland', nameFr: 'Islande' },
  { code: 'IN', name: 'India', nameFr: 'Inde' },
  { code: 'ID', name: 'Indonesia', nameFr: 'Indonésie' },
  { code: 'IR', name: 'Iran', nameFr: 'Iran' },
  { code: 'IQ', name: 'Iraq', nameFr: 'Irak' },
  { code: 'IE', name: 'Ireland', nameFr: 'Irlande' },
  { code: 'IL', name: 'Israel', nameFr: 'Israël' },
  { code: 'IT', name: 'Italy', nameFr: 'Italie' },
  { code: 'CI', name: 'Ivory Coast', nameFr: 'Côte d’Ivoire' },
  { code: 'JM', name: 'Jamaica', nameFr: 'Jamaïque' },
  { code: 'JP', name: 'Japan', nameFr: 'Japon' },
  { code: 'JO', name: 'Jordan', nameFr: 'Jordanie' },
  { code: 'KZ', name: 'Kazakhstan', nameFr: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya', nameFr: 'Kenya' },
  { code: 'KR', name: 'South Korea', nameFr: 'Corée du Sud' },
  { code: 'KP', name: 'North Korea', nameFr: 'Corée du Nord' },
  { code: 'KW', name: 'Kuwait', nameFr: 'Koweït' },
  { code: 'LB', name: 'Lebanon', nameFr: 'Liban' },
  { code: 'LY', name: 'Libya', nameFr: 'Libye' },
  { code: 'LT', name: 'Lithuania', nameFr: 'Lituanie' },
  { code: 'MG', name: 'Madagascar', nameFr: 'Madagascar' },
  { code: 'MY', name: 'Malaysia', nameFr: 'Malaisie' },
  { code: 'ML', name: 'Mali', nameFr: 'Mali' },
  { code: 'MX', name: 'Mexico', nameFr: 'Mexique' },
  { code: 'MA', name: 'Morocco', nameFr: 'Maroc' },
  { code: 'NL', name: 'Netherlands', nameFr: 'Pays-Bas' },
  { code: 'NZ', name: 'New Zealand', nameFr: 'Nouvelle-Zélande' },
  { code: 'NG', name: 'Nigeria', nameFr: 'Nigeria' },
  { code: 'NO', name: 'Norway', nameFr: 'Norvège' },
  { code: 'PK', name: 'Pakistan', nameFr: 'Pakistan' },
  { code: 'PA', name: 'Panama', nameFr: 'Panama' },
  { code: 'PE', name: 'Peru', nameFr: 'Pérou' },
  { code: 'PH', name: 'Philippines', nameFr: 'Philippines' },
  { code: 'PL', name: 'Poland', nameFr: 'Pologne' },
  { code: 'PT', name: 'Portugal', nameFr: 'Portugal' },
  { code: 'RO', name: 'Romania', nameFr: 'Roumanie' },
  { code: 'RU', name: 'Russia', nameFr: 'Russie' },
  { code: 'SA', name: 'Saudi Arabia', nameFr: 'Arabie saoudite' },
  { code: 'SN', name: 'Senegal', nameFr: 'Sénégal' },
  { code: 'RS', name: 'Serbia', nameFr: 'Serbie' },
  { code: 'SG', name: 'Singapore', nameFr: 'Singapour' },
  { code: 'SK', name: 'Slovakia', nameFr: 'Slovaquie' },
  { code: 'SI', name: 'Slovenia', nameFr: 'Slovénie' },
  { code: 'ZA', name: 'South Africa', nameFr: 'Afrique du Sud' },
  { code: 'ES', name: 'Spain', nameFr: 'Espagne' },
  { code: 'LK', name: 'Sri Lanka', nameFr: 'Sri Lanka' },
  { code: 'SE', name: 'Sweden', nameFr: 'Suède' },
  { code: 'CH', name: 'Switzerland', nameFr: 'Suisse' },
  { code: 'SY', name: 'Syria', nameFr: 'Syrie' },
  { code: 'TW', name: 'Taiwan', nameFr: 'Taïwan' },
  { code: 'TZ', name: 'Tanzania', nameFr: 'Tanzanie' },
  { code: 'TH', name: 'Thailand', nameFr: 'Thaïlande' },
  { code: 'TN', name: 'Tunisia', nameFr: 'Tunisie' },
  { code: 'TR', name: 'Turkey', nameFr: 'Turquie' },
  { code: 'UA', name: 'Ukraine', nameFr: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates', nameFr: 'Émirats arabes unis' },
  { code: 'GB', name: 'United Kingdom', nameFr: 'Royaume-Uni' },
  { code: 'US', name: 'United States', nameFr: 'États-Unis' },
  { code: 'UY', name: 'Uruguay', nameFr: 'Uruguay' },
  { code: 'VE', name: 'Venezuela', nameFr: 'Venezuela' },
  { code: 'VN', name: 'Vietnam', nameFr: 'Vietnam' },
  { code: 'YE', name: 'Yemen', nameFr: 'Yémen' },
];

// Map `Recipe.origin` value (e.g. "France") back to its country descriptor.
// Falls back to `{ code: null, name: value, nameFr: value }` so the picker
// can still render unknown origins safely.
const COUNTRIES_BY_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

export function countryByName(name) {
  if (typeof name !== 'string') return null;
  return COUNTRIES_BY_NAME.get(name.toLowerCase()) || null;
}

export function flagForOriginName(name) {
  const c = countryByName(name);
  return c?.code ? flagEmoji(c.code) : '🌍';
}

// Resolve a localized display name for a stored origin value.
// `locale` is the i18n.locale from useT (e.g. 'fr' or 'en').
export function localizedCountryName(originValue, locale) {
  const c = countryByName(originValue);
  if (!c) return originValue;
  return locale && locale.startsWith('fr') ? c.nameFr : c.name;
}
