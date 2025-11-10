# Implementation Notes - IFC Viewer

This document provides implementation details and notes about the IFC viewer built with Angular 18, Three.js, and @thatopen/components v3.x.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [API Version Notes](#api-version-notes)
3. [Architecture Overview](#architecture-overview)
4. [Key Implementation Details](#key-implementation-details)
5. [Known Limitations](#known-limitations)
6. [Future Improvements](#future-improvements)

## Technology Stack

### Core Dependencies

- **Angular 18.2** - Latest Angular with standalone components
- **TypeScript 5.5** - With strict mode enabled
- **Three.js 0.180** - 3D rendering engine
- **@thatopen/components 3.2.3** - IFC loading and components system
- **@thatopen/components-front 3.2.1** - Frontend-specific components
- **@thatopen/fragments 3.2.4** - Fragment-based geometry management
- **web-ifc** - WebAssembly IFC parser (peer dependency)
- **stats.js** - Performance monitoring

### Build Configuration

- **Bundle Size**: ~5.2 MB initial (545 KB gzipped)
- **Budget**: 8MB warning / 10MB error (appropriate for 3D applications)
- **CommonJS Dependencies**: stats.js (allowed)

## API Version Notes

### @thatopen/components v3.x Changes

The implementation uses @thatopen/components **version 3.x**, which has significant API differences from earlier versions:

#### FragmentsModel vs FragmentGroup

**v1.x/v2.x (Legacy)**:
```typescript
import * as OBCF from '@thatopen/components-front';
const model: OBCF.FragmentGroup = await loader.load(buffer);
this.scene.add(model.mesh);
```

**v3.x (Current)**:
```typescript
import * as OBC from '@thatopen/components';
const model: FRAG.FragmentsModel = await loader.load(buffer);
this.scene.add(model.object); // Changed from model.mesh to model.object
```

#### Component Location

**v1.x/v2.x**:
- `FragmentsManager` was in `@thatopen/components-front`
- `IfcLoader` was in `@thatopen/components-front`

**v3.x**:
- Both `FragmentsManager` and `IfcLoader` are in `@thatopen/components`
- They are accessed via `components.get(OBC.FragmentsManager)`

#### WASM Configuration

**v1.x/v2.x**:
```typescript
await ifcLoader.setup({
  baseUrl: path
});
```

**v3.x**:
```typescript
await ifcLoader.setup({
  wasm: {
    path: path,
    absolute: false
  }
});
```

#### Fragment Export

**v1.x/v2.x**:
```typescript
const buffer = await model.getBuffer(false);
```

**v3.x**:
```typescript
// Public export API not exposed in v3.x
// Using internal API (subject to change):
const buffer = await (model as any)._save();
```

**Note**: The export functionality uses an internal API (`_save()`) which may change in future versions. Consider this when upgrading.

#### Culling & Camera Binding

**v1.x/v2.x**:
```typescript
model.properties.camera = camera;
fragmentsManager.culler.needsUpdate = true;
```

**v3.x**:
```typescript
// Culling is handled automatically by the renderer
// No manual camera binding or culling updates needed
```

## Architecture Overview

### Component Structure

```
app/
├── core/
│   └── services/
│       └── fragments.service.ts          # @thatopen/components lifecycle
├── features/
│   └── ifc-viewer/
│       ├── ifc-viewer.component.ts      # Main viewer component
│       ├── ifc-viewer.component.html    # Template with toolbar
│       └── ifc-viewer.component.css     # Styles
├── shared/
│   └── constants/
│       └── viewer.config.ts             # Configuration constants
└── app.component.ts                      # Root component
```

### Service Layer

**FragmentsService** (`fragments.service.ts`):
- Singleton service (`providedIn: 'root'`)
- Manages OBC.Components lifecycle
- Handles IFC loading with progress tracking
- Provides fragment export functionality
- Ensures proper resource disposal

### Component Layer

**IfcViewerComponent** (`ifc-viewer.component.ts`):
- Standalone component with OnPush change detection
- Manages Three.js scene, camera, renderer, controls
- Runs animation loop outside Angular zone for performance
- Implements stats.js memory monitoring
- Uses signals for reactive UI state

## Key Implementation Details

### Zone Management

The render loop runs outside Angular's zone to prevent unnecessary change detection:

```typescript
constructor() {
  afterNextRender(() => {
    this.initThreeJs();
    this.ngZone.runOutsideAngular(() => this.animate());
  });
}
```

### Renderer Configuration

Modern Three.js settings for production:

```typescript
this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 1.0;
this.renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);
```

### Responsive Canvas

Uses ResizeObserver for efficient resize handling:

```typescript
this.resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    this.onResize(width, height);
  }
});
```

### Resource Management

Comprehensive disposal in ngOnDestroy():

1. Cancel animation frame
2. Disconnect resize observer
3. Dispose controls and event listeners
4. Remove stats panel from DOM
5. Dispose FragmentsService
6. Traverse scene and dispose geometries/materials
7. Dispose renderer and force context loss

### Progress Tracking

IFC loading progress is tracked and logged:

```typescript
const progressCallback = (progress: number) => {
  const percent = Math.round(progress * 1000) / 10;
  console.log(`Loading IFC: ${percent.toFixed(1)}%`);
  if (onProgress) {
    onProgress(percent);
  }
};
```

### Stats.js Integration

Memory monitoring tied to render loop:

```typescript
private animate(): void {
  this.animationFrameId = requestAnimationFrame(() => this.animate());
  
  if (this.stats) {
    this.stats.begin();
  }
  
  this.controls.update();
  this.renderer.render(this.scene, this.camera);
  
  if (this.stats) {
    this.stats.end();
  }
}
```

## Known Limitations

### 1. Fragment Export Uses Internal API

The fragment export feature uses `(model as any)._save()`, which is an internal API. This may break in future @thatopen/components versions. Monitor the package changelog for updates.

**Workaround**: If export breaks, users can keep the IFC file and re-load it as needed.

### 2. CDN WASM by Default

The default configuration uses a CDN for WASM files (`https://unpkg.com/web-ifc@0.0.59/`). This requires an internet connection.

**Solution**: For production, download WASM files to `public/wasm/web-ifc/` and update configuration.

### 3. Large Bundle Size

The initial bundle is ~5.2 MB (545 KB gzipped) due to Three.js and @thatopen dependencies.

**Considerations**:
- Code splitting not easily applicable to 3D libraries
- Consider lazy loading the viewer component if it's not the main app feature
- Acceptable for dedicated 3D applications

### 4. CommonJS Dependency

stats.js is a CommonJS module, which causes optimization warnings.

**Status**: Allowed via `allowedCommonJsDependencies` in `angular.json`. Minimal impact on bundle size.

### 5. No Multi-Model Support

Currently only supports loading one IFC model at a time.

**Future Enhancement**: Could be extended to support multiple models with a model manager.

## Future Improvements

### High Priority

1. **Replace Internal Export API**
   - Monitor @thatopen/components for official export API
   - Implement when available in v3.x or later

2. **Local WASM Setup Script**
   - Add npm script to automatically download WASM files
   - `npm run setup:wasm` to prepare for production

3. **Error Handling UI**
   - Replace `alert()` with proper toast notifications
   - Better error messages for common issues

### Medium Priority

4. **Multi-Model Support**
   - Allow loading multiple IFC files
   - Model selection/visibility controls
   - Aggregate bounding box for camera framing

5. **Fragment Loading**
   - Support loading pre-exported .frag files
   - Faster than IFC for subsequent loads

6. **Camera Presets**
   - Save/restore camera positions
   - Named views (Front, Top, Isometric, etc.)

7. **Model Information Panel**
   - Display IFC metadata
   - Element selection and highlighting
   - Property display

### Low Priority

8. **Measurement Tools**
   - Distance measurement
   - Area calculation
   - Angle measurement

9. **Section Planes**
   - Dynamic clipping planes
   - Section box controls

10. **Performance Optimizations**
    - Level of Detail (LOD) for large models
    - Frustum culling optimization
    - Occlusion culling

## Testing Recommendations

### Manual Testing Checklist

1. **Loading**
   - [ ] Load small IFC file (< 10 MB)
   - [ ] Load medium IFC file (10-50 MB)
   - [ ] Load large IFC file (> 50 MB)
   - [ ] Test with invalid IFC file
   - [ ] Test progress tracking logs

2. **Navigation**
   - [ ] Orbit (left-click drag)
   - [ ] Pan (right-click drag)
   - [ ] Zoom (mouse wheel)
   - [ ] Auto-frame model on load

3. **Export**
   - [ ] Export as .frag
   - [ ] Verify file downloads
   - [ ] Check file name matches model

4. **Performance**
   - [ ] Monitor FPS (should stay > 30)
   - [ ] Monitor memory (watch for leaks)
   - [ ] Test on mid-range hardware

5. **Responsive**
   - [ ] Resize browser window
   - [ ] Test on different screen sizes
   - [ ] Verify canvas scales properly

6. **Resource Cleanup**
   - [ ] Navigate away and back
   - [ ] Check for console errors
   - [ ] Verify memory is released

### Automated Testing

Consider adding:

- **Unit Tests**: FragmentsService methods
- **Component Tests**: IfcViewerComponent initialization
- **E2E Tests**: Full loading workflow

## Development Tips

### Debugging IFC Loading Issues

1. **Check browser console** for detailed errors
2. **Network tab** to verify WASM file loading
3. **Enable web-ifc logging**:
   ```typescript
   await ifcLoader.setup({
     wasm: {
       path: path,
       logLevel: WEBIFC.LogLevel.LOG_LEVEL_DEBUG
     }
   });
   ```

### Performance Profiling

1. **Stats panel** shows real-time metrics
2. **Chrome DevTools Performance tab** for detailed profiling
3. **Memory snapshots** to detect leaks

### Hot Reload Caveats

When using `ng serve`, hot reload may not properly dispose WebGL context. If you see context loss errors, do a full page refresh.

## Resources

- [@thatopen/components Documentation](https://docs.thatopen.com/)
- [@thatopen/components GitHub](https://github.com/ThatOpen/engine_components)
- [Three.js Documentation](https://threejs.org/docs/)
- [web-ifc Repository](https://github.com/IFCjs/web-ifc)
- [IFC Format Specification](https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/)

## Support & Contributions

For issues or questions:

1. Check the @thatopen/components documentation
2. Review GitHub issues in ThatOpen repositories
3. Consult Three.js documentation for rendering issues
4. Check browser console for detailed error messages

When reporting issues, include:
- Browser and version
- IFC file size and source
- Console error messages
- Steps to reproduce

---

**Last Updated**: November 2025
**Version**: 1.0.0
**API Version**: @thatopen/components v3.2.x

