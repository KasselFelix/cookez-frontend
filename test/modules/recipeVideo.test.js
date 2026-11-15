// Unit tests for the recipe video resolver (Plan 005 U-A16).
//
// Imported recipes may carry a `videoUrl` (YouTube, Tasty mp4…) or null.
// `resolveVideoUrl` normalises the value to a trimmed non-empty string or null;
// `isYouTubeUrl` classifies the provider so the UI can label the affordance.

import { resolveVideoUrl, isYouTubeUrl } from '../../modules/recipeVideo';

describe('resolveVideoUrl', () => {
  it('returns a valid http(s) video URL untouched', () => {
    expect(resolveVideoUrl({ videoUrl: 'https://youtu.be/abc' })).toBe(
      'https://youtu.be/abc',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(resolveVideoUrl({ videoUrl: '  https://vid.tasty.co/x.mp4  ' })).toBe(
      'https://vid.tasty.co/x.mp4',
    );
  });

  it('returns null when videoUrl is null', () => {
    expect(resolveVideoUrl({ videoUrl: null })).toBeNull();
  });

  it('returns null when videoUrl is missing', () => {
    expect(resolveVideoUrl({})).toBeNull();
  });

  it('returns null for an empty or whitespace-only string', () => {
    expect(resolveVideoUrl({ videoUrl: '' })).toBeNull();
    expect(resolveVideoUrl({ videoUrl: '   ' })).toBeNull();
  });

  it('returns null for a non-http value (defensive — not a real URL)', () => {
    expect(resolveVideoUrl({ videoUrl: 'not-a-url' })).toBeNull();
    expect(resolveVideoUrl({ videoUrl: 'ftp://x' })).toBeNull();
  });

  it('returns null for a null/undefined recipe', () => {
    expect(resolveVideoUrl(null)).toBeNull();
    expect(resolveVideoUrl(undefined)).toBeNull();
  });
});

describe('isYouTubeUrl', () => {
  it('detects youtube.com and youtu.be', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true);
    expect(isYouTubeUrl('https://youtu.be/abc')).toBe(true);
    expect(isYouTubeUrl('https://m.youtube.com/watch?v=abc')).toBe(true);
  });

  it('is false for non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://vid.tasty.co/x.mp4')).toBe(false);
    expect(isYouTubeUrl('https://example.com/v.mp4')).toBe(false);
  });

  it('is false for null/empty', () => {
    expect(isYouTubeUrl(null)).toBe(false);
    expect(isYouTubeUrl('')).toBe(false);
    expect(isYouTubeUrl(undefined)).toBe(false);
  });

  // Plan 019, step 3.4 (audit 2.4): the exact host decides, not a substring.
  it('detects every YouTube host, whatever the case', () => {
    expect(isYouTubeUrl('https://youtube.com/watch?v=abc')).toBe(true);
    expect(isYouTubeUrl('https://music.youtube.com/watch?v=abc')).toBe(true);
    expect(isYouTubeUrl('HTTPS://WWW.YOUTUBE.COM/watch?v=abc')).toBe(true);
  });

  it('is false for a host that only contains a YouTube name', () => {
    expect(isYouTubeUrl('https://youtube.com.evil.com/watch?v=abc')).toBe(false);
    expect(isYouTubeUrl('https://x.com/?a=.youtube.com')).toBe(false);
    expect(isYouTubeUrl('https://youtu.be.evil.com/abc')).toBe(false);
    expect(isYouTubeUrl('https://evil.com/youtu.be/abc')).toBe(false);
    expect(isYouTubeUrl('https://notyoutube.com/watch?v=abc')).toBe(false);
    expect(isYouTubeUrl('https://youtube.com@evil.com/')).toBe(false);
  });

  it('is false for an invalid URL', () => {
    expect(isYouTubeUrl('youtube.com/watch?v=abc')).toBe(false);
    expect(isYouTubeUrl('not a url')).toBe(false);
  });
});
