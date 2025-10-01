// Gallery functionality using functions
let currentImage = 0;
let totalImages = 0; // will be set from demo data
let visibleThumbnails = 8; // Number of thumbnails to show at once
let thumbnailScrollPosition = 0; // Current scroll position in thumbnail grid

import demo from "./demo.js";

// Initialize totalImages from demo data if available
if (Array.isArray(demo) && demo.length > 0) {
  totalImages = demo.length;
} else {
  // fallback to 0 to avoid errors
  totalImages = 0;
}

function initGallery() {
  generateThumbnails();
  setupEventListeners();
  updateImageCounter();
  updateMainImageBackground();
  updateImageInfo();
  updateThumbnailNavButtons();
  updateThumbnailDisplay();
}

function setupEventListeners() {
  // Close button
  //   document.querySelector(".close-btn").addEventListener("click", () => {
  //     closeGallery();
  //   });

  // Navigation arrows
  document.querySelector(".nav-arrow-left").addEventListener("click", () => {
    previousImage();
  });

  document.querySelector(".nav-arrow-right").addEventListener("click", () => {
    nextImage();
  });

  // Thumbnail navigation - same as main image navigation
  const firstThumbnailBtn = document.querySelector(".thumbnail-nav-first");
  const leftThumbnailBtn = document.querySelector(".thumbnail-nav-left");
  const rightThumbnailBtn = document.querySelector(".thumbnail-nav-right");
  const lastThumbnailBtn = document.querySelector(".thumbnail-nav-last");

  if (firstThumbnailBtn) {
    firstThumbnailBtn.addEventListener("click", () => {
      firstImage();
    });
  }

  if (leftThumbnailBtn) {
    leftThumbnailBtn.addEventListener("click", () => {
      previousImage();
    });
  }

  if (rightThumbnailBtn) {
    rightThumbnailBtn.addEventListener("click", () => {
      nextImage();
    });
  }

  if (lastThumbnailBtn) {
    lastThumbnailBtn.addEventListener("click", () => {
      lastImage();
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        previousImage();
        break;
      case "ArrowRight":
        nextImage();
        break;
      //   case "Escape":
      //     closeGallery();
      //     break;
    }
  });
}

function firstImage() {
  if (currentImage > 0) {
    currentImage = 0;
    updateGallery();
  }
}

function previousImage() {
  if (currentImage > 0) {
    currentImage--;
    updateGallery();
  }
}

function nextImage() {
  if (currentImage < totalImages - 1) {
    currentImage++;
    updateGallery();
  }
}

function lastImage() {
  if (currentImage < totalImages - 1) {
    currentImage = totalImages - 1;
    updateGallery();
  }
}

function goToImage(index) {
  currentImage = index;
  updateGallery();
}

function updateGallery() {
  updateImageCounter();
  updateActiveThumbnail();
  updateImageInfo();
  updateMainImageBackground();
  updateThumbnailNavButtons();
  ensureActiveThumbnailVisible();
}

function updateMainImageBackground() {
  const imagePlaceholder = document.querySelector(".image-placeholder");
  if (imagePlaceholder) {
    // Use demo image as background if available, otherwise fallback to a neutral color
    const item = demo[currentImage];
    if (item && (item.src || item.thumb)) {
      const src = item.src || item.thumb;
      // set as background image and ensure it covers the placeholder
      imagePlaceholder.style.backgroundImage = `url('${src}')`;
      imagePlaceholder.style.backgroundSize = "cover";
      imagePlaceholder.style.backgroundPosition = "center";
      imagePlaceholder.style.backgroundColor = "transparent";
    } else {
      imagePlaceholder.style.backgroundImage = "";
      imagePlaceholder.style.backgroundColor = "#eee";
    }
  }
}

function updateImageCounter() {
  const counter = document.querySelector(".image-counter");
  counter.textContent = `${currentImage + 1}/${totalImages}`;
}

function updateActiveThumbnail() {
  document.querySelectorAll(".thumbnail").forEach((thumbnail, index) => {
    thumbnail.classList.toggle("active", index === currentImage);
  });
}

function updateImageInfo() {
  const infoItems = document.querySelectorAll(".info-item");
  const item = demo[currentImage] || {};
  // Info slot 0 -> title or serial number fallback
  if (infoItems[0]) {
    infoItems[0].textContent = item.title ? item.title : `Unit Serial Number: USN-${String(currentImage + 1).padStart(3, "0")}`;
  }
  // Info slot 1 -> caption/description or location fallback
  if (infoItems[1]) {
    infoItems[1].textContent = item.capDesc ? item.capDesc : `Unit Location: Location ${currentImage + 1}`;
  }
}

function generateThumbnails() {
  const thumbnailsContainer = document.querySelector(".thumbnails");
  if (!thumbnailsContainer) return;

  // Clear existing thumbnails
  thumbnailsContainer.innerHTML = "";

  // Generate thumbnails from demo data
  for (let i = 0; i < totalImages; i++) {
    const thumbnail = document.createElement("div");
    thumbnail.className = "thumbnail";
    if (i === 0) thumbnail.classList.add("active");

    const item = demo[i] || {};
    const thumbSrc = item.thumb || item.src || "";

    if (thumbSrc) {
      // use an img inside the thumbnail for better aspect handling
      const img = document.createElement("img");
      img.src = thumbSrc;
      img.alt = item.title || `Image ${i + 1}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      thumbnail.appendChild(img);
    } else {
      // fallback visual
      thumbnail.style.backgroundColor = "#ccc";
      thumbnail.textContent = item.title ? item.title : "N/A";
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.fontSize = "12px";
    }

    thumbnail.addEventListener("click", () => {
      goToImage(i);
    });

    thumbnailsContainer.appendChild(thumbnail);
  }
}

function updateThumbnailDisplay() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  const startIndex = thumbnailScrollPosition;
  const endIndex = Math.min(startIndex + visibleThumbnails, totalImages);

  // Hide all thumbnails first
  thumbnails.forEach((thumbnail) => {
    thumbnail.style.display = "none";
  });

  // Show only the visible range
  for (let i = startIndex; i < endIndex; i++) {
    if (thumbnails[i]) {
      thumbnails[i].style.display = "block";
    }
  }

  // Update navigation button states
  updateThumbnailNavButtons();
}

function updateThumbnailNavButtons() {
  const firstBtn = document.querySelector(".thumbnail-nav-first");
  const leftBtn = document.querySelector(".thumbnail-nav-left");
  const rightBtn = document.querySelector(".thumbnail-nav-right");
  const lastBtn = document.querySelector(".thumbnail-nav-last");

  if (firstBtn) {
    firstBtn.disabled = currentImage <= 0;
    firstBtn.style.opacity = currentImage <= 0 ? "0.5" : "1";
  }

  if (leftBtn) {
    leftBtn.disabled = currentImage <= 0;
    leftBtn.style.opacity = currentImage <= 0 ? "0.5" : "1";
  }

  if (rightBtn) {
    rightBtn.disabled = currentImage >= totalImages - 1;
    rightBtn.style.opacity = currentImage >= totalImages - 1 ? "0.5" : "1";
  }

  if (lastBtn) {
    lastBtn.disabled = currentImage >= totalImages - 1;
    lastBtn.style.opacity = currentImage >= totalImages - 1 ? "0.5" : "1";
  }
}

function scrollThumbnailsLeft() {
  if (thumbnailScrollPosition > 0) {
    thumbnailScrollPosition = Math.max(0, thumbnailScrollPosition - visibleThumbnails);
    updateThumbnailDisplay();
  }
}

function scrollThumbnailsRight() {
  const maxScrollPosition = totalImages - visibleThumbnails;
  if (thumbnailScrollPosition < maxScrollPosition) {
    thumbnailScrollPosition = Math.min(maxScrollPosition, thumbnailScrollPosition + visibleThumbnails);
    updateThumbnailDisplay();
  }
}

function ensureActiveThumbnailVisible() {
  const activeIndex = currentImage;
  const currentStart = thumbnailScrollPosition;
  const currentEnd = currentStart + visibleThumbnails - 1;

  // If active thumbnail is not in visible range, scroll to show it
  if (activeIndex < currentStart) {
    thumbnailScrollPosition = Math.max(0, activeIndex);
    updateThumbnailDisplay();
  } else if (activeIndex > currentEnd) {
    thumbnailScrollPosition = Math.min(totalImages - visibleThumbnails, activeIndex - visibleThumbnails + 1);
    updateThumbnailDisplay();
  }
}

// Function to change the number of visible thumbnails
function setVisibleThumbnails(count) {
  visibleThumbnails = Math.max(1, Math.min(count, totalImages));
  thumbnailScrollPosition = 0; // Reset scroll position
  updateThumbnailDisplay();
}

// function closeGallery() {
//   console.log("Gallery closed");
// }

// Initialize the gallery when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initGallery();
});
