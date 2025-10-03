# ImageGallery — index.js and script.js Documentation

This guide explains how the ImageGallery code works, what each function does, the arguments it expects, when and where functions are triggered, and the order of execution. It’s aimed at beginners to help you learn and modify the gallery confidently.

Files covered:

- `src/index.js` — receives data from FileMaker (or a demo), maps it to gallery items, and hands it to the gallery
- `src/script.js` — renders the gallery UI and handles navigation, export, delete, and keyboard interactions

## What this gallery does

It displays a list of images with thumbnails and a main image. It shows basic info (Unit Serial, Unit Location, RECID, ClientID), supports navigation (clicks, arrows, keyboard), a context menu (download/delete), and provides buttons to export or delete the current image via FileMaker scripts.

## Key data structures and state

- galleryData: array of items consumed by the UI. Each item shape (after mapping):

  - src: string — main image URL or data URI
  - thumb: string — thumbnail URL (same as `src` if no separate thumb)
  - type: string — "image"
  - title: string — Unit Serial Number
  - capDesc: string — Unit Location (caption/description)
  - ServiceID: string
  - RECID: string
  - ClientID: string

- Internal state (in `src/script.js`):

  - currentImage: number — index of the active image (0-based)
  - totalImages: number — galleryData.length
  - visibleThumbnails: number — how many thumbnails are shown at once (default 8)
  - thumbnailScrollPosition: number — paging index for thumbnail window
  - lastImageIndex: number — used to select slide animation direction

- Common DOM elements:
  - `#main-image`: the main displayed image element
  - `.thumbnails`: container for the thumbnail grid
  - Navigation buttons: `.nav-arrow-left`, `.nav-arrow-right`
  - Thumbnail paging buttons: `.thumbnail-nav-first`, `.thumbnail-nav-left`, `.thumbnail-nav-right`, `.thumbnail-nav-last`
  - Action buttons: `.export-btn`, `.delete-btn`, `.close-btn`
  - Info slots: `.info-item` (4 of them)
  - Optional: `#errorMessage` for "No images exist!"

## Execution order at a glance

1. Page loads → `DOMContentLoaded` listener runs (in `script.js`) and calls `initGallery()` after a short timeout.
2. `initGallery()` attaches event listeners. If `galleryData` already has items, it renders the UI.
3. FileMaker calls `window.loadWidget(json)` (in `index.js`) at any time to supply images.
4. `loadWidget` parses JSON, maps rows via `mapRowToGalleryItem`, then calls `setGalleryData(items)`.
5. `setGalleryData` updates `galleryData` and re-renders the entire gallery (thumbnails, main image, counters, info, and nav state).
6. User interactions (clicks/keys/context menu) call navigation, export, or delete functions.

## Data input from FileMaker (src/index.js)

### mapRowToGalleryItem(row)

- Purpose: Convert a FileMaker row to the gallery item format.
- Input: `row` object (expected keys commonly include: `image` base64 JPEG string OR `src` URL, `UnitSerial`, `UnitLocation`, `ServiceID`, `RECID`, `ClientID`).
- Output: `{ src, thumb, type: "image", title, capDesc, ServiceID, RECID, ClientID }`
- Notes: If `row.image` exists, it builds a `data:image/jpeg;base64,` URL; otherwise it uses `row.src`.

### window.loadWidget(json)

- Purpose: Entry point called by FileMaker. Receives JSON, validates it, maps to items, and loads the gallery.
- Input: `json` (string) — expected shape: `{ "data": [ { ...row... }, ... ] }`
- Output: none (effects: updates the page or shows an error)
- Behavior:
  1. Parse JSON; if invalid, log an error and return.
  2. Ensure `obj.data` is an array; otherwise warn and return.
  3. If `data` is empty: set `#errorMessage` to "No images exist!" and return.
  4. Map rows with `mapRowToGalleryItem` and call `setGalleryData(items)`.

## Gallery UI and behavior (src/script.js)

### setGalleryData(data)

- Purpose: Set `galleryData` and fully re-render the gallery UI.
- Input: `data: Array<GalleryItem>` (must be a non-empty array)
- Output: none (effects: updates UI)
- Steps:
  - Sets `galleryData`, `totalImages`, resets `currentImage`, `thumbnailScrollPosition`, `lastImageIndex`.
  - Calls `generateThumbnails()`, `updateImageCounter()`, `updateMainImageBackground()`, `updateImageInfo()`, `updateThumbnailNavButtons()`, `updateThumbnailDisplay()`.

### initGallery()

- Purpose: Initialize event listeners and, if data exists, render the UI.
- Input/Output: none
- Trigger: Called on `DOMContentLoaded` (with a small delay).

### setupEventListeners()

- Purpose: Wire up all UI interactions (buttons, keyboard, context menu, nav arrows, and thumbnail paging).
- Input/Output: none
- Triggers:
  - Export button `.export-btn` → `exportCurrentImage()`
  - Delete button `.delete-btn` → `deleteCurrentImage()`
  - Close button `.close-btn` → `closeGallery()`
  - Nav arrows `.nav-arrow-left` → `previousImage()`, `.nav-arrow-right` → `nextImage()`
  - Thumbnail nav buttons → `firstImage()`, `previousImage()`, `nextImage()`, `lastImage()`
  - Right-click on `#main-image` → shows context menu with Download/Delete
  - Keyboard shortcuts:
    - ArrowLeft/ArrowRight → previous/next image
    - Home/End → first/last image
    - Escape → closeGallery
    - Ctrl/Cmd+S → exportCurrentImage
    - Delete/Backspace → deleteCurrentImage

### Navigation and paging

- `firstImage()`: jump to index 0; if already at 0, do nothing.
- `previousImage()`: decrement `currentImage` if > 0.
- `nextImage()`: increment `currentImage` if < `totalImages - 1`.
- `lastImage()`: jump to `totalImages - 1`.
- `goToImage(index: number)`: set `currentImage = index`.
- All of the above call `updateGallery()` after changing `currentImage`.

### updateGallery()

- Purpose: Update all dependent UI after the current image changes.
- Calls: `updateImageCounter()`, `updateActiveThumbnail()`, `updateImageInfo()`, `updateMainImageBackground()`, `updateThumbnailNavButtons()`, `ensureActiveThumbnailVisible()`.

### updateMainImageBackground()

- Purpose: Swap the main image and animate slide in/out based on navigation direction.
- Input/Output: none (uses state and `#main-image` element)
- Behavior:
  - If no data: clears `#main-image` and returns.
  - Determines direction using `currentImage` vs `lastImageIndex` and toggles CSS classes: `slide-out-left`/`slide-out-right` then `slide-in-right`/`slide-in-left`.
  - Updates `#main-image.src` to the current item’s image and schedules cleanup of animation classes; sets `lastImageIndex = currentImage`.

### updateImageCounter()

- Purpose: Show `current/total` in `.image-counter`.
- Input/Output: none

### updateActiveThumbnail()

- Purpose: Toggle `active` class on the current thumbnail.
- Input/Output: none

### updateImageInfo()

- Purpose: Fill `.info-item` slots with item details.
- Input/Output: none
- Mapping:
  - infoItems[0] → Unit Serial Number (`title`)
  - infoItems[1] → Unit Location (`capDesc`)
  - infoItems[2] → REC ID (`ServiceID` in code comment but text shows REC ID)
  - infoItems[3] → Client ID (`ClientID`)

### generateThumbnails()

- Purpose: Build `.thumbnails` from `galleryData`.
- Input/Output: none
- Behavior: Creates a `.thumbnail` element per item; if item has an image, it inserts an `<img>` tag for better aspect handling. Clicking a thumbnail calls `goToImage(i)`.

### updateThumbnailDisplay()

- Purpose: Only show the current window (page) of thumbnails and hide the rest.
- Input/Output: none
- Works with: `visibleThumbnails` and `thumbnailScrollPosition`. Calls `updateThumbnailNavButtons()`.

### updateThumbnailNavButtons()

- Purpose: Enable/disable the four thumbnail nav buttons based on position.
- Input/Output: none

### scrollThumbnailsLeft() / scrollThumbnailsRight()

- Purpose: Page the thumbnail window left/right by `visibleThumbnails`.
- Input/Output: none

### ensureActiveThumbnailVisible()

- Purpose: Adjust `thumbnailScrollPosition` so `currentImage` is within the visible window.
- Input/Output: none

### setVisibleThumbnails(count)

- Purpose: Change how many thumbnails are visible at once and reset paging.
- Input: `count: number`
- Output: none

## Actions to FileMaker (export, delete, close)

### callFMScript(scriptName, param)

- Purpose: Try calling a FileMaker script either through `window.FileMaker.PerformScript` or a legacy `fmp://` URL.
- Input: `scriptName: string`, `param: string`
- Output: `boolean` — true if an attempt was made to call FM

### closeGallery()

- Purpose: Request FileMaker to commit/close the window.
- Calls: `callFMScript("UNIV: Committ/Close Window/Exit", "")`

### deleteCurrentImage()

- Purpose: Ask FileMaker to delete the current image’s record.
- Preconditions: `galleryData.length > 0` and current item has `RECID`.
- Payload to FileMaker (script name: "Delete Image Record"):

```json
{
  "RECID": "<record id>",
  "title": "<Unit Serial>",
  "location": "<Unit Location>",
  "serviceId": "<ServiceID>",
  "clientId": "<ClientID>",
  "action": "delete"
}
```

### exportCurrentImage()

- Purpose: Download the current image. If running in FileMaker, prefer FM script to export to desktop; otherwise try browser download.
- Filename generation: based on `title` and `ServiceID`, aggressively cleaned for FileMaker compatibility and limited to ~30 chars.
- FM script (preferred for data URLs): "Export Image to Desktop"
- FM payload:

```json
{
  "filename": "<cleaned-name>.jpg",
  "base64Data": "<base64-only>",
  "mimeType": "image/jpeg",
  "title": "<Unit Serial>",
  "location": "<Unit Location>",
  "serviceId": "<ServiceID>",
  "originalDataURL": "data:image/jpeg;base64,..."
}
```

## Global testing helpers (for debugging)

- `window.testExport = exportCurrentImage`
- `window.testDelete = deleteCurrentImage`
- `window.setupExportButton()` — rebinds export button click
- `window.setupDeleteButton()` — rebinds delete button click
- Thumbnail tests:
  - `window.testThumbnailFirst()` → first thumbnail page
  - `window.testThumbnailLeft()` → page left
  - `window.testThumbnailRight()` → page right
  - `window.testThumbnailLast()` → last thumbnail page
- `window.testButtonClicks()` → clicks left/right nav buttons if found
- `window.forceSetupThumbnailButtons()` → forcefully rebinds thumbnail nav buttons

## Event wiring summary (what triggers what)

- DOMContentLoaded → `initGallery()`
- Buttons:
  - `.export-btn` click → `exportCurrentImage()`
  - `.delete-btn` click → `deleteCurrentImage()`
  - `.close-btn` click → `closeGallery()`
  - `.nav-arrow-left` click → `previousImage()`
  - `.nav-arrow-right` click → `nextImage()`
  - `.thumbnail-nav-first` click → `firstImage()`
  - `.thumbnail-nav-left` click → `previousImage()`
  - `.thumbnail-nav-right` click → `nextImage()`
  - `.thumbnail-nav-last` click → `lastImage()`
- Right-click on `#main-image` → context menu with Download/Delete
- Keyboard:
  - ArrowLeft/ArrowRight → previous/next image
  - Home/End → first/last image
  - Escape → closeGallery
  - Ctrl/Cmd+S → exportCurrentImage
  - Delete/Backspace → deleteCurrentImage
- Thumbnails: clicking a `.thumbnail` → `goToImage(i)`

## Arguments cheat sheet (quick reference)

- `mapRowToGalleryItem(row: object) => GalleryItem`
- `window.loadWidget(json: string)`
- `setGalleryData(data: GalleryItem[])`
- `initGallery()`
- `setupEventListeners()`
- Navigation: `firstImage()`, `previousImage()`, `nextImage()`, `lastImage()`, `goToImage(index: number)`
- Rendering updates: `updateGallery()`, `updateMainImageBackground()`, `updateImageCounter()`, `updateActiveThumbnail()`, `updateImageInfo()`, `generateThumbnails()`, `updateThumbnailDisplay()`, `updateThumbnailNavButtons()`
- Thumbnails: `scrollThumbnailsLeft()`, `scrollThumbnailsRight()`, `ensureActiveThumbnailVisible()`, `setVisibleThumbnails(count: number)`
- FileMaker interaction: `callFMScript(scriptName: string, param: string) => boolean`, `closeGallery()`
- Actions: `deleteCurrentImage()`, `exportCurrentImage()`
- Debug globals: `window.testExport`, `window.testDelete`, `window.setupExportButton()`, `window.setupDeleteButton()`, `window.testThumbnailFirst()`, `window.testThumbnailLeft()`, `window.testThumbnailRight()`, `window.testThumbnailLast()`, `window.testButtonClicks()`, `window.forceSetupThumbnailButtons()`

## Common edge cases and notes

- If `window.loadWidget` receives empty data, the UI shows "No images exist!" and doesn’t render the gallery.
- Some items may lack a separate thumbnail; the code uses `src` for both `src` and `thumb` in that case.
- Export and delete prefer FileMaker integration when running in a Web Viewer; browser fallbacks are provided but may be limited.
- The animation uses timed class toggles; ensure related CSS classes exist: `slide-out-left`, `slide-out-right`, `slide-in-left`, `slide-in-right`.
- Thumbnail navigation only shows a window of `visibleThumbnails`; paging moves this window.

## Quick walkthrough (user perspective)

1. FileMaker calls `loadWidget` with records → images appear.
2. User clicks thumbnails or arrows to navigate.
3. User right-clicks to download/delete or uses buttons/keyboard.
4. Export/Delete routes through FileMaker when possible for reliability.

---

Open `src/index.js` and `src/script.js` alongside this file to follow along and customize behavior. If you’d like inline comments added in the code for learning, I can annotate key sections next.
