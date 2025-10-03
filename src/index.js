// ImageGallery data entrypoint (runs inside FileMaker Web Viewer)
// --------------------------------------------------------------
// This file receives JSON from FileMaker, converts records into a shape the
// gallery understands, and hands the data to the UI logic in script.js.
// Nothing here renders UI; it only maps and forwards data.

import { setGalleryData } from "./script.js";
// demo is optional local data for testing — use it when FileMaker isn't available
// import demo from "./demo.js";

/**
 * Map a FileMaker row into the gallery item format expected by the UI.
 *
 * Input row (typical keys):
 * - image: string (base64 JPEG, no data URI prefix) — preferred source
 * - src: string (URL/data URI) — used if image isn't present
 * - UnitSerial: string -> becomes title (Unit Serial Number)
 * - UnitLocation: string -> becomes capDesc (displayed as Unit Location)
 * - ServiceID, RECID, ClientID: strings passed through
 *
 * Returns: GalleryItem
 * {
 *   src: string,
 *   thumb: string,
 *   type: "image",
 *   title: string,
 *   capDesc: string,
 *   ServiceID: string,
 *   RECID: string,
 *   ClientID: string
 * }
 */
function mapRowToGalleryItem(row) {
  //   console.log(row);
  // Expecting `image` to be a base64 JPEG string (as in current code)
  const base64 = row.image || "";
  const src = base64 ? `data:image/jpeg;base64,${base64}` : row.src || "";
  return {
    src,
    thumb: src, // we don't have a separate thumb; use same data URI
    type: "image",
    title: row.UnitSerial || "",
    capDesc: row.UnitLocation || "",
    ServiceID: row.ServiceID || "",
    RECID: row.RECID || "",
    ClientID: row.ClientID || "",
  };
}

/**
 * Global function called by FileMaker to load gallery data.
 *
 * @param {string} json - JSON string shaped like { data: [ {row}, ... ] }
 * Side effects: Updates the page error area when no data; otherwise maps rows
 *               and forwards to setGalleryData() which renders the UI.
 */
window.loadWidget = function (json) {
  //   console.log("loadJSON", json);
  let obj;
  try {
    obj = JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse JSON in loadWidget:", e);
    return;
  }

  if (!obj || !Array.isArray(obj.data)) {
    console.warn("loadWidget received unexpected payload", obj);
    return;
  }

  // Check if no data/images came back and display error
  const data = obj.data;
  if (!data || data.length === 0) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerHTML = "<h2>No images exist!</h2>";
    return; // Exit early if no data
  }
  // Map all rows into gallery-ready items
  const items = data.map(mapRowToGalleryItem);
  setGalleryData(items);
};

// For local development, populate the gallery with demo data if available
// if (typeof demo !== "undefined" && Array.isArray(demo) && demo.length > 0) {
//   setGalleryData(demo);
// }
