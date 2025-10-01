// Gallery functionality using functions
let currentImage = 0;
let totalImages = 0; // will be set from galleryData
let visibleThumbnails = 8; // Number of thumbnails to show at once
let thumbnailScrollPosition = 0; // Current scroll position in thumbnail grid
let lastImageIndex = 0; // Add a variable to track the last image index for animation direction

// galleryData holds the array of items used by the gallery UI. It can be set
// by FileMaker via window.loadWidget or during local testing.
let galleryData = [];

function initGallery() {
  setupEventListeners();
  // Only update UI elements if we have data
  if (galleryData.length > 0) {
    generateThumbnails();
    updateImageCounter();
    updateMainImageBackground();
    updateImageInfo();
    updateThumbnailNavButtons();
    updateThumbnailDisplay();
  }
}

export function setGalleryData(data) {
  if (!Array.isArray(data) || data.length === 0) return;
  galleryData = data;
  totalImages = galleryData.length;
  // reset indices and re-render the UI
  currentImage = 0;
  thumbnailScrollPosition = 0;
  lastImageIndex = 0;
  // Now update the full gallery UI since we have data
  generateThumbnails();
  updateImageCounter();
  updateMainImageBackground();
  updateImageInfo();
  updateThumbnailNavButtons();
  updateThumbnailDisplay();
}

function setupEventListeners() {
  //   Close button
  document.querySelector(".close-btn").addEventListener("click", () => {
    closeGallery();
  });

  // Navigation arrows
  navArrowLeft.addEventListener("click", () => {
    previousImage();
  });

  navArrowRight.addEventListener("click", () => {
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

const navArrowLeft = document.querySelector(".nav-arrow-left");
const navArrowRight = document.querySelector(".nav-arrow-right");

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

// function updateMainImageBackground() {
//   const imagePlaceholder = document.querySelector("#main-image");
//   if (imagePlaceholder) {
//     // Use galleryData item as background if available, otherwise fallback to a neutral color
//     const item = galleryData[currentImage];
//     if (item && (item.src || item.thumb)) {
//       const imageURL = item.src || item.thumb;
//       // set as background image and ensure it covers the placeholder
//       imagePlaceholder.src = imageURL;
//       imagePlaceholder.style.backgroundSize = "cover";
//       imagePlaceholder.style.backgroundPosition = "center";
//       imagePlaceholder.style.backgroundColor = "transparent";
//     } else {
//       imagePlaceholder.style.backgroundImage = "";
//       imagePlaceholder.style.backgroundColor = "#eee";
//     }
//   }
// }

function updateMainImageBackground() {
  const imagePlaceholder = document.querySelector("#main-image");
  if (!imagePlaceholder) return;

  // Don't animate or show anything if we have no data
  if (galleryData.length === 0) {
    imagePlaceholder.src = "";
    imagePlaceholder.style.backgroundColor = "transparent";
    return;
  }

  // Determine animation direction
  const isMovingRight = currentImage > lastImageIndex;
  const slideOutClass = isMovingRight ? "slide-out-left" : "slide-out-right";
  const slideInClass = isMovingRight ? "slide-in-right" : "slide-in-left";

  // Start slide out animation
  imagePlaceholder.classList.add(slideOutClass);

  // After slide out completes, update image and slide in
  setTimeout(() => {
    // Update the image source
    const item = galleryData[currentImage];
    if (item && (item.src || item.thumb)) {
      const imageURL = item.src || item.thumb;
      imagePlaceholder.src = imageURL;
      imagePlaceholder.style.backgroundSize = "cover";
      imagePlaceholder.style.backgroundPosition = "center";
      imagePlaceholder.style.backgroundColor = "transparent";
    } else {
      imagePlaceholder.style.backgroundImage = "";
      imagePlaceholder.style.backgroundColor = "#eee";
    }

    // Remove slide out class and add slide in class
    imagePlaceholder.classList.remove(slideOutClass);
    imagePlaceholder.classList.add(slideInClass);

    // Trigger slide in animation
    setTimeout(() => {
      imagePlaceholder.classList.remove(slideInClass);
      // Update last image index for next animation
      lastImageIndex = currentImage;
    }, 10);
  }, 300);
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
  const item = galleryData[currentImage] || {};
  //   console.log("infoItems", infoItems);
  //   console.log("Updating item", item);
  // Info slot 0 -> Unit Serial Number
  if (infoItems[0]) {
    const itemTitle = item.title ? item.title : "";
    infoItems[0].innerHTML = `<span>Unit Serial Number:</span> ${itemTitle}`;
  }
  // Info slot 1 -> Description
  if (infoItems[1]) {
    const itemDesc = item.capDesc ? item.capDesc : "";
    infoItems[1].innerHTML = `<span>Unit Location:</span> ${itemDesc}`;
  }
  // Info slot 2 -> ClientID
  //   if (infoItems[2]) {
  //     const itemClientID = item.clientID ? item.clientID : "";
  //     infoItems[2].innerHTML = `<span>Client ID:</span>  ${itemClientID}`;
  // 	}
  // Info slot 2 -> ClientID
  if (infoItems[2]) {
    const itemServiceID = item.ServiceID ? item.ServiceID : "";
    infoItems[2].innerHTML = `<span>REC ID:</span>  ${itemServiceID}`;
  }
}

function generateThumbnails() {
  const thumbnailsContainer = document.querySelector(".thumbnails");
  if (!thumbnailsContainer) return;

  // Clear existing thumbnails
  thumbnailsContainer.innerHTML = "";

  // Generate thumbnails from galleryData
  for (let i = 0; i < totalImages; i++) {
    const thumbnail = document.createElement("div");
    thumbnail.className = "thumbnail";
    if (i === 0) thumbnail.classList.add("active");

    const item = galleryData[i] || {};
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

// Safety helpers for calling back into FileMaker
function callFMScript(scriptName, param) {
  try {
    if (window.FileMaker && typeof window.FileMaker.PerformScript === "function") {
      window.FileMaker.PerformScript(scriptName, param);
      return true;
    }
    // Legacy fallback: fmp URL (only if needed)
    var url = "fmp://$/" + encodeURIComponent(scriptName) + "?script.param=" + encodeURIComponent(param);
    window.location.href = url;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function closeGallery() {
  console.log("Gallery closed");
  // Change this to your receiving FM script name:
  const ok = callFMScript("UNIV: Committ/Close Window/Exit", "");

  if (!ok) {
    alert("Could not call FileMaker script.");
    return;
  }
}

// Initialize the gallery when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initGallery();
});
