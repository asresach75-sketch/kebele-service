function getFrameBrightnessRatio(imageData, sampleStep = 16, brightnessThreshold = 12) {
  if (!imageData || imageData.length === 0) {
    return 0;
  }

  let brightPixels = 0;
  let sampledPixels = 0;

  for (let index = 0; index < imageData.length; index += sampleStep * 4) {
    const red = imageData[index];
    const green = imageData[index + 1];
    const blue = imageData[index + 2];

    if (red === undefined || green === undefined || blue === undefined) {
      continue;
    }

    sampledPixels += 1;
    const brightness = (red * 0.299) + (green * 0.587) + (blue * 0.114);

    if (brightness > brightnessThreshold) {
      brightPixels += 1;
    }
  }

  return sampledPixels ? brightPixels / sampledPixels : 0;
}

function isLikelyBlankFrame(imageData, sampleStep = 16, brightnessThreshold = 12, blankThreshold = 0.003) {
  return getFrameBrightnessRatio(imageData, sampleStep, brightnessThreshold) < blankThreshold;
}

module.exports = {
  getFrameBrightnessRatio,
  isLikelyBlankFrame
};
