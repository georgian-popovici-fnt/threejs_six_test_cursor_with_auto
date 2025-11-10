/**
 * IFC Viewer Configuration
 * Centralized configuration for the 3D viewer, WASM paths, camera settings, and visual defaults.
 */

export interface ViewerConfig {
  /** WASM configuration for web-ifc */
  wasm: {
    /** Path to web-ifc WASM files. Use 'local' for production or CDN URL for development */
    path: string;
    /** Whether to use local WASM assets */
    useLocal: boolean;
  };
  /** Camera configuration */
  camera: {
    /** Initial camera position [x, y, z] */
    position: [number, number, number];
    /** Initial camera target/look-at point [x, y, z] */
    target: [number, number, number];
    /** Field of view in degrees */
    fov: number;
    /** Near clipping plane */
    near: number;
    /** Far clipping plane */
    far: number;
  };
  /** Visual settings */
  visual: {
    /** Background color (CSS hex format) */
    backgroundColor: string;
    /** Whether to show grid helper */
    showGrid: boolean;
    /** Grid size */
    gridSize: number;
    /** Grid divisions */
    gridDivisions: number;
  };
  /** Performance settings */
  performance: {
    /** Whether to show stats.js memory panel */
    showStats: boolean;
    /** Maximum pixel ratio (capped for performance) */
    maxPixelRatio: number;
  };
  /** FragmentsManager worker URL */
  fragmentsWorkerUrl: string;
}

/**
 * Default viewer configuration
 * Uses CDN for WASM by default for quick setup
 * For production, download WASM files to public/wasm/web-ifc/ and switch to local
 */
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  wasm: {
    // CDN path matching installed web-ifc version 0.0.72
    path: 'https://unpkg.com/web-ifc@0.0.72/',
    useLocal: false,
    // For production, use local WASM path:
    // Place web-ifc WASM files in public/wasm/web-ifc/ directory
    // path: '/wasm/web-ifc/',
    // useLocal: true,
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
    showStats: true,
    maxPixelRatio: 2,
  },
  fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs',
};

/**
 * Development configuration with CDN WASM for quick testing
 */
export const DEV_VIEWER_CONFIG: ViewerConfig = {
  ...DEFAULT_VIEWER_CONFIG,
  wasm: {
    path: 'https://unpkg.com/web-ifc@0.0.72/',
    useLocal: false,
  },
};

