import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  inject,
  NgZone,
  afterNextRender,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { FragmentsService } from '../../core/services/fragments.service';
import {
  DEFAULT_VIEWER_CONFIG,
  ViewerConfig,
} from '../../shared/constants/viewer.config';

/**
 * IFC Viewer Component
 * Production-ready 3D viewer for loading and rendering IFC files using Three.js and @thatopen/components.
 * Implements modern renderer settings, fragment-based rendering, and robust resource management.
 */
@Component({
  selector: 'app-ifc-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ifc-viewer.component.html',
  styleUrls: ['./ifc-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IfcViewerComponent {
  private readonly ngZone = inject(NgZone);
  private readonly fragmentsService = inject(FragmentsService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  // Three.js core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;

  // Helpers
  private gridHelper?: THREE.GridHelper;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;

  // Stats.js for memory monitoring
  private stats?: Stats;

  // Animation frame ID for cleanup
  private animationFrameId?: number;

  // Resize observer for responsive canvas
  private resizeObserver?: ResizeObserver;

  // Configuration
  private config: ViewerConfig = DEFAULT_VIEWER_CONFIG;

  // Signals for UI state
  readonly isLoading = signal(false);
  readonly loadingProgress = signal(0);
  readonly modelName = signal<string | null>(null);
  readonly hasModel = signal(false);

  constructor() {
    afterNextRender(() => {
      this.initThreeJs();
      this.initStats();
      this.setupResizeObserver();
      this.ngZone.runOutsideAngular(() => this.animate());
    });
  }

  /**
   * Initialize Three.js scene, renderer, camera, and lighting
   */
  private initThreeJs(): void {
    const canvas = this.canvasRef().nativeElement;
    const container = canvas.parentElement;
    if (!container) {
      console.error('Canvas container not found');
      return;
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.visual.backgroundColor);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      aspect,
      this.config.camera.near,
      this.config.camera.far
    );
    this.camera.position.set(...this.config.camera.position);
    this.camera.lookAt(...this.config.camera.target);

    // Renderer with modern settings
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });

    // Modern renderer configuration
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.config.performance.maxPixelRatio)
    );
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);

    // Grid helper
    if (this.config.visual.showGrid) {
      this.gridHelper = new THREE.GridHelper(
        this.config.visual.gridSize,
        this.config.visual.gridDivisions,
        0x444444,
        0x222222
      );
      this.scene.add(this.gridHelper);
    }

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(...this.config.camera.target);

    // Update culling when camera stops moving
    this.controls.addEventListener('end', () => {
      this.fragmentsService.updateCulling(this.camera);
    });

    // Initialize FragmentsService
    this.fragmentsService
      .initialize(this.scene, this.camera, this.renderer, this.config)
      .then(() => {
        console.log('FragmentsService initialized');
      })
      .catch((error) => {
        console.error('Failed to initialize FragmentsService:', error);
      });

    console.log('Three.js initialized with modern renderer settings');
  }

  /**
   * Initialize stats.js memory monitoring panel
   */
  private initStats(): void {
    if (!this.config.performance.showStats) {
      return;
    }

    this.stats = new Stats();
    this.stats.showPanel(2); // Memory panel (MB)

    // Position stats panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '0';
    this.stats.dom.style.left = '0';
    this.stats.dom.style.zIndex = '1000';

    const canvas = this.canvasRef().nativeElement;
    const container = canvas.parentElement;
    if (container) {
      container.appendChild(this.stats.dom);
    }

    console.log('Stats.js memory panel initialized');
  }

  /**
   * Setup ResizeObserver for responsive canvas sizing
   */
  private setupResizeObserver(): void {
    const canvas = this.canvasRef().nativeElement;
    const container = canvas.parentElement;
    if (!container) {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.onResize(width, height);
      }
    });

    this.resizeObserver.observe(container);
  }

  /**
   * Handle canvas resize
   */
  private onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Stats begin
    if (this.stats) {
      this.stats.begin();
    }

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    // Stats end
    if (this.stats) {
      this.stats.end();
    }
  }

  /**
   * Handle IFC file selection from file input
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      console.error('Please select a valid .ifc file');
      alert('Please select a valid .ifc file');
      return;
    }

    await this.loadIfcFile(file);

    // Reset input so the same file can be selected again
    input.value = '';
  }

  /**
   * Load an IFC file
   */
  private async loadIfcFile(file: File): Promise<void> {
    this.isLoading.set(true);
    this.loadingProgress.set(0);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract model name from filename (without extension)
      const modelName = file.name.replace(/\.ifc$/i, '');
      this.modelName.set(modelName);

      console.log(`Loading IFC file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Load IFC using FragmentsService
      const model = await this.fragmentsService.loadIfc(
        uint8Array,
        modelName,
        (progress) => {
          this.loadingProgress.set(progress);
        }
      );

      if (model) {
        // Bind model to camera for culling
        this.fragmentsService.bindModelToCamera(model, this.camera);

        // Add model to scene (use model.object in v3.x)
        this.scene.add(model.object);

        // Trigger initial culling update
        this.fragmentsService.updateCulling(this.camera);

        // Fit camera to model bounds
        this.fitCameraToModel(model.object);

        this.hasModel.set(true);
        console.log(`IFC model "${modelName}" loaded and added to scene`);
      } else {
        console.error('Failed to load IFC model');
        alert('Failed to load IFC file. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error loading IFC file:', error);
      alert('Error loading IFC file. Please check the console for details.');
    } finally {
      this.isLoading.set(false);
      this.loadingProgress.set(0);
    }
  }

  /**
   * Fit camera to view the entire model
   */
  private fitCameraToModel(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    // Add some padding
    cameraDistance *= 1.5;

    // Position camera
    const direction = this.camera.position.clone().sub(center).normalize();
    this.camera.position.copy(direction.multiplyScalar(cameraDistance).add(center));

    // Update controls target
    this.controls.target.copy(center);
    this.controls.update();

    // Trigger culling update
    this.fragmentsService.updateCulling(this.camera);
  }

  /**
   * Export current model as .frag file
   */
  async onExportFragment(): Promise<void> {
    if (!this.hasModel()) {
      console.warn('No model loaded to export');
      alert('Please load an IFC file first');
      return;
    }

    try {
      console.log('Exporting fragment...');
      const buffer = await this.fragmentsService.exportFragment();

      if (!buffer) {
        console.error('Failed to export fragment');
        alert('Failed to export fragment. Please check the console for details.');
        return;
      }

      // Create Blob and download
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.modelName() || 'model'}.frag`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);

      console.log('Fragment exported successfully');
    } catch (error) {
      console.error('Error exporting fragment:', error);
      alert('Error exporting fragment. Please check the console for details.');
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    console.log('Disposing IFC viewer resources...');

    // Cancel animation frame
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Dispose controls
    if (this.controls) {
      this.controls.removeEventListener('end', () => {});
      this.controls.dispose();
    }

    // Remove stats panel
    if (this.stats && this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }

    // Dispose FragmentsService
    this.fragmentsService.dispose();

    // Dispose scene objects
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      this.scene.clear();
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    console.log('IFC viewer resources disposed successfully');
  }
}

