import { ensureActiveThumbnailVisible, updateActiveThumbnail, updateImageCounter, updateImageInfo, updateMainImageBackground, updateThumbnailDisplay, updateThumbnailNavButtons } from "./render.js";
import { currentImage, setCurrentImage, setThumbnailScrollPosition, thumbnailScrollPosition, totalImages, visibleThumbnails } from "./state.js";

function updateGallery() {
  updateImageCounter();
  updateActiveThumbnail();
  updateImageInfo();
  updateMainImageBackground();
  updateThumbnailNavButtons();
  ensureActiveThumbnailVisible();
}

export function firstImage() {
  if (currentImage > 0) {
    setCurrentImage(0);
    updateGallery();
  }
}

export function previousImage() {
  if (currentImage > 0) {
    setCurrentImage(currentImage - 1);
    updateGallery();
  }
}

export function nextImage() {
  if (currentImage < totalImages - 1) {
    setCurrentImage(currentImage + 1);
    updateGallery();
  }
}

export function lastImage() {
  if (currentImage < totalImages - 1) {
    setCurrentImage(totalImages - 1);
    updateGallery();
  }
}

export function goToImage(index) {
  setCurrentImage(index);
  updateGallery();
}

export function scrollThumbnailsLeft() {
  if (thumbnailScrollPosition > 0) {
    setThumbnailScrollPosition(Math.max(0, thumbnailScrollPosition - visibleThumbnails));
    updateThumbnailDisplay();
  }
}

export function scrollThumbnailsRight() {
  const maxScrollPosition = Math.max(0, totalImages - visibleThumbnails);
  if (thumbnailScrollPosition < maxScrollPosition) {
    setThumbnailScrollPosition(Math.min(maxScrollPosition, thumbnailScrollPosition + visibleThumbnails));
    updateThumbnailDisplay();
  }
}

export function scrollThumbnailsTo(pos) {
  setThumbnailScrollPosition(pos);
  updateThumbnailDisplay();
}
