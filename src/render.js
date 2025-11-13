// Rendering helpers for the gallery UI
import { currentImage, galleryData, lastImageIndex, setLastImageIndex, thumbnailScrollPosition, totalImages, visibleThumbnails } from "./state.js";

export function updateImageCounter() {
  const counter = document.querySelector(".image-counter");
  if (counter) counter.textContent = `${currentImage + 1}/${totalImages}`;
}

export function updateActiveThumbnail() {
  document.querySelectorAll(".thumbnail").forEach((thumbnail, index) => {
    thumbnail.classList.toggle("active", index === currentImage);
  });
}

export function updateImageInfo() {
  const infoItems = document.querySelectorAll(".info-item");
  const item = galleryData[currentImage] || {};
  if (infoItems[0]) {
    const itemTitle = item.title ? item.title : "";
    infoItems[0].innerHTML = `<span>Unit Serial Number:</span> ${itemTitle}`;
  }
  if (infoItems[1]) {
    const itemDesc = item.capDesc ? item.capDesc : "";
    infoItems[1].innerHTML = `<span>Unit Location:</span> ${itemDesc}`;
  }
  //   if (infoItems[2]) {
  //     const itemServiceID = item.ServiceID ? item.ServiceID : "";
  //     infoItems[2].innerHTML = `<span>REC ID:</span>  ${itemServiceID}`;
  //   }
  //   if (infoItems[3]) {
  //     const itemClientID = item.ClientID ? item.ClientID : "";
  //     infoItems[3].innerHTML = `<span>Client ID:</span>  ${itemClientID}`;
  //   }
}

export function updateMainImageBackground() {
  const imagePlaceholder = document.querySelector("#main-image");
  if (!imagePlaceholder) return;
  if (galleryData.length === 0) {
    imagePlaceholder.src = "";
    imagePlaceholder.style.backgroundColor = "transparent";
    return;
  }

  const isMovingRight = currentImage > lastImageIndex;
  const slideOutClass = isMovingRight ? "slide-out-left" : "slide-out-right";
  const slideInClass = isMovingRight ? "slide-in-right" : "slide-in-left";

  imagePlaceholder.classList.add(slideOutClass);

  setTimeout(() => {
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

    imagePlaceholder.classList.remove(slideOutClass);
    imagePlaceholder.classList.add(slideInClass);

    setTimeout(() => {
      imagePlaceholder.classList.remove(slideInClass);
      setLastImageIndex(currentImage);
    }, 10);
  }, 300);
}

export function generateThumbnails() {
  const thumbnailsContainer = document.querySelector(".thumbnails");
  if (!thumbnailsContainer) return;
  thumbnailsContainer.innerHTML = "";
  for (let i = 0; i < totalImages; i++) {
    const thumbnail = document.createElement("div");
    thumbnail.className = "thumbnail";
    if (i === 0) thumbnail.classList.add("active");
    const item = galleryData[i] || {};
    const thumbSrc = item.thumb || item.src || "";
    if (thumbSrc) {
      const img = document.createElement("img");
      img.src = thumbSrc;
      img.alt = item.title || `Image ${i + 1}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      thumbnail.appendChild(img);
    } else {
      thumbnail.style.backgroundColor = "#ccc";
      thumbnail.textContent = item.title ? item.title : "N/A";
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.fontSize = "12px";
    }
    // Listener is attached in events.js to avoid importing navigation here
    thumbnail.dataset.index = String(i);
    thumbnailsContainer.appendChild(thumbnail);
  }
}

export function updateThumbnailNavButtons() {
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

export function updateThumbnailDisplay() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  const startIndex = thumbnailScrollPosition;
  const endIndex = Math.min(startIndex + visibleThumbnails, totalImages);

  thumbnails.forEach((thumbnail) => {
    thumbnail.style.display = "none";
  });

  for (let i = startIndex; i < endIndex; i++) {
    const tn = thumbnails[i];
    if (tn) tn.style.display = "block";
  }
  updateThumbnailNavButtons();
}

export function ensureActiveThumbnailVisible() {
  const activeIndex = currentImage;
  const currentStart = thumbnailScrollPosition;
  const currentEnd = currentStart + visibleThumbnails - 1;
  if (activeIndex < currentStart) {
    try {
      const event = new CustomEvent("thumbnailScrollTo", { detail: { to: activeIndex } });
      window.dispatchEvent(event);
    } catch {
      if (typeof window.scrollThumbnailsTo === "function") window.scrollThumbnailsTo(activeIndex);
    }
  } else if (activeIndex > currentEnd) {
    const to = Math.min(totalImages - visibleThumbnails, activeIndex - visibleThumbnails + 1);
    try {
      const event = new CustomEvent("thumbnailScrollTo", { detail: { to } });
      window.dispatchEvent(event);
    } catch {
      if (typeof window.scrollThumbnailsTo === "function") window.scrollThumbnailsTo(to);
    }
  }
}
