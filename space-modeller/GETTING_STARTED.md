# Getting Started - IFC Viewer

Quick start guide to get the IFC viewer up and running in minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18 or higher** installed
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Edge, or Safari)
- *(Optional)* An IFC file to test with

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd space-modeller
npm install
```

This will install all required dependencies including Three.js, @thatopen/components, and Angular.

### 2. Start Development Server

```bash
npm start
```

The application will open automatically at `http://localhost:4200/`.

### 3. Load an IFC File

1. Click the **"Import IFC"** button in the toolbar
2. Select a `.ifc` file from your computer
3. Watch the loading progress in the browser console
4. The model will appear in the 3D viewport

### 4. Navigate the 3D View

- **Rotate**: Left-click and drag
- **Pan**: Right-click and drag (or Shift + left-click)
- **Zoom**: Mouse wheel or pinch gesture

### 5. Export as Fragment

After loading a model:
1. Click **"Download .frag"** button
2. The model will be saved as a `.frag` file
3. This format is faster to load than IFC

## Where to Get Test IFC Files

If you don't have an IFC file, you can download free samples:

1. **buildingSMART IFC Examples**
   - https://www.buildingsmart.org/sample-test-files/
   - Official sample files from buildingSMART

2. **BIMData Free Models**
   - https://www.bimdata.io/en/p/bim-viewer
   - Various sample IFC files

3. **Open IFC Model Repository**
   - https://github.com/buildingSMART/Sample-Test-Files
   - Community-contributed samples

**Recommendation for First Test**: Start with a small file (< 10 MB) to ensure everything works.

## Detailed Setup

### Development Environment

#### Recommended IDE Setup

**Visual Studio Code** with extensions:
- Angular Language Service
- ESLint
- Prettier
- TypeScript Import Sorter

#### Configure VS Code (Optional)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Configuration Options

The viewer is configured in `src/app/shared/constants/viewer.config.ts`.

#### Default Configuration

By default, the viewer uses:
- **WASM**: CDN (no setup required)
- **Camera**: Isometric view from [10, 10, 10]
- **Background**: Dark (#0e1013)
- **Grid**: Enabled (20x20 units)
- **Stats**: Memory panel visible

#### Customizing Configuration

Edit `viewer.config.ts` to customize:

```typescript
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  wasm: {
    path: 'https://unpkg.com/web-ifc@0.0.59/',
    useLocal: false,  // Change to true for production
  },
  camera: {
    position: [10, 10, 10],  // Camera starting position
    target: [0, 0, 0],       // Look-at point
    fov: 60,                 // Field of view
    near: 0.1,
    far: 1000,
  },
  visual: {
    backgroundColor: '#0e1013',  // Dark background
    showGrid: true,
    gridSize: 20,
    gridDivisions: 20,
  },
  performance: {
    showStats: true,        // Show memory panel
    maxPixelRatio: 2,       // Performance vs quality
  },
};
```

### Production Setup

For production deployment, follow these additional steps:

#### 1. Download WASM Files

```bash
# Option A: From npm package
npm install web-ifc
cp node_modules/web-ifc/*.wasm public/wasm/web-ifc/
npm uninstall web-ifc

# Option B: Manual download
# Visit https://unpkg.com/web-ifc@0.0.59/
# Download web-ifc.wasm and web-ifc-mt.wasm
# Place in public/wasm/web-ifc/
```

#### 2. Update Configuration

In `viewer.config.ts`:

```typescript
wasm: {
  path: '/wasm/web-ifc/',
  useLocal: true,
}
```

#### 3. Build for Production

```bash
npm run build
```

The built files will be in `dist/space-modeller/`.

#### 4. Deploy

Copy the contents of `dist/space-modeller/` to your web server.

**Important**: Ensure your web server serves the WASM files with the correct MIME type:
- `.wasm` → `application/wasm`

## Troubleshooting

### IFC File Won't Load

**Symptoms**: Error in console, no model appears

**Solutions**:
1. Check file is valid IFC format (`.ifc` extension)
2. Check browser console for detailed error
3. Try a different/smaller IFC file
4. Verify WASM files are loading (Network tab)

### WASM Loading Error

**Symptoms**: "Failed to fetch web-ifc.wasm"

**Solutions**:
1. Check internet connection (if using CDN)
2. Verify WASM path in configuration
3. Check CORS headers (if using custom CDN)
4. Try switching to local WASM files

### Slow Performance

**Symptoms**: Low FPS, laggy navigation

**Solutions**:
1. Check stats panel (top-left) for FPS/memory
2. Reduce `maxPixelRatio` in config (e.g., to 1)
3. Hide grid (`showGrid: false`)
4. Try a smaller IFC file first
5. Close other browser tabs
6. Update graphics drivers

### Canvas is Black

**Symptoms**: Viewer loads but shows black screen

**Solutions**:
1. Open DevTools console and check for errors
2. Check if WebGL is supported in your browser
3. Try a different browser
4. Verify graphics drivers are up to date

### Build Errors

**Symptoms**: `npm run build` fails

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check Node.js version (needs 18+)
4. Clear npm cache: `npm cache clean --force`

## Common Development Tasks

### Running Tests

```bash
npm test
```

Tests will run in Karma/Chrome.

### Linting

```bash
ng lint
```

### Format Code

```bash
npx prettier --write "src/**/*.{ts,html,css}"
```

### Analyze Bundle Size

```bash
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/space-modeller/stats.json
```

### Update Dependencies

```bash
npm update
```

Be cautious with major version updates, especially for @thatopen packages.

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Required Features

- WebGL 2.0
- WebAssembly
- ES2022 JavaScript features
- ResizeObserver API

### Check Compatibility

Visit: https://caniuse.com/webgl2

## Performance Expectations

### Small Models (< 10 MB)

- Load time: 2-10 seconds
- FPS: 60 (smooth)
- Memory: 100-300 MB

### Medium Models (10-50 MB)

- Load time: 10-30 seconds
- FPS: 30-60 (good)
- Memory: 300-800 MB

### Large Models (> 50 MB)

- Load time: 30-120+ seconds
- FPS: 15-30 (acceptable)
- Memory: 800+ MB

**Hardware**: Based on mid-range desktop (16GB RAM, dedicated GPU).

## Next Steps

After getting the viewer running:

1. **Read the Documentation**
   - `README.md` - Overview and features
   - `CONFIGURATION.md` - Detailed configuration guide
   - `IMPLEMENTATION_NOTES.md` - Technical details

2. **Customize the Viewer**
   - Adjust camera settings
   - Change colors and styling
   - Add custom UI elements

3. **Explore the Code**
   - `src/app/features/ifc-viewer/` - Main viewer component
   - `src/app/core/services/` - Service layer
   - `src/app/shared/constants/` - Configuration

4. **Learn About IFC**
   - https://www.buildingsmart.org/
   - https://technical.buildingsmart.org/standards/ifc/
   - https://docs.thatopen.com/

## Getting Help

If you encounter issues:

1. **Check the Docs**
   - Start with this guide
   - Review `CONFIGURATION.md`
   - Read `IMPLEMENTATION_NOTES.md`

2. **Check the Console**
   - Open browser DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

3. **Community Resources**
   - @thatopen/components: https://docs.thatopen.com/
   - Three.js: https://threejs.org/docs/
   - Angular: https://angular.dev/

4. **Report Issues**
   - Provide browser and version
   - Include console errors
   - Describe steps to reproduce
   - Mention IFC file size

## Tips for Success

1. **Start Small**: Test with small IFC files first
2. **Monitor Performance**: Keep stats panel open during development
3. **Use DevTools**: Chrome DevTools are invaluable for debugging
4. **Read the Logs**: Console provides detailed progress and error info
5. **Local WASM**: Use local WASM for production (faster and offline-ready)

---

**Happy Coding!** 🚀

For more information, see:
- `README.md` - Full project documentation
- `CONFIGURATION.md` - Configuration options
- `IMPLEMENTATION_NOTES.md` - Technical details

