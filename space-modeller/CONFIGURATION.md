# IFC Viewer Configuration Guide

This document provides detailed information about configuring the IFC viewer for different environments and use cases.

## Table of Contents

1. [WASM Configuration](#wasm-configuration)
2. [Camera Settings](#camera-settings)
3. [Visual Settings](#visual-settings)
4. [Performance Settings](#performance-settings)
5. [Environment-Specific Configs](#environment-specific-configs)
6. [Advanced Configuration](#advanced-configuration)

## WASM Configuration

### Overview

The IFC loader requires web-ifc WASM files to parse IFC data. You can configure the viewer to use either local assets or a CDN.

### Local WASM (Recommended for Production)

**Advantages:**
- Faster loading (no external network requests)
- Works offline
- Consistent performance
- No dependency on external CDN availability

**Setup:**

1. Download web-ifc WASM files from [web-ifc releases](https://github.com/IFCjs/web-ifc/releases)

2. Create directory structure:
   ```
   public/
   └── wasm/
       └── web-ifc/
           ├── web-ifc.wasm
           ├── web-ifc-mt.wasm (multi-threaded version)
           └── (other .wasm files)
   ```

3. Configure in `viewer.config.ts`:
   ```typescript
   wasm: {
     path: '/wasm/web-ifc/',
     useLocal: true,
   }
   ```

### CDN WASM (Quick Development)

**Advantages:**
- No setup required
- Immediate testing
- Always up-to-date

**Disadvantages:**
- Requires internet connection
- External dependency
- Potential CORS issues
- Slower initial load

**Configuration:**
```typescript
wasm: {
  path: 'https://unpkg.com/web-ifc@0.0.59/',
  useLocal: false,
}
```

**Alternative CDN options:**
- unpkg: `https://unpkg.com/web-ifc@VERSION/`
- jsDelivr: `https://cdn.jsdelivr.net/npm/web-ifc@VERSION/`

### Troubleshooting WASM Loading

**Error: "Failed to fetch"**
- Check network tab in browser DevTools
- Verify WASM path is correct
- Ensure CORS headers are properly configured (for CDN)
- For local files, ensure they're in the `public/` directory

**Error: "Invalid WASM binary"**
- WASM file may be corrupted
- Download again from official source
- Verify file integrity

## Camera Settings

Configure initial camera position, target, and projection parameters.

### Configuration Object

```typescript
camera: {
  position: [number, number, number],  // [x, y, z] in world units
  target: [number, number, number],    // Look-at point [x, y, z]
  fov: number,                         // Field of view in degrees
  near: number,                        // Near clipping plane
  far: number,                         // Far clipping plane
}
```

### Default Configuration

```typescript
camera: {
  position: [10, 10, 10],  // Diagonal view from above
  target: [0, 0, 0],       // Looking at origin
  fov: 60,                 // Standard FOV
  near: 0.1,               // Close clipping
  far: 1000,               // Far clipping for large models
}
```

### Common Presets

**Isometric View:**
```typescript
camera: {
  position: [15, 15, 15],
  target: [0, 0, 0],
  fov: 50,
  near: 0.1,
  far: 1000,
}
```

**Top-Down View:**
```typescript
camera: {
  position: [0, 50, 0],
  target: [0, 0, 0],
  fov: 60,
  near: 0.1,
  far: 1000,
}
```

**Close-Up View:**
```typescript
camera: {
  position: [5, 5, 5],
  target: [0, 0, 0],
  fov: 75,
  near: 0.01,
  far: 500,
}
```

### FOV Guidelines

- **50-60°**: Standard architectural visualization
- **60-75°**: Wider view for interiors
- **35-50°**: Telephoto effect, less distortion

### Clipping Plane Considerations

- **Near plane**: Too small = Z-fighting; too large = clipping near objects
- **Far plane**: Should encompass entire model; too large = depth precision issues
- Optimal ratio: `far / near < 10000` for best depth buffer precision

## Visual Settings

Customize the appearance and visual helpers in the scene.

### Configuration Object

```typescript
visual: {
  backgroundColor: string,  // CSS hex color
  showGrid: boolean,        // Display grid helper
  gridSize: number,         // Grid extent in units
  gridDivisions: number,    // Number of grid divisions
}
```

### Default Configuration

```typescript
visual: {
  backgroundColor: '#0e1013',  // Dark background
  showGrid: true,
  gridSize: 20,
  gridDivisions: 20,
}
```

### Background Color Presets

**Dark Themes:**
```typescript
backgroundColor: '#0e1013'  // Near black (default)
backgroundColor: '#1a1a2e'  // Dark blue
backgroundColor: '#16213e'  // Navy
backgroundColor: '#0f0f0f'  // True dark
```

**Light Themes:**
```typescript
backgroundColor: '#f5f5f5'  // Light gray
backgroundColor: '#ffffff'  // White
backgroundColor: '#e8f4f8'  // Light blue
```

**Neutral:**
```typescript
backgroundColor: '#2d2d2d'  // Medium gray
backgroundColor: '#3a3a3a'  // Warm gray
```

### Grid Configuration

**Large Building:**
```typescript
showGrid: true,
gridSize: 100,
gridDivisions: 50,
```

**Small Objects:**
```typescript
showGrid: true,
gridSize: 10,
gridDivisions: 10,
```

**No Grid:**
```typescript
showGrid: false,
```

## Performance Settings

Optimize rendering performance and enable monitoring tools.

### Configuration Object

```typescript
performance: {
  showStats: boolean,       // Display stats.js panel
  maxPixelRatio: number,    // Cap device pixel ratio
}
```

### Default Configuration

```typescript
performance: {
  showStats: true,
  maxPixelRatio: 2,
}
```

### Pixel Ratio Guidelines

| Device | Pixel Ratio | Recommended Max | Performance Impact |
|--------|-------------|-----------------|-------------------|
| Standard | 1 | 2 | Low |
| Retina | 2 | 2 | Medium |
| High-DPI | 3+ | 2 | High |

**Low-End Devices:**
```typescript
maxPixelRatio: 1  // Significant performance boost
```

**High-End Devices:**
```typescript
maxPixelRatio: 2  // Balanced quality and performance
```

**Maximum Quality:**
```typescript
maxPixelRatio: Math.min(window.devicePixelRatio, 3)  // Allow higher ratios
```

### Stats Panel

The stats.js panel displays three metrics:
- **Panel 0**: FPS (frames per second)
- **Panel 1**: MS (milliseconds per frame)
- **Panel 2**: MB (memory usage) - **Default display**

**Production:** Set `showStats: false` to hide the panel.

**Development:** Keep `showStats: true` to monitor performance.

## Environment-Specific Configs

### Development Configuration

```typescript
export const DEV_VIEWER_CONFIG: ViewerConfig = {
  wasm: {
    path: 'https://unpkg.com/web-ifc@0.0.59/',
    useLocal: false,  // Use CDN for quick setup
  },
  camera: {
    position: [10, 10, 10],
    target: [0, 0, 0],
    fov: 60,
    near: 0.1,
    far: 1000,
  },
  visual: {
    backgroundColor: '#0e1013',
    showGrid: true,
    gridSize: 20,
    gridDivisions: 20,
  },
  performance: {
    showStats: true,      // Show performance metrics
    maxPixelRatio: 2,
  },
  fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs',
};
```

### Production Configuration

```typescript
export const PROD_VIEWER_CONFIG: ViewerConfig = {
  wasm: {
    path: '/wasm/web-ifc/',
    useLocal: true,  // Use local WASM files
  },
  camera: {
    position: [10, 10, 10],
    target: [0, 0, 0],
    fov: 60,
    near: 0.1,
    far: 1000,
  },
  visual: {
    backgroundColor: '#0e1013',
    showGrid: true,
    gridSize: 20,
    gridDivisions: 20,
  },
  performance: {
    showStats: false,     // Hide stats in production
    maxPixelRatio: 2,
  },
  fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs',
};
```

### Using Angular Environments

1. Create environment files:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     viewerConfig: DEV_VIEWER_CONFIG,
   };

   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     viewerConfig: PROD_VIEWER_CONFIG,
   };
   ```

2. Update component to use environment config:
   ```typescript
   import { environment } from '../environments/environment';
   
   private config: ViewerConfig = environment.viewerConfig;
   ```

## Advanced Configuration

### Custom Lighting

Modify lighting in the component (`ifc-viewer.component.ts`):

```typescript
// Adjust ambient light
this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

// Adjust directional light
this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
this.directionalLight.position.set(10, 10, 10);

// Add additional lights
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(0, 10, 0);
this.scene.add(pointLight);
```

### Renderer Settings

Modify renderer settings in the component:

```typescript
// Enable shadows
this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Adjust tone mapping exposure
this.renderer.toneMappingExposure = 1.5;

// Enable physically correct lights (deprecated in newer Three.js)
// this.renderer.physicallyCorrectLights = true;
```

### Controls Customization

Modify OrbitControls behavior:

```typescript
// Faster damping
this.controls.dampingFactor = 0.1;

// Limit zoom
this.controls.minDistance = 1;
this.controls.maxDistance = 100;

// Limit vertical rotation
this.controls.maxPolarAngle = Math.PI / 2;  // Can't go below ground
this.controls.minPolarAngle = 0;            // Can't go past zenith

// Disable panning
this.controls.enablePan = false;

// Disable zoom
this.controls.enableZoom = false;
```

### Fragments Worker Configuration

The default worker URL points to ThatOpen's CDN:
```typescript
fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs'
```

**Self-Hosted Worker:**

1. Download the worker from the ThatOpen repository
2. Place in `public/workers/fragment-worker.mjs`
3. Update configuration:
   ```typescript
   fragmentsWorkerUrl: '/workers/fragment-worker.mjs'
   ```

## Configuration Best Practices

1. **Separate configs by environment**: Use different configs for dev/staging/prod
2. **Document changes**: Comment any non-standard configuration
3. **Test thoroughly**: Changes can affect loading, rendering, or performance
4. **Version control**: Track configuration changes in git
5. **Monitor performance**: Use stats panel to measure impact of changes
6. **Gradual rollout**: Test changes with small user groups first

## Configuration Validation

Add runtime validation to catch configuration errors:

```typescript
function validateViewerConfig(config: ViewerConfig): void {
  if (config.camera.near >= config.camera.far) {
    console.error('Camera near plane must be less than far plane');
  }
  
  if (config.camera.fov <= 0 || config.camera.fov >= 180) {
    console.error('Camera FOV must be between 0 and 180 degrees');
  }
  
  if (config.performance.maxPixelRatio < 1) {
    console.warn('maxPixelRatio should be at least 1');
  }
  
  // Additional validations...
}
```

## Troubleshooting Configuration Issues

### Camera Issues

**Model not visible:**
- Increase `far` plane: `far: 10000`
- Adjust camera `position` to be further away
- Check model scale matches camera scale

**Z-fighting (flickering):**
- Increase `near` plane (0.1 → 1)
- Decrease `far` plane
- Reduce `far/near` ratio

### Performance Issues

**Low FPS:**
- Reduce `maxPixelRatio` to 1
- Simplify lighting (fewer lights)
- Disable shadows
- Hide grid (`showGrid: false`)

**High memory usage:**
- Check for memory leaks (watch stats panel)
- Ensure models are disposed properly
- Limit number of loaded models

### Visual Issues

**Too dark:**
- Increase ambient light intensity
- Add more light sources
- Use lighter background color

**Too bright:**
- Decrease light intensities
- Adjust tone mapping exposure
- Use darker background

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [@thatopen/components Docs](https://docs.thatopen.com/)
- [web-ifc Repository](https://github.com/IFCjs/web-ifc)
- [IFC Format Specification](https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/)
