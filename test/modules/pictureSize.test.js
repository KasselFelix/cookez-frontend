/* global describe, it, expect */
// Plan 015: photos of about 1024 px on the long side, not the full sensor.
import { pickPictureSize } from '../../modules/pictureSize';

describe('pickPictureSize', () => {
  it('takes the smallest size whose long side reaches 1024 px', () => {
    expect(pickPictureSize(['4032x3024', '640x480', '1280x960', '1024x768', '1920x1080'])).toBe('1024x768');
  });

  it('reads portrait and landscape alike', () => {
    expect(pickPictureSize(['720x1280', '3000x4000'])).toBe('720x1280');
  });

  it('prefers the smaller area at the same long side', () => {
    expect(pickPictureSize(['1280x960', '1280x720'])).toBe('1280x720');
  });

  it('keeps the default when no size is large enough or the list is not WxH', () => {
    expect(pickPictureSize(['640x480', '800x600'])).toBeUndefined();
    expect(pickPictureSize(['Photo', 'High'])).toBeUndefined();
    expect(pickPictureSize(undefined)).toBeUndefined();
  });
});
