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
  // Prefer explicit MIME/type fields when provided by FileMaker
  const base64 = row.image || "";
  const mimeFromRow = row.mime || row.mimeType || row.MIMEType || row.contentType || row.ContentType || null;
  const extFromRow = row.ext || row.Ext || row.extension || row.Extension || row.fileExtension || row.FileExtension || row.fileType || row.FileType || row.imageType || row.ImageType || null;
  const fileNameFromRow = row.fileName || row.FileName || row.filename || row.Filename || row.name || row.Name || null;

  // Helper to normalize extension to MIME and vice versa
  const extToMime = (ext) => {
    if (!ext) return null;
    const e = String(ext).toLowerCase();
    if (["jpg", "jpeg"].includes(e)) return "image/jpeg";
    if (e === "png") return "image/png";
    if (e === "gif") return "image/gif";
    if (e === "webp") return "image/webp";
    if (["tif", "tiff"].includes(e)) return "image/tiff";
    if (e === "bmp") return "image/bmp";
    if (e === "svg") return "image/svg+xml";
    if (e === "heic" || e === "heif") return "image/heic";
    return null;
  };

  const guessFromSrcUrl = (url) => {
    if (!url) return { mime: null };
    const clean = url.split(/[?#]/)[0];
    const m = clean.match(/\.([a-zA-Z0-9]+)$/);
    const ext = m ? m[1] : null;
    return { mime: extToMime(ext) };
  };

  // Sniff common image formats from the beginning of the base64 if needed
  const sniffMimeFromBase64 = (b64) => {
    try {
      if (!b64) return null;
      const bin = atob(b64.slice(0, 64)); // decode a small chunk
      const bytes = Array.from(bin).map((c) => c.charCodeAt(0));
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
        return "image/png";
      }
      // JPEG signature: FF D8 FF
      if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
      }
      // GIF: "GIF8"
      if (bin.startsWith("GIF8")) return "image/gif";
      // WebP: "RIFF"...."WEBP"
      if (bin.startsWith("RIFF") && bin.slice(8, 12) === "WEBP") return "image/webp";
      // BMP: "BM"
      if (bin.startsWith("BM")) return "image/bmp";
      // TIFF: II*\x00 or MM\x00*
      if ((bin[0] === "I" && bin[1] === "I" && bin.charCodeAt(2) === 0x2a && bin.charCodeAt(3) === 0x00) || (bin[0] === "M" && bin[1] === "M" && bin.charCodeAt(2) === 0x00 && bin.charCodeAt(3) === 0x2a)) {
        return "image/tiff";
      }
      // HEIC/HEIF: ftypheic/heif/mif1/msf1
      if (bin.slice(4, 8) === "ftyp") {
        const brand = bin.slice(8, 12);
        if (["heic", "heif", "mif1", "msf1", "heix", "hevc"].includes(brand)) return "image/heic";
      }
      return null;
    } catch {
      return null;
    }
  };

  // If no explicit extension field, try deriving from a provided file name
  const extFromFileName = (() => {
    if (!fileNameFromRow || typeof fileNameFromRow !== "string") return null;
    const clean = fileNameFromRow.trim();
    const m = clean.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1] : null;
  })();

  let mime = mimeFromRow || extToMime(extFromRow) || extToMime(extFromFileName) || sniffMimeFromBase64(base64) || guessFromSrcUrl(row.src).mime || "image/jpeg";
  const src = base64 ? `data:${mime};base64,${base64}` : row.src || "";

  return {
    src,
    thumb: src, // no separate thumb; reuse src
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
