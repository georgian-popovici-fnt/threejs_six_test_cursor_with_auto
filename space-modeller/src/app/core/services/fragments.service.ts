import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as FRAG from '@thatopen/fragments';
import { ViewerConfig } from '../../shared/constants/viewer.config';

/**
 * FragmentsService
 * Manages @thatopen/components lifecycle, including FragmentsManager and IFC loading.
 * Singleton service that coordinates geometry streaming and fragment management.
 */
@Injectable({
  providedIn: 'root',
})
export class FragmentsService {
  private components: OBC.Components | null = null;
  private fragmentsManager: OBC.FragmentsManager | null = null;
  private ifcLoader: OBC.IfcLoader | null = null;
  private currentModel: FRAG.FragmentsModel | null = null;

  /**
   * Initialize @thatopen/components with the provided scene and configuration
   */
  async initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: ViewerConfig
  ): Promise<void> {
    if (this.components) {
      console.warn('FragmentsService already initialized');
      return;
    }

    // Create OBC Components instance
    this.components = new OBC.Components();

    // Initialize FragmentsManager
    this.fragmentsManager = this.components.get(OBC.FragmentsManager);

    // Initialize IFC Loader
    this.ifcLoader = this.components.get(OBC.IfcLoader);

    if (this.ifcLoader) {
      // Configure WASM settings
      await this.ifcLoader.setup({
        wasm: {
          path: config.wasm.path,
          absolute: !config.wasm.useLocal,
        },
      });
    }
  }

  /**
   * Load an IFC file from a Uint8Array buffer
   * @param buffer - The IFC file data as Uint8Array
   * @param modelName - Name for the loaded model
   * @param onProgress - Optional progress callback (0-100)
   * @returns The loaded FragmentsModel
   */
  async loadIfc(
    buffer: Uint8Array,
    modelName: string,
    onProgress?: (progress: number) => void
  ): Promise<FRAG.FragmentsModel | null> {
    if (!this.ifcLoader) {
      console.error('IFC Loader not initialized');
      return null;
    }

    try {
      // Progress callback wrapper
      const progressCallback = (progress: number) => {
        const percent = Math.round(progress * 1000) / 10; // 1 decimal precision
        console.log(`Loading IFC: ${percent.toFixed(1)}%`);
        if (onProgress) {
          onProgress(percent);
        }
      };

      // Load IFC with progress tracking
      const model = await this.ifcLoader.load(buffer, false, modelName, {
        processData: { progressCallback },
      });

      this.currentModel = model;
      console.log(`IFC model "${modelName}" loaded successfully`);

      return model;
    } catch (error) {
      console.error('Failed to load IFC file:', error);
      return null;
    }
  }

  /**
   * Bind a fragment model to the active camera for culling
   */
  bindModelToCamera(model: FRAG.FragmentsModel, camera: THREE.Camera): void {
    // In version 3.x, camera binding is handled differently
    // The model is automatically managed by the components system
    console.log('Model bound to camera:', model.modelId);
  }

  /**
   * Trigger culling update for the current model
   */
  updateCulling(camera: THREE.Camera): void {
    // In version 3.x, culling is handled automatically by the renderer
    // No manual update needed
  }

  /**
   * Export the current model as a .frag file
   * @returns Uint8Array buffer of the .frag file, or null if no model loaded
   * Note: In @thatopen/components v3.x, direct export is handled through the internal API
   */
  async exportFragment(): Promise<Uint8Array | null> {
    if (!this.currentModel) {
      console.error('No model loaded to export');
      return null;
    }

    try {
      // In v3.x, use the internal _save() method
      // Note: This is an internal API and may change in future versions
      const buffer = await (this.currentModel as any)._save();
      console.log('Fragment export successful');
      return buffer;
    } catch (error) {
      console.error('Failed to export fragment:', error);
      return null;
    }
  }

  /**
   * Get the current loaded model
   */
  getCurrentModel(): FRAG.FragmentsModel | null {
    return this.currentModel;
  }

  /**
   * Get the FragmentsManager instance
   */
  getFragmentsManager(): OBC.FragmentsManager | null {
    return this.fragmentsManager;
  }

  /**
   * Dispose of all resources and clean up
   */
  dispose(): void {
    if (this.currentModel) {
      // Dispose of the current model's geometries and materials
      this.currentModel.dispose();
      this.currentModel = null;
    }

    if (this.ifcLoader) {
      this.ifcLoader.dispose();
      this.ifcLoader = null;
    }

    if (this.fragmentsManager) {
      this.fragmentsManager.dispose();
      this.fragmentsManager = null;
    }

    if (this.components) {
      this.components.dispose();
      this.components = null;
    }

    console.log('FragmentsService disposed');
  }
}

