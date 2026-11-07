// Vision models shrink a photo to about 1 024 px on its long side (plan 015):
// a full-resolution shot only costs upload time and risks the 4 MB limit.
export const TARGET_LONG_SIDE = 1024;

const parseSize = (size) => {
  const match = /^(\d+)\s*x\s*(\d+)$/i.exec(String(size).trim());
  return match ? { size, long: Math.max(Number(match[1]), Number(match[2])), area: Number(match[1]) * Number(match[2]) } : null;
};

/**
 * The smallest picture size whose long side reaches TARGET_LONG_SIDE, from
 * CameraView.getAvailablePictureSizesAsync(). Undefined when none fits (or
 * the list is not "WxH" strings, as on iOS presets): the camera keeps its default.
 *
 * @param {string[] | undefined} sizes e.g. ["4032x3024", "1280x960", "640x480"]
 * @returns {string | undefined}
 */
export function pickPictureSize(sizes) {
  const usable = (sizes || [])
    .map(parseSize)
    .filter((parsed) => parsed && parsed.long >= TARGET_LONG_SIDE)
    .sort((a, b) => a.long - b.long || a.area - b.area);
  return usable[0]?.size;
}
