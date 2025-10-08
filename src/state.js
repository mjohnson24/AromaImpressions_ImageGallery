// Centralized gallery state with safe setters/getters
// Live bindings are exported for read access; mutations happen via setters

export let currentImage = 0;
export let totalImages = 0;
export let visibleThumbnails = 8; // default visible thumbnails
export let thumbnailScrollPosition = 0;
export let lastImageIndex = 0;
export let galleryData = [];

export function initStateWithData(data) {
  galleryData = Array.isArray(data) ? data : [];
  totalImages = galleryData.length;
  currentImage = 0;
  thumbnailScrollPosition = 0;
  lastImageIndex = 0;
}

export function setCurrentImage(index) {
  if (typeof index === "number") {
    currentImage = Math.max(0, Math.min(index, totalImages - 1));
  }
}

export function setThumbnailScrollPosition(pos) {
  if (typeof pos === "number") {
    const maxScroll = Math.max(0, totalImages - visibleThumbnails);
    thumbnailScrollPosition = Math.max(0, Math.min(pos, maxScroll));
  }
}

export function setVisibleThumbnailsCount(count) {
  if (typeof count === "number") {
    visibleThumbnails = Math.max(1, Math.min(count, totalImages || count));
    // Reset scroll when count changes
    thumbnailScrollPosition = 0;
  }
}

export function setLastImageIndex(index) {
  if (typeof index === "number") {
    lastImageIndex = Math.max(0, Math.min(index, totalImages - 1));
  }
}
