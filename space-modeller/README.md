# Space Modeller - IFC Viewer

A production-ready 3D IFC viewer built with Angular 18, Three.js, and @thatopen/components. Load and render IFC (Industry Foundation Classes) files with advanced features like fragment-based rendering, memory monitoring, and model export capabilities.

## Features

- **Modern Three.js Rendering**
  - sRGB color space with ACES Filmic tone mapping
  - Pixel ratio capped at 2 for performance
  - Smooth orbit controls with camera culling updates

- **IFC File Support**
  - Load IFC files using @thatopen/components
  - Progress tracking with console logging (1 decimal precision)
  - Automatic camera framing to fit models

- **Fragment-Based Rendering**
  - Performant instancing and culling for large models
  - FragmentsManager with dedicated worker
  - Export models as .frag files

- **Performance Monitoring**
  - Stats.js memory panel (MB)
  - Real-time performance metrics
  - Optimized for mid-range hardware

- **Robust Resource Management**
  - Proper disposal of GPU resources
  - Event listener cleanup
  - No memory leaks on component teardown

- **Modern UI**
  - Clean, minimal toolbar
  - File picker for IFC import
  - One-click .frag export
  - Loading overlay with progress indicator
  - Fully responsive design

## Tech Stack

- **Angular 18** - Standalone components with OnPush change detection
- **TypeScript 5.5** - Strict mode enabled
- **Three.js 0.180** - 3D rendering engine
- **@thatopen/components** - IFC loading and fragment management
- **stats.js** - Performance monitoring
- **RxJS 7.8** - Reactive programming

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd space-modeller
```

2. Install dependencies:
```bash
npm install
```

3. **(Optional)** For local WASM assets, download web-ifc WASM files:
   - Create directory: `public/wasm/web-ifc/`
   - Download WASM files from [web-ifc releases](https://github.com/IFCjs/web-ifc/releases)
   - Place `.wasm` files in the directory

   **Note:** By default, the viewer uses a CDN path for quick development. For production, local WASM assets are recommended.

## Development Server

Start the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

**Note:** The development server uses a proxy configuration (`proxy.conf.json`) to handle CORS issues with the ThatOpen Components worker. This is automatically configured and requires no additional setup.

## Configuration

### WASM Path Configuration

The viewer configuration is located in `src/app/shared/constants/viewer.config.ts`:

```typescript
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  wasm: {
    // Local WASM path - recommended for production
    path: '/wasm/web-ifc/',
    useLocal: true,
    
    // Alternative CDN path for development:
    // path: 'https://unpkg.com/web-ifc@0.0.59/',
    // useLocal: false,
  },
  // ... other settings
};
```

### Customizable Settings

- **Camera**: Initial position, target, FOV, clipping planes
- **Visual**: Background color, grid visibility and size
- **Performance**: Stats panel visibility, max pixel ratio
- **Fragments Worker**: URL for FragmentsManager worker

## Usage

1. **Launch the Application**
   - Start the dev server (`npm start`)
   - Open `http://localhost:4200/`

2. **Import an IFC File**
   - Click the "Import IFC" button in the toolbar
   - Select a `.ifc` file from your system
   - Watch the loading progress in the console
   - The model will be automatically framed in the viewport

3. **Navigate the 3D View**
   - **Rotate**: Left-click and drag
   - **Pan**: Right-click and drag (or Shift + left-click)
   - **Zoom**: Mouse wheel or pinch gesture

4. **Export as Fragment**
   - After loading a model, click "Download .frag"
   - The model will be saved as a compressed `.frag` file
   - This format loads faster than IFC for subsequent views

5. **Performance Monitoring**
   - Stats.js panel shows memory usage (MB) in the top-left corner
   - Monitor FPS and memory during interaction

## Project Structure

```
space-modeller/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   └── services/
│   │   │       └── fragments.service.ts    # @thatopen/components lifecycle
│   │   ├── features/
│   │   │   └── ifc-viewer/
│   │   │       ├── ifc-viewer.component.ts  # Main viewer component
│   │   │       ├── ifc-viewer.component.html
│   │   │       └── ifc-viewer.component.css
│   │   ├── shared/
│   │   │   └── constants/
│   │   │       └── viewer.config.ts        # Viewer configuration
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── styles.css                          # Global styles
│   └── main.ts
├── public/                                 # Static assets
│   └── wasm/                              # (Optional) Local WASM files
│       └── web-ifc/
└── package.json
```

## Architecture

### Components

**IfcViewerComponent** (`ifc-viewer.component.ts`)
- Manages Three.js scene, camera, renderer, and controls
- Handles IFC file loading and fragment export
- Implements stats.js monitoring
- Ensures proper resource disposal

### Services

**FragmentsService** (`fragments.service.ts`)
- Singleton service for @thatopen/components lifecycle
- Manages FragmentsManager and IFC Loader
- Handles model loading, camera binding, and culling
- Provides fragment export functionality

### Configuration

**viewer.config.ts**
- Centralized configuration for all viewer settings
- WASM path configuration (local vs CDN)
- Camera, visual, and performance settings
- Export as separate dev/prod configs

## Best Practices

### Zone Management
The render loop runs outside Angular's zone for optimal performance:
```typescript
this.ngZone.runOutsideAngular(() => this.animate());
```

### Resource Disposal
All resources are properly disposed in `ngOnDestroy()`:
- Three.js geometries, materials, and renderer
- OrbitControls event listeners
- FragmentsService cleanup
- Stats.js DOM elements

### Change Detection
Uses `OnPush` change detection strategy with signals for reactive state management.

## Performance Tips

1. **Large Models**: Fragment-based rendering automatically handles instancing and culling
2. **Memory**: Monitor the stats panel; dispose unused models
3. **Pixel Ratio**: Capped at 2 by default; lower for better performance on high-DPI displays
4. **Culling**: Triggered automatically when camera movement stops

## Troubleshooting

### CORS Error for Worker Script
- **Error**: `Failed to construct 'Worker': Script at 'https://thatopen.github.io/engine_fragment/resources/worker.mjs' cannot be accessed from origin 'http://localhost:4200'`
  - **Solution**: This is already fixed with the proxy configuration in `proxy.conf.json`
  - Make sure you restart the development server after pulling updates: `npm start`
  - The proxy automatically handles CORS issues in development
  - For production deployment, see `CORS_FIX.md` for detailed instructions

### WASM Loading Issues
- **Error**: `Failed to fetch WASM`
  - **Solution**: Check WASM path in `viewer.config.ts`
  - For development, use CDN path: `https://unpkg.com/web-ifc@0.0.72/`
  - For production, place WASM files in `public/wasm/web-ifc/`

### IFC Loading Fails
- **Error**: `Failed to load IFC file`
  - **Solution**: Ensure file is valid IFC format
  - Check browser console for detailed error messages
  - Verify FragmentsService is initialized

### Memory Leaks
- Check that `ngOnDestroy()` is called when navigating away
- Monitor stats panel for increasing memory usage
- Ensure all event listeners are removed

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Production Checklist
- [ ] Place WASM files in `public/wasm/web-ifc/`
- [ ] Update `viewer.config.ts` to use local WASM path
- [ ] Test with representative IFC files
- [ ] Verify no console errors or warnings
- [ ] Check memory usage with stats panel
- [ ] Test resource cleanup (navigate away and back)

## Testing

Run unit tests:
```bash
npm test
```

## Documentation

Additional documentation files:
- **CORS_FIX.md** - Detailed explanation of the CORS proxy solution for development and production
- **CONFIGURATION.md** - Complete configuration guide for all viewer settings
- **IMPLEMENTATION_NOTES.md** - Implementation details and architecture decisions
- **IFC_LOADING_FIX.md** - IFC loading troubleshooting and fixes
- **PROJECT_SUMMARY.md** - Project overview and summary

## Contributing

1. Follow the project conventions in `CONFIGURATION.md`
2. Use Angular 18 standalone components with OnPush
3. Maintain strict TypeScript typing
4. Dispose of all resources properly
5. Test with various IFC files

## License

[Your License Here]

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D rendering engine
- [@thatopen/components](https://github.com/ThatOpen/engine_components) - IFC loading and fragment management
- [stats.js](https://github.com/mrdoob/stats.js/) - Performance monitoring
- [Angular](https://angular.dev/) - Application framework
