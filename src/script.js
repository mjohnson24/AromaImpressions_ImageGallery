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
  // Export button
  const exportButton = document.querySelector(".export-btn");
  if (exportButton) {
    exportButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      exportCurrentImage();
    });

    // Test if button is clickable
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

    // Test if button is clickable
    deleteButton.style.pointerEvents = "auto";
    deleteButton.style.zIndex = "1001";
  }

  // Close button
  const closeButton = document.querySelector(".close-btn");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeGallery();
    });
  }

  // Navigation arrows
  navArrowLeft.addEventListener("click", () => {
    previousImage();
  });

  navArrowRight.addEventListener("click", () => {
    nextImage();
  });

  // Thumbnail navigation - simple and working version
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

  // Right-click context menu on main image
  const mainImage = document.querySelector("#main-image");
  if (mainImage) {
    mainImage.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // Only show context menu if we have an image
      if (galleryData.length === 0) return;

      // Create context menu
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

      exportOption.addEventListener("mouseenter", () => {
        exportOption.style.backgroundColor = "#f0f0f0";
      });

      exportOption.addEventListener("mouseleave", () => {
        exportOption.style.backgroundColor = "transparent";
      });

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

      deleteOption.addEventListener("mouseenter", () => {
        deleteOption.style.backgroundColor = "#ffebee";
      });

      deleteOption.addEventListener("mouseleave", () => {
        deleteOption.style.backgroundColor = "transparent";
      });

      contextMenu.appendChild(exportOption);
      contextMenu.appendChild(deleteOption);
      document.body.appendChild(contextMenu);

      // Remove context menu when clicking elsewhere
      const removeMenu = (event) => {
        if (!contextMenu.contains(event.target)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener("click", removeMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener("click", removeMenu);
      }, 10);
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
          // Ctrl+S or Cmd+S
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
  //   console.log("infoItems: ", infoItems);

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

  // Info slot 2 -> ServiceID
  if (infoItems[2]) {
    const itemServiceID = item.ServiceID ? item.ServiceID : "";
    infoItems[2].innerHTML = `<span>REC ID:</span>  ${itemServiceID}`;
  }

  // Info slot 3 -> ClientID
  if (infoItems[3]) {
    const itemClientID = item.ClientID ? item.ClientID : "";
    infoItems[3].innerHTML = `<span>Client ID:</span>  ${itemClientID}`;
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
  const maxScrollPosition = Math.max(0, totalImages - visibleThumbnails);
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
  // Change this to your receiving FM script name:
  const ok = callFMScript("UNIV: Committ/Close Window/Exit", "");

  if (!ok) {
    return;
  }
}

// Add this function to handle image deletion
function deleteCurrentImage() {
  if (galleryData.length === 0) {
    return;
  }

  const currentItem = galleryData[currentImage];

  if (!currentItem || !currentItem.RECID) {
    return;
  }

  // Show confirmation dialog
  const serial = currentItem.title || "Unknown";
  const location = currentItem.capDesc || "Unknown location";
  //   const confirmMessage = `Are you sure you want to delete this image?\n\nUnit Serial: ${serial}\nLocation: ${location}\nRecord ID: ${currentItem.RECID}`;

  //   if (!confirm(confirmMessage)) {
  //     return;
  //   }

  try {
    // Prepare data to send to FileMaker
    const deleteData = {
      RECID: currentItem.RECID,
      title: currentItem.title || "",
      location: currentItem.capDesc || "",
      serviceId: currentItem.ServiceID || "",
      clientId: currentItem.ClientID || "",
      action: "delete",
    };

    // Call FileMaker script to delete the record
    if (window.FileMaker && typeof window.FileMaker.PerformScript === "function") {
      try {
        // Call FileMaker script to handle the deletion
        // You'll need to create this script in FileMaker
        window.FileMaker.PerformScript("Delete Image Record", JSON.stringify(deleteData));

        return;
      } catch (fmError) {
        console.error("FileMaker delete script failed:", fmError);
      }
    } else {
      // FileMaker not available - could show user message
    }
  } catch (error) {
    console.error("Delete operation failed:", error);
  }
}

// Add this function to handle image export
function exportCurrentImage() {
  if (galleryData.length === 0) {
    return;
  }

  const currentItem = galleryData[currentImage];

  if (!currentItem || !currentItem.src) {
    return;
  }

  try {
    // Generate filename from image info
    const serial = currentItem.title || "image";
    const serviceId = currentItem.ServiceID || "";

    // Create very simple filename to avoid FileMaker issues
    let filename = `${serial}`;
    if (serviceId) filename += `_${serviceId}`;
    filename += ".jpg";

    // Ultra-aggressive filename cleaning for FileMaker compatibility
    filename = filename.replace(/[^a-zA-Z0-9]/g, "_"); // Replace ALL non-alphanumeric with underscore
    filename = filename.replace(/_{2,}/g, "_"); // Replace multiple underscores with single
    filename = filename.replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
    filename = filename.replace(/_\.jpg$/, ".jpg"); // Fix underscore before extension

    // Ensure it ends with .jpg
    if (!filename.endsWith(".jpg")) {
      filename += ".jpg";
    }

    // Limit to very short length for FileMaker
    if (filename.length > 30) {
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
      filename = nameWithoutExt.substring(0, 26) + ".jpg";
    }

    // Try direct data URL download first (most compatible with FileMaker)
    if (currentItem.src.startsWith("data:")) {
      // Try to use FileMaker script for export (most reliable in FileMaker environment)
      if (window.FileMaker && typeof window.FileMaker.PerformScript === "function") {
        try {
          // Pass the image data to FileMaker for native handling
          const exportData = {
            filename: filename,
            base64Data: currentItem.src.split(",")[1], // Just the base64 part
            mimeType: currentItem.src.split(",")[0].split(":")[1].split(";")[0],
            title: currentItem.title || "",
            location: currentItem.capDesc || "",
            serviceId: currentItem.ServiceID || "",
            originalDataURL: currentItem.src,
          };

          // Call FileMaker script to handle the export
          window.FileMaker.PerformScript("Export Image to Desktop", JSON.stringify(exportData));

          return; // Exit early since FileMaker will handle it
        } catch (fmError) {
          console.error("FileMaker script failed:", fmError);
          console.log("FileMaker export script not found, showing setup instructions");
        }
      } else {
        console.log("FileMaker not available, trying browser method");
      }
    } else {
      // For regular URLs
      const link = document.createElement("a");
      link.href = currentItem.src;
      link.download = filename;
      link.setAttribute("target", "_blank");

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    console.log("Export process completed");
  } catch (error) {
    console.error("Export failed:", error);

    // Final fallback - open image in new window
    try {
      const newWindow = window.open(currentItem.src, "_blank");
      if (!newWindow) {
        console.log("Pop-up blocked or failed to open new window");
      }
    } catch (fallbackError) {
      console.error("All download methods failed:", fallbackError);
    }
  }
}

// Initialize the gallery when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Add a small delay to ensure everything is rendered
  setTimeout(() => {
    initGallery();

    // Double-check export and delete button setup
    const exportBtn = document.querySelector(".export-btn");
    const deleteBtn = document.querySelector(".delete-btn");

    if (!exportBtn) {
      // Try to find it manually
      setTimeout(() => {
        const exportBtnRetry = document.querySelector(".export-btn");
        if (exportBtnRetry) {
          exportBtnRetry.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            exportCurrentImage();
          });
        }
      }, 1000);
    }

    if (!deleteBtn) {
      // Try to find it manually
      setTimeout(() => {
        const deleteBtnRetry = document.querySelector(".delete-btn");
        if (deleteBtnRetry) {
          deleteBtnRetry.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteCurrentImage();
          });
        }
      }, 1000);
    }

    // Also retry thumbnail navigation buttons
    setTimeout(() => {
      const firstBtn = document.querySelector(".thumbnail-nav-first");
      const leftBtn = document.querySelector(".thumbnail-nav-left");
      const rightBtn = document.querySelector(".thumbnail-nav-right");
      const lastBtn = document.querySelector(".thumbnail-nav-last");

      if (firstBtn && !firstBtn.hasAttribute("data-listener-added")) {
        // Ensure button is clickable
        firstBtn.style.pointerEvents = "auto";
        firstBtn.style.zIndex = "100";

        firstBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          firstThumbnailPage();
        });
        firstBtn.setAttribute("data-listener-added", "true");
      }

      if (leftBtn && !leftBtn.hasAttribute("data-listener-added")) {
        // Ensure button is clickable
        leftBtn.style.pointerEvents = "auto";
        leftBtn.style.zIndex = "100";

        leftBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          scrollThumbnailsLeft();
        });
        leftBtn.setAttribute("data-listener-added", "true");
      }

      if (rightBtn && !rightBtn.hasAttribute("data-listener-added")) {
        // Ensure button is clickable
        rightBtn.style.pointerEvents = "auto";
        rightBtn.style.zIndex = "100";

        rightBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          scrollThumbnailsRight();
        });
        rightBtn.setAttribute("data-listener-added", "true");
      }

      if (lastBtn && !lastBtn.hasAttribute("data-listener-added")) {
        // Ensure button is clickable
        lastBtn.style.pointerEvents = "auto";
        lastBtn.style.zIndex = "100";

        lastBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          lastThumbnailPage();
        });
        lastBtn.setAttribute("data-listener-added", "true");
      }
    }, 1500);
  }, 100);
});

// Make export and delete functions available globally for testing
window.testExport = exportCurrentImage;
window.testDelete = deleteCurrentImage;

// Manual setup function for debugging
window.setupExportButton = function () {
  const btn = document.querySelector(".export-btn");

  if (btn) {
    // Remove any existing listeners
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

// Manual setup function for delete button
window.setupDeleteButton = function () {
  const btn = document.querySelector(".delete-btn");

  if (btn) {
    // Remove any existing listeners
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

// Manual thumbnail navigation testing functions
window.testThumbnailFirst = function () {
  firstThumbnailPage();
  return "First thumbnail test executed";
};

window.testThumbnailLeft = function () {
  scrollThumbnailsLeft();
  return "Left thumbnail test executed";
};

window.testThumbnailRight = function () {
  scrollThumbnailsRight();
  return "Right thumbnail test executed";
};

window.testThumbnailLast = function () {
  lastThumbnailPage();
  return "Last thumbnail test executed";
};

// Function to manually trigger button clicks
window.testButtonClicks = function () {
  const firstBtn = document.querySelector(".thumbnail-nav-first");
  const leftBtn = document.querySelector(".thumbnail-nav-left");
  const rightBtn = document.querySelector(".thumbnail-nav-right");
  const lastBtn = document.querySelector(".thumbnail-nav-last");

  console.log("Found buttons:", {
    first: !!firstBtn,
    left: !!leftBtn,
    right: !!rightBtn,
    last: !!lastBtn,
  });

  if (leftBtn) {
    leftBtn.click();
  }

  if (rightBtn) {
    rightBtn.click();
  }

  return "Manual button click tests completed";
};

// Force setup thumbnail navigation buttons
window.forceSetupThumbnailButtons = function () {
  const firstBtn = document.querySelector(".thumbnail-nav-first");
  const leftBtn = document.querySelector(".thumbnail-nav-left");
  const rightBtn = document.querySelector(".thumbnail-nav-right");
  const lastBtn = document.querySelector(".thumbnail-nav-last");

  // Remove any existing listeners and add new ones
  if (firstBtn) {
    const newFirstBtn = firstBtn.cloneNode(true);
    firstBtn.parentNode.replaceChild(newFirstBtn, firstBtn);
    newFirstBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      firstThumbnailPage();
    });
  }

  if (leftBtn) {
    const newLeftBtn = leftBtn.cloneNode(true);
    leftBtn.parentNode.replaceChild(newLeftBtn, leftBtn);
    newLeftBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollThumbnailsLeft();
    });
  }

  if (rightBtn) {
    const newRightBtn = rightBtn.cloneNode(true);
    rightBtn.parentNode.replaceChild(newRightBtn, rightBtn);
    newRightBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollThumbnailsRight();
    });
  }

  if (lastBtn) {
    const newLastBtn = lastBtn.cloneNode(true);
    lastBtn.parentNode.replaceChild(newLastBtn, lastBtn);
    newLastBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      lastThumbnailPage();
    });
  }

  return "Force thumbnail button setup completed";
};
