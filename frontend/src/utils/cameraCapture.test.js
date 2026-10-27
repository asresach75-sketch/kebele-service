const { describe, it, expect } = require('@jest/globals');
const { getFrameBrightnessRatio, isLikelyBlankFrame } = require('./cameraCapture');

describe('cameraCapture validation', () => {
  it('accepts a dark-but-live frame instead of falsely flagging it as blank', () => {
    const darkFrame = new Uint8ClampedArray(4 * 100);
    for (let i = 0; i < darkFrame.length; i += 4) {
      darkFrame[i] = 30;
      darkFrame[i + 1] = 40;
      darkFrame[i + 2] = 45;
      darkFrame[i + 3] = 255;
    }

    const ratio = getFrameBrightnessRatio(darkFrame, 4, 12);
    expect(ratio).toBeGreaterThan(0);
    expect(isLikelyBlankFrame(darkFrame, 4, 12)).toBe(false);
  });
});
