// Plan 006 B4: the server-error fallback needs result.error.* in BOTH locales.
import en from '../../i18n/translations/en.json';
import fr from '../../i18n/translations/fr.json';

describe('i18n result.error keys (Plan 006)', () => {
  for (const [lang, dict] of [['en', en], ['fr', fr]]) {
    it(`${lang}.json defines result.error.{title,body,retry}`, () => {
      expect(dict.result.error).toBeDefined();
      expect(typeof dict.result.error.title).toBe('string');
      expect(typeof dict.result.error.body).toBe('string');
      expect(typeof dict.result.error.retry).toBe('string');
    });
  }
});
