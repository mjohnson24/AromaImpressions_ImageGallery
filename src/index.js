import { setGalleryData } from "./script.js";
// demo is optional local data for testing — use it when FileMaker isn't available
// import demo from "./demo.js";

// Map a FileMaker row to the gallery item format expected by the gallery
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

// Expose the global function FileMaker will call. It accepts a JSON string.
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
