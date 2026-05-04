// Light theme — re-exports the canonical token bundle from `Global.js`.
//
// We deliberately re-import rather than redefine: `Global.js` is the
// authoritative tokens file and 14 unmigrated screens still import it
// directly. This file exists so the ThemeProvider has a uniform shape
// to swap with the dark / pastel variants.

import css from '../Global';

const light = { ...css, key: 'light' };

export default light;
