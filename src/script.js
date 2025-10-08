// Gallery orchestrator: wires state, render, navigation, actions, and events
// Public API: export setGalleryData(items) used by src/index.js (FileMaker)

import { deleteCurrentImage, exportCurrentImage, setFMScriptMode } from "./actions.js";
import { initGalleryIfDataPresent, setupEventListeners } from "./events.js";
import { generateThumbnails, updateImageCounter, updateImageInfo, updateMainImageBackground, updateThumbnailDisplay, updateThumbnailNavButtons } from "./render.js";
import { initStateWithData, setVisibleThumbnailsCount } from "./state.js";

export function setGalleryData(data) {
  if (!Array.isArray(data) || data.length === 0) return;
  initStateWithData(data);
  generateThumbnails();
  updateImageCounter();
  updateMainImageBackground();
  updateImageInfo();
  updateThumbnailNavButtons();
  updateThumbnailDisplay();
}

function initGallery() {
  setupEventListeners();
  initGalleryIfDataPresent();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    // Optional: allow overriding FileMaker script mode via URL parameter
    try {
      const params = new URLSearchParams(window.location.search || "");
      const mode = (params.get("fmScriptMode") || "").toLowerCase();
      if (mode) {
        setFMScriptMode(mode);
      }
    } catch {}
    initGallery();
    // Retry late-bound controls
    setTimeout(() => {
      updateThumbnailNavButtons();
    }, 1500);
  }, 100);
});

// Debug helpers preserved for parity with previous implementation
window.setupExportButton = function () {
  const btn = document.querySelector(".export-btn");
  if (btn) {
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.querySelector(".export-btn");
    newBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      exportCurrentImage();
    });
    return "Export button setup successfully";
  } else {
    return "Export button not found";
  }
};

window.setupDeleteButton = function () {
  const btn = document.querySelector(".delete-btn");
  if (btn) {
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.querySelector(".delete-btn");
    newBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteCurrentImage();
    });
    return "Delete button setup successfully";
  } else {
    return "Delete button not found";
  }
};

// Optional: external control to change visible thumbnails window
window.setVisibleThumbnails = function (count) {
  setVisibleThumbnailsCount(count);
  updateThumbnailDisplay();
  updateThumbnailNavButtons();
};
