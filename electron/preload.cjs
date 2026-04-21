const { webFrame } = require("electron");

const MIN_ZOOM_FACTOR = 0.25;
const MAX_ZOOM_FACTOR = 3;
const ZOOM_STEP = 0.1;

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

window.addEventListener(
  "wheel",
  (event) => {
    if (!event.ctrlKey) return;

    event.preventDefault();
    const currentZoom = webFrame.getZoomFactor();
    const nextZoom =
      event.deltaY < 0 ? currentZoom + ZOOM_STEP : currentZoom - ZOOM_STEP;
    webFrame.setZoomFactor(clamp(nextZoom, MIN_ZOOM_FACTOR, MAX_ZOOM_FACTOR));
  },
  { passive: false },
);
