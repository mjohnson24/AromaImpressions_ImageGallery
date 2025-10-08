import { closeGallery, deleteCurrentImage, exportCurrentImage } from "./actions.js";
import { firstImage, goToImage, lastImage, nextImage, previousImage, scrollThumbnailsLeft, scrollThumbnailsRight, scrollThumbnailsTo } from "./navigation.js";
import { generateThumbnails, updateImageCounter, updateImageInfo, updateMainImageBackground, updateThumbnailDisplay, updateThumbnailNavButtons } from "./render.js";
import { galleryData } from "./state.js";

export function setupEventListeners() {
  // Export button
  const exportButton = document.querySelector(".export-btn");
  if (exportButton) {
    exportButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      exportCurrentImage();
    });
    exportButton.style.pointerEvents = "auto";
    exportButton.style.zIndex = "1001";
  }

  // Delete button
  const deleteButton = document.querySelector(".delete-btn");
  if (deleteButton) {
    deleteButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteCurrentImage();
    });
    deleteButton.style.pointerEvents = "auto";
    deleteButton.style.zIndex = "1001";
  }

  // Close button
  const closeButton = document.querySelector(".close-btn");
  if (closeButton) {
    closeButton.addEventListener("click", () => closeGallery());
  }

  // Navigation arrows
  const navArrowLeft = document.querySelector(".nav-arrow-left");
  const navArrowRight = document.querySelector(".nav-arrow-right");
  if (navArrowLeft) navArrowLeft.addEventListener("click", () => previousImage());
  if (navArrowRight) navArrowRight.addEventListener("click", () => nextImage());

  // Thumbnail nav buttons
  const firstThumbnailBtn = document.querySelector(".thumbnail-nav-first");
  const leftThumbnailBtn = document.querySelector(".thumbnail-nav-left");
  const rightThumbnailBtn = document.querySelector(".thumbnail-nav-right");
  const lastThumbnailBtn = document.querySelector(".thumbnail-nav-last");
  if (firstThumbnailBtn) firstThumbnailBtn.addEventListener("click", () => firstImage());
  if (leftThumbnailBtn) leftThumbnailBtn.addEventListener("click", () => previousImage());
  if (rightThumbnailBtn) rightThumbnailBtn.addEventListener("click", () => nextImage());
  if (lastThumbnailBtn) lastThumbnailBtn.addEventListener("click", () => lastImage());

  // Right-click context menu on main image
  const mainImage = document.querySelector("#main-image");
  if (mainImage) {
    mainImage.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (galleryData.length === 0) return;

      const contextMenu = document.createElement("div");
      contextMenu.className = "context-menu";
      contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const exportOption = document.createElement("div");
      exportOption.textContent = "Download Image";
      exportOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid #eee;
      `;
      exportOption.addEventListener("click", () => {
        exportCurrentImage();
        document.body.removeChild(contextMenu);
      });
      exportOption.addEventListener("mouseenter", () => (exportOption.style.backgroundColor = "#f0f0f0"));
      exportOption.addEventListener("mouseleave", () => (exportOption.style.backgroundColor = "transparent"));

      const deleteOption = document.createElement("div");
      deleteOption.textContent = "Delete Image";
      deleteOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s ease;
        color: #d32f2f;
      `;
      deleteOption.addEventListener("click", () => {
        deleteCurrentImage();
        document.body.removeChild(contextMenu);
      });
      deleteOption.addEventListener("mouseenter", () => (deleteOption.style.backgroundColor = "#ffebee"));
      deleteOption.addEventListener("mouseleave", () => (deleteOption.style.backgroundColor = "transparent"));

      contextMenu.appendChild(exportOption);
      contextMenu.appendChild(deleteOption);
      document.body.appendChild(contextMenu);

      const removeMenu = (event) => {
        if (!contextMenu.contains(event.target)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener("click", removeMenu);
        }
      };
      setTimeout(() => document.addEventListener("click", removeMenu), 10);
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        previousImage();
        break;
      case "ArrowRight":
        e.preventDefault();
        nextImage();
        break;
      case "Home":
        e.preventDefault();
        firstImage();
        break;
      case "End":
        e.preventDefault();
        lastImage();
        break;
      case "Escape":
        e.preventDefault();
        closeGallery();
        break;
      case "s":
      case "S":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          exportCurrentImage();
        }
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        deleteCurrentImage();
        break;
    }
  });

  // Delegate thumbnail clicks to goToImage
  document.addEventListener("click", (e) => {
    const target = e.target;
    const tn = target && typeof target.closest === "function" ? target.closest(".thumbnail") : null;
    if (tn && tn.dataset.index) {
      const idx = Number(tn.dataset.index);
      if (!Number.isNaN(idx)) goToImage(idx);
    }
  });

  // React to programmatic requests to scroll thumbnail window
  window.addEventListener("thumbnailScrollTo", (ev) => {
    const detail = ev && ev.detail ? ev.detail : {};
    const pos = detail.to;
    if (typeof pos === "number") scrollThumbnailsTo(pos);
  });

  // Expose a simple fallback for environments without CustomEvent support
  window.scrollThumbnailsTo = (pos) => {
    if (typeof pos === "number") scrollThumbnailsTo(pos);
  };
}

export function initGalleryIfDataPresent() {
  if (galleryData.length > 0) {
    generateThumbnails();
    updateImageCounter();
    updateMainImageBackground();
    updateImageInfo();
    updateThumbnailNavButtons();
    updateThumbnailDisplay();
  }
}
