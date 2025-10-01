# Aroma Impressions Image Gallery

A responsive image gallery web component designed for integration with FileMaker Pro. Features smooth animations, thumbnail navigation, and keyboard controls.

## Features

- **Responsive Design**: Adapts to different screen sizes and orientations
- **Smooth Animations**: Slide transitions between images with directional awareness
- **Thumbnail Navigation**: Scrollable thumbnail grid with navigation controls
- **Keyboard Support**: Arrow keys for navigation, Escape to close
- **FileMaker Integration**: Direct integration with FileMaker Pro via web viewer
- **Error Handling**: Graceful handling of missing images or data
- **Base64 Image Support**: Displays images from FileMaker container fields

## Project Structure

```
AromaImpressionsImages2/
├── ImageGallery/
│   ├── src/
│   │   ├── index.js          # Main entry point and FileMaker integration
│   │   ├── script.js         # Gallery functionality and UI logic
│   │   ├── demo.js           # Demo data for local testing
│   │   └── styles.css        # Gallery styling and animations
│   └── index.html            # Main HTML file
└── README.md
```

## Usage

### FileMaker Integration

The gallery expects FileMaker to call the global `loadWidget` function with JSON data:

```javascript
window.loadWidget(jsonString);
```

**Expected JSON Format:**

```json
{
  "data": [
    {
      "image": "base64-encoded-jpeg-string",
      "UnitSerial": "Serial Number",
      "UnitLocation": "Location Description",
      "ServiceID": "12345"
    }
  ]
}
```

### Local Development

For testing without FileMaker, uncomment the demo data import in `index.js`:

```javascript
import demo from "./demo.js";
// ... at the bottom of the file:
if (typeof demo !== "undefined" && Array.isArray(demo) && demo.length > 0) {
  setGalleryData(demo);
}
```

## Gallery Controls

- **Navigation Arrows**: Click left/right arrows to navigate between images
- **Thumbnails**: Click any thumbnail to jump to that image
- **Thumbnail Navigation**: Use first/previous/next/last buttons to scroll through thumbnails
- **Keyboard**:
  - `←/→` Arrow keys to navigate images
  - `Home/End` to go to first/last image
  - `Escape` to close gallery
- **Close Button**: X button in top-right corner

## Data Mapping

The gallery maps FileMaker data fields as follows:

| FileMaker Field | Gallery Property  | Display Location        |
| --------------- | ----------------- | ----------------------- |
| `image`         | Base64 image data | Main image display      |
| `UnitSerial`    | `title`           | Unit Serial Number info |
| `UnitLocation`  | `capDesc`         | Unit Location info      |
| `ServiceID`     | `ServiceID`       | REC ID info             |

## Error Handling

- **No Data**: Displays "No images exist!" message when no data is provided
- **Missing Images**: Shows placeholder for items without image data
- **FileMaker Connection**: Alerts user if FileMaker script calls fail

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- Tested in Safari, Chrome, and Firefox

## Development

To modify the gallery:

1. **Styling**: Edit `styles.css` for visual changes
2. **Functionality**: Modify `script.js` for behavior changes
3. **FileMaker Integration**: Update `index.js` for data handling
4. **Testing**: Use `demo.js` for local development

## FileMaker Script Integration

The gallery calls back to FileMaker using:

```javascript
callFMScript("UNIV: Committ/Close Window/Exit", "");
```

Ensure your FileMaker database has this script or update the script name in the `setupEventListeners` function.

## Customization

### Thumbnail Count

Modify `visibleThumbnails` in `script.js` to change how many thumbnails show at once.

### Animation Speed

Adjust timeout values in `updateMainImageBackground()` to change animation speed.

### Styling

Update CSS custom properties in `styles.css` for colors, fonts, and spacing.
