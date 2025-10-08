import { currentImage, galleryData } from "./state.js";

// Known FileMaker script names used by this widget
const SCRIPT_EXPORT_DATAURL = "Export Image to Desktop";
const SCRIPT_DELETE_IMAGE = "Delete Image Record";
const SCRIPT_CLOSE = "UNIV: Committ/Close Window/Exit";

// Script resolution mode: 'permissive' (default) uses default names when not registered,
// 'strict' requires explicit registration to call FM scripts.
function getScriptMode() {
  const m = (window.fmScriptMode || "permissive").toLowerCase();
  return ["strict", "permissive", "browser"].includes(m) ? m : "permissive";
}

function isStrictMode() {
  return getScriptMode() === "strict";
}

function isBrowserMode() {
  return getScriptMode() === "browser";
}

function hasFMPerformScript() {
  return !!(window.FileMaker && typeof window.FileMaker.PerformScript === "function");
}

function getRegisteredScriptName(scriptName) {
  // FileMaker cannot be queried for scripts; require host to register availability
  const map = window.fmScripts || {};
  const hasEntry = Object.prototype.hasOwnProperty.call(map, scriptName);
  if (hasEntry) {
    const value = map[scriptName];
    if (typeof value === "string") return value; // alias mapping
    if (value === true) return scriptName; // use provided name as-is
    return null; // explicitly disabled (falsey other than true/string)
  }
  // If not registered, allow default script name in permissive mode
  return isStrictMode() ? null : scriptName;
}

function hasFMScript(scriptName) {
  return !!getRegisteredScriptName(scriptName);
}

// Allow FileMaker to declare which scripts exist to avoid user-facing errors
export function registerFMScripts(scriptsMap) {
  try {
    if (typeof scriptsMap === "string") {
      try {
        scriptsMap = JSON.parse(scriptsMap);
      } catch (e) {
        console.error("registerFMScripts: invalid JSON string provided", e);
        scriptsMap = {};
      }
    }
    window.fmScripts = {
      ...(window.fmScripts || {}),
      ...(scriptsMap || {}),
    };
  } catch (e) {
    console.error("registerFMScripts failed:", e);
  }
}

export function setFMScriptMode(mode) {
  if (["strict", "permissive", "browser"].includes(mode)) {
    window.fmScriptMode = mode;
  } else {
    console.warn("setFMScriptMode: invalid mode, expected 'strict', 'permissive', or 'browser'");
  }
}

function callFMScript(scriptName, param) {
  try {
    if (window.FileMaker && typeof window.FileMaker.PerformScript === "function") {
      window.FileMaker.PerformScript(scriptName, param);
      return true;
    }
    // Legacy fallback: fmp URL
    const url = "fmp://$/" + encodeURIComponent(scriptName) + "?script.param=" + encodeURIComponent(param);
    window.location.href = url;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function closeGallery() {
  if (hasFMPerformScript() && hasFMScript(SCRIPT_CLOSE)) {
    const name = getRegisteredScriptName(SCRIPT_CLOSE);
    callFMScript(name, "");
  } else {
    // No script call if unresolved in strict mode; otherwise nothing to do
    if (isStrictMode()) console.warn("Close script not registered; skipping PerformScript");
  }
}

export function deleteCurrentImage() {
  if (galleryData.length === 0) return;
  const currentItem = galleryData[currentImage];
  if (!currentItem || !currentItem.RECID) return;
  try {
    const deleteData = {
      RECID: currentItem.RECID,
      title: currentItem.title || "",
      location: currentItem.capDesc || "",
      serviceId: currentItem.ServiceID || "",
      clientId: currentItem.ClientID || "",
      action: "delete",
    };
    if (hasFMPerformScript() && hasFMScript(SCRIPT_DELETE_IMAGE)) {
      try {
        const name = getRegisteredScriptName(SCRIPT_DELETE_IMAGE);
        window.FileMaker.PerformScript(name, JSON.stringify(deleteData));
        return;
      } catch (fmError) {
        console.error("FileMaker delete script failed:", fmError);
      }
    } else if (isStrictMode()) {
      console.warn("Delete script not registered; skipping PerformScript");
    }
  } catch (error) {
    console.error("Delete operation failed:", error);
  }
}

function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    // Some web views ignore download; click anyway
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error("Blob download failed:", e);
  }
}

function dataUrlToBlob(dataUrl) {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const bstr = atob(arr[1] || "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Failed to convert data URL to Blob:", e);
    return null;
  }
}

function buildFMExportPayload(dataUrl, filename) {
  const { mime, ext } = getMimeAndExtFromSrc(dataUrl);
  const commaIdx = dataUrl.indexOf(",");
  const base64Raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "";
  const base64 = base64Raw.replace(/\s+/g, "");
  const approxBytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  // Include both 'base64' and 'base64Data' for FM script compatibility
  const compact = { filename, mime, ext, base64, base64Data: base64, sizeBytes: approxBytes };
  const tentative = JSON.stringify(compact);
  const payloadObj = tentative.length < 120000 ? { ...compact, dataUrl } : compact;
  return { payloadObj, approxBytes };
}

export function exportCurrentImage() {
  if (galleryData.length === 0) return;
  const currentItem = galleryData[currentImage];
  if (!currentItem || !currentItem.src) return;

  try {
    const serial = currentItem.title || "image";
    const serviceId = currentItem.ServiceID || "";

    // Determine mime and extension from src
    const { mime, ext } = getMimeAndExtFromSrc(currentItem.src);

    // Build a clean base name without any existing extension
    let base = `${serial}${serviceId ? `_${serviceId}` : ""}`;
    base = stripKnownImageExtension(base);
    base = sanitizeBaseName(base);
    if (!base) base = "image";

    // Build a safe filename with correct extension and max length
    let filename = buildSafeFilename(base, ext);

    if (currentItem.src.startsWith("data:")) {
      if (isBrowserMode()) {
        // Force browser download path (useful while FM script is being fixed)
        const blob = dataUrlToBlob(currentItem.src);
        if (blob) {
          downloadBlob(blob, filename);
          return;
        }
        // Last resort: open data URL in a new tab
        try {
          const nw = window.open(currentItem.src, "_blank");
          if (!nw) console.warn("Popup blocked for browser-mode data URL export");
        } catch {}
        return;
      }
      // FileMaker script expectations:
      // - Receive JSON with { filename, mime, ext, base64, sizeBytes, dataUrl? }
      // - Prefer 'base64' for writing binary: decode and write to 'filename'
      // - Use 'mime' and/or 'ext' for correct file type; ignore 'dataUrl' if payload too large
      // - If implementing fallback, 'dataUrl' can be decoded by stripping the prefix after the first comma
      if (hasFMPerformScript() && hasFMScript(SCRIPT_EXPORT_DATAURL)) {
        try {
          // Build FM-friendly payload
          const { payloadObj, approxBytes } = buildFMExportPayload(currentItem.src, filename);
          if (approxBytes > 7000000) {
            console.warn("Large image detected (>", approxBytes, ") bytes). Consider browser mode or chunking.");
          }
          const payload = JSON.stringify(payloadObj);
          const name = getRegisteredScriptName(SCRIPT_EXPORT_DATAURL);
          window.FileMaker.PerformScript(name, payload);
          return;
        } catch (err) {
          console.warn("FileMaker export failed, will try browser fallback:", err);
        }
      } else if (isStrictMode()) {
        console.warn("Export script not registered; using browser fallback");
      }
      // Robust browser fallback using Blob to avoid download attribute limitations
      const blob = dataUrlToBlob(currentItem.src);
      if (blob) {
        downloadBlob(blob, filename);
        return;
      }
      // Last-ditch attempt: open in a new tab
      try {
        const newWindow = window.open(currentItem.src, "_blank");
        if (!newWindow) console.warn("Popup blocked for data URL export fallback");
      } catch (e) {
        console.error("Failed to open data URL in new tab:", e);
      }
    } else {
      // For regular URLs, prefer opening in new tab if download is blocked
      try {
        const link = document.createElement("a");
        link.href = currentItem.src;
        link.download = filename;
        link.target = "_blank"; // Web Viewer often ignores download; _blank is more reliable
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn("Direct link click failed, trying fetch+blob:", e);
        try {
          fetch(currentItem.src, { mode: "no-cors" })
            .then((res) => res.blob?.() ?? Promise.reject(new Error("blob not available")))
            .then((blob) => {
              const guessedExt = normalizeExtFromMime(blob.type) || ext;
              const finalName = buildSafeFilename(base, guessedExt);
              downloadBlob(blob, finalName);
            })
            .catch((err) => {
              console.error("Fetch+blob fallback failed:", err);
              const newWindow = window.open(currentItem.src, "_blank");
              if (!newWindow) console.warn("Popup blocked for URL export fallback");
            });
        } catch (err) {
          console.error("All URL export fallbacks failed:", err);
        }
      }
    }
    console.log("Export process completed");
  } catch (error) {
    console.error("Export failed:", error);
    try {
      const newWindow = window.open(currentItem.src, "_blank");
      if (!newWindow) {
        console.warn("Popup blocked for export fallback");
      }
    } catch (fallbackError) {
      console.error("All download methods failed:", fallbackError);
    }
  }
}

// Expose helpers globally so FileMaker can call them
if (typeof window !== "undefined") {
  if (!window.registerFMScripts) window.registerFMScripts = registerFMScripts;
  if (!window.setFMScriptMode) window.setFMScriptMode = setFMScriptMode;
  // Debug: build payload and test minimal export to FM
  if (!window.__buildExportPayload) {
    window.__buildExportPayload = () => {
      try {
        const item = galleryData[currentImage];
        if (!item || !item.src) return null;
        const { payloadObj, approxBytes } = buildFMExportPayload(item.src, "debug_test." + (getMimeAndExtFromSrc(item.src).ext || "jpg"));
        return { sizeChars: JSON.stringify(payloadObj).length, approxBytes, payload: payloadObj };
      } catch (e) {
        return { error: String(e) };
      }
    };
  }
  if (!window.__testTinyPngExport) {
    window.__testTinyPngExport = () => {
      try {
        // 1x1 transparent PNG
        const tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH+AIJCQO1TwAAAABJRU5ErkJggg==";
        const { payloadObj } = buildFMExportPayload(tiny, "tiny_test.png");
        const name = getRegisteredScriptName(SCRIPT_EXPORT_DATAURL);
        if (hasFMPerformScript() && hasFMScript(SCRIPT_EXPORT_DATAURL)) {
          window.FileMaker.PerformScript(name, JSON.stringify(payloadObj));
          return "Sent tiny PNG to FileMaker export script";
        }
        return "FM script not available";
      } catch (e) {
        return String(e);
      }
    };
  }
}

// ---------- helpers for filename/mime/ext ----------
function stripKnownImageExtension(name) {
  return name.replace(/\.(jpe?g|png|gif|webp|tiff?|bmp|svg|heic|heif)$/i, "");
}

function sanitizeBaseName(name) {
  return name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeExtFromMime(mime) {
  if (!mime) return null;
  const m = mime.toLowerCase();
  if (m.includes("jpeg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("gif")) return "gif";
  if (m.includes("webp")) return "webp";
  if (m.includes("tif")) return "tif";
  if (m.includes("bmp")) return "bmp";
  if (m.includes("svg")) return "svg";
  if (m.includes("heic") || m.includes("heif")) return "heic";
  return null;
}

function normalizeExtRaw(ext) {
  if (!ext) return null;
  const e = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["jpeg", "jpg"].includes(e)) return "jpg";
  if (["png", "gif", "webp", "tif", "tiff", "bmp", "svg", "heic", "heif"].includes(e)) return e === "tiff" ? "tif" : e === "heif" ? "heic" : e;
  return null;
}

function getMimeAndExtFromSrc(src) {
  try {
    if (src.startsWith("data:")) {
      // data:[<mediatype>][;base64],<data>
      const head = src.substring(5, src.indexOf(","));
      const mime = head.split(";")[0] || "";
      const ext = normalizeExtFromMime(mime) || "jpg";
      return { mime: mime || "image/jpeg", ext };
    }
    // URL path heuristic
    const clean = src.split(/[?#]/)[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    const extGuess = normalizeExtRaw(match ? match[1] : "");
    const ext = extGuess || "jpg";
    const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : ext === "tif" ? "image/tiff" : ext === "bmp" ? "image/bmp" : ext === "svg" ? "image/svg+xml" : ext === "heic" ? "image/heic" : "image/jpeg";
    return { mime, ext };
  } catch {
    return { mime: "image/jpeg", ext: "jpg" };
  }
}

function buildSafeFilename(base, ext) {
  // Enforce short total length for FileMaker compatibility (<= 30 chars)
  const maxTotal = 30;
  const dotAndExt = 1 + ext.length;
  const maxBase = Math.max(1, maxTotal - dotAndExt);
  let safeBase = base.length > maxBase ? base.substring(0, maxBase) : base;
  // Clean up any trailing underscores created by truncation
  safeBase = safeBase.replace(/_+$/g, "");
  if (!safeBase) safeBase = "image";
  return `${safeBase}.${ext}`;
}
