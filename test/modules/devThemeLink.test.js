import { parseDevThemeUrl } from '../../modules/devThemeLink';

describe('parseDevThemeUrl', () => {
  it('returns the theme key of a dev theme link', () => {
    expect(parseDevThemeUrl('cookez-dev://dev/theme?name=dark')).toBe('dark');
    expect(parseDevThemeUrl('cookez-dev://dev/theme?name=pastelMint')).toBe('pastelMint');
    expect(parseDevThemeUrl('cookez-dev://dev/theme?x=1&name=light&y=2')).toBe('light');
  });

  it('rejects unknown themes, other schemes and other paths', () => {
    expect(parseDevThemeUrl('cookez-dev://dev/theme?name=neon')).toBeNull();
    expect(parseDevThemeUrl('cookez://dev/theme?name=dark')).toBeNull();
    expect(parseDevThemeUrl('cookez-dev://recipe/theme?name=dark')).toBeNull();
    expect(parseDevThemeUrl('cookez-dev://dev/theme?name=darkish')).toBeNull();
    expect(parseDevThemeUrl(null)).toBeNull();
    expect(parseDevThemeUrl(undefined)).toBeNull();
  });
});
