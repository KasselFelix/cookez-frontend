// Pastel Lavender — soft violet, distinct from the brand defaults.

import css from '../Global';

const palette = {
  ...css.palette,

  // Surfaces
  background:  '#d7ccfa',
  surface:     '#f3f0fa',
  surfaceCard: '#e8e4f3',

  primary800: '#7a6cae',
  primary700: '#8a7cbb',
  primary600: '#9b8dc4',
  primary500: '#9b8dc4',
};

const card = {
  ...css.card,
  bg: palette.surfaceCard,
};

const tabBar = {
  ...css.tabBar,
  backgroundColor: 'rgba(232,228,243,0.92)',
  activeTintColor: '#7a6cae',
};

const button = {
  ...css.button,
  primaryBg:          '#7a6cae',
  primaryBorderColor: '#7a6cae',
  accentBg:           '#fde3b0',
  accentText:         '#7a6cae',
  ghostText:          '#7a6cae',
  ghostBorderColor:   '#7a6cae',
};

const pastelLavender = {
  ...css,
  key: 'pastelLavender',
  palette,
  card,
  tabBar,
  button,
};

export default pastelLavender;
