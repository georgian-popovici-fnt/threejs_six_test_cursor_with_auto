import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  inject,
  NgZone,
  afterNextRender,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import { FragmentsService } from '../../core/services/fragments.service';
import {
  VIEWER_CONFIG,
  RENDERER_CONFIG,
  CAMERA_CONFIG,
  CONTROLS_CONFIG,
} from '../../shared/constants/viewer.constants';
import { ModelState } from '../../shared/models/viewer.model';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly fragmentsService = inject(FragmentsService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // Three.js objects
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private gridHelper?: THREE.GridHelper;
  private stats?: Stats;
  private animationFrameId?: number;

  // State
  readonly currentModel = signal<ModelState | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Resize observer
  private resizeObserver?: ResizeObserver;

  constructor() {
    afterNextRender(() => {
      this.initViewer();
      this.ngZone.runOutsideAngular(() => this.animate());
    });
  }

  /**
   * Initialize the Three.js viewer and ThatOpen components
   */
  private async initViewer(): Promise<void> {
    try {
      const canvas = this.canvasRef().nativeElement;

      // Initialize Three.js renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: RENDERER_CONFIG.antialias,
        alpha: RENDERER_CONFIG.alpha,
        preserveDrawingBuffer: RENDERER_CONFIG.preserveDrawingBuffer,
        powerPreference: RENDERER_CONFIG.powerPreference,
      });

      // Modern rendering setup
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, RENDERER_CONFIG.maxPixelRatio)
      );

      // Initialize scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(VIEWER_CONFIG.backgroundColor);

      // Initialize camera
      const aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.fov,
        aspect,
        CAMERA_CONFIG.near,
        CAMERA_CONFIG.far
      );
      this.camera.position.set(
        VIEWER_CONFIG.cameraPosition.x,
        VIEWER_CONFIG.cameraPosition.y,
        VIEWER_CONFIG.cameraPosition.z
      );

      // Initialize OrbitControls
      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.target.set(
        VIEWER_CONFIG.cameraTarget.x,
        VIEWER_CONFIG.cameraTarget.y,
        VIEWER_CONFIG.cameraTarget.z
      );
      this.controls.enableDamping = CONTROLS_CONFIG.enableDamping;
      this.controls.dampingFactor = CONTROLS_CONFIG.dampingFactor;
      this.controls.minDistance = CONTROLS_CONFIG.minDistance;
      this.controls.maxDistance = CONTROLS_CONFIG.maxDistance;
      this.controls.maxPolarAngle = CONTROLS_CONFIG.maxPolarAngle;
      this.controls.update();

      // Add event listener for camera rest (culling update)
      this.controls.addEventListener('end', () => {
        this.fragmentsService.updateCulling().catch(console.error);
      });

      // Add enhanced lighting for IFC models
      // Ambient light for overall illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      ambientLight.name = 'AmbientLight';
      this.scene.add(ambientLight);

      // Directional lights from multiple angles
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight1.position.set(10, 10, 5);
      directionalLight1.name = 'DirectionalLight1';
      this.scene.add(directionalLight1);
      
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight2.position.set(-10, 10, -5);
      directionalLight2.name = 'DirectionalLight2';
      this.scene.add(directionalLight2);
      
      // Hemisphere light for better outdoor scene rendering
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
      hemisphereLight.position.set(0, 20, 0);
      hemisphereLight.name = 'HemisphereLight';
      this.scene.add(hemisphereLight);
      
      console.log('✓ Enhanced lighting setup complete');

      // Add grid helper if enabled
      if (VIEWER_CONFIG.showGrid) {
        this.gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);
      }
      
      // DIAGNOSTIC: Add a test cube to verify rendering is working
      this.addTestCube();

      // Initialize stats
      if (VIEWER_CONFIG.showStats) {
        this.initStats();
      }

      // Setup resize observer
      this.setupResizeObserver(canvas);

      // Initialize FragmentsService
      await this.fragmentsService.initialize(this.scene, this.camera);

      // Initial render
      this.updateSize();
      this.renderer.render(this.scene, this.camera);

      console.log('IFC Viewer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize viewer:', error);
    }
  }

  /**
   * Initialize stats.js for memory monitoring
   */
  private initStats(): void {
    this.stats = new Stats();
    this.stats.showPanel(2); // 2 = MB memory panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.left = '0px';
    this.stats.dom.style.top = '0px';
    document.body.appendChild(this.stats.dom);
  }

  /**
   * Setup resize observer for responsive canvas
   */
  private setupResizeObserver(canvas: HTMLCanvasElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.runOutsideAngular(() => {
        this.updateSize();
      });
    });
    this.resizeObserver.observe(canvas);
  }

  /**
   * Update canvas and camera size
   */
  private updateSize(): void {
    const canvas = this.canvasRef().nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Stats begin
    this.stats?.begin();

    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Stats end
    this.stats?.end();
  }

  /**
   * Handle file selection
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !file.name.toLowerCase().endsWith('.ifc')) {
      console.error('Please select a valid .ifc file');
      return;
    }

    await this.loadIfcFile(file);

    // Reset input so the same file can be selected again
    input.value = '';
  }

  /**
   * Load and process IFC file
   */
  private async loadIfcFile(file: File): Promise<void> {
    this.isLoading.set(true);

    const modelState: ModelState = {
      id: crypto.randomUUID(),
      name: file.name.replace('.ifc', ''),
      loading: true,
      progress: 0,
    };

    this.currentModel.set(modelState);

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      console.log(`Loading IFC file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Load IFC without progress tracking (due to ThatOpen Components library limitations)
      // Progress will jump from 0% to 100% when complete
      const uuid = await this.fragmentsService.loadIfc(
        buffer,
        modelState.name
        // Progress callback omitted due to internal library issues with callbacks
      );

      // Update progress to 100% in Angular zone
      this.ngZone.run(() => {
        this.currentModel.update((state) =>
          state ? { ...state, progress: 100 } : state
        );
      });

      // Get the loaded model (FragmentsModel)
      const model = this.fragmentsService.getModel(uuid);
      if (!model) {
        throw new Error('Failed to retrieve loaded model');
      }

      console.log('Retrieved FragmentsModel from service:', model);
      console.log('Model type:', model.constructor.name);
      console.log('Model object:', model.object);

      // Add model to scene
      // In v3.x, FragmentsModel has an 'object' property that is a THREE.Object3D
      console.log('Adding model.object to scene...');
      console.log('Scene children before add:', this.scene.children.length);
      this.scene.add(model.object);
      console.log('Scene children after add:', this.scene.children.length);
      console.log('Model.object parent:', model.object.parent === this.scene ? 'scene' : 'other');
      
      // CRITICAL FIX: Manually add fragment meshes if model.object is empty
      // In some versions of ThatOpen Components, fragment meshes are not automatically
      // added as children of model.object and must be added explicitly
      if (model.object.children.length === 0 && model.items && model.items.size > 0) {
        console.warn('⚠️ model.object is empty but model has fragments - adding meshes manually');
        let addedCount = 0;
        for (const [key, fragment] of model.items) {
          if (fragment.mesh) {
            model.object.add(fragment.mesh);
            addedCount++;
          }
        }
        console.log(`✓ Manually added ${addedCount} fragment meshes to model.object`);
      }
      
      // DIAGNOSTIC: Log scene graph details
      this.logSceneGraphDetails(model.object);
      
      // DIAGNOSTIC: Add bounding box helper for visualization
      this.addBoundingBoxHelper(model.object);
      
      // FIX: Ensure all materials are visible
      this.ensureMaterialsVisible(model.object);
      
      // FIX: Force an immediate render to see if anything appears
      console.log('Forcing immediate render...');
      this.renderer.render(this.scene, this.camera);

      // Bind camera for culling
      this.fragmentsService.bindCamera(this.camera);

      // Center camera on model
      this.centerCameraOnModel(model.object);

      // Update model state - mark as fully loaded
      this.ngZone.run(() => {
        this.currentModel.update((state) =>
          state
            ? {
                ...state,
                loading: false,
                progress: 100,
                fragmentUuid: uuid,
              }
            : state
        );
      });

      console.log(`IFC file loaded successfully: ${file.name}`);
    } catch (error) {
      console.error('Failed to load IFC file:', error);
      
      // Run in Angular zone to ensure change detection
      this.ngZone.run(() => {
        this.currentModel.update((state) =>
          state
            ? {
                ...state,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            : state
        );
      });
    } finally {
      // Ensure loading state is reset in Angular zone
      this.ngZone.run(() => {
        this.isLoading.set(false);
      });
    }
  }

  /**
   * DIAGNOSTIC: Add test cube to verify rendering works
   */
  private addTestCube(): void {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      wireframe: false,
      side: THREE.DoubleSide
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.name = 'TestCube';
    cube.position.set(0, 1, 0);
    this.scene.add(cube);
    console.log('✓ Added red test cube at origin (0, 1, 0) to verify rendering');
  }

  /**
   * DIAGNOSTIC: Log detailed scene graph information
   */
  private logSceneGraphDetails(model: THREE.Object3D): void {
    console.log('=== Scene Graph Diagnostics ===');
    console.log('Model name:', model.name);
    console.log('Model type:', model.type);
    console.log('Model visible:', model.visible);
    console.log('Model children count:', model.children.length);
    
    let meshCount = 0;
    let vertexCount = 0;
    let materialCount = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        if (child.geometry) {
          const positions = child.geometry.attributes.position;
          if (positions) {
            vertexCount += positions.count;
          }
        }
        if (child.material) {
          materialCount++;
        }
      }
    });
    
    console.log('Total meshes:', meshCount);
    console.log('Total vertices:', vertexCount);
    console.log('Total materials:', materialCount);
    
    // Log bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    console.log('Bounding box center:', center.toArray());
    console.log('Bounding box size:', size.toArray());
    console.log('Max dimension:', Math.max(size.x, size.y, size.z));
    
    // Check if model is degenerate (zero size)
    if (size.lengthSq() === 0) {
      console.warn('⚠️ WARNING: Model has zero size! May not be visible.');
    }
    
    console.log('=== End Diagnostics ===');
  }
  
  /**
   * DIAGNOSTIC: Add bounding box helper for visualization
   */
  private addBoundingBoxHelper(model: THREE.Object3D): void {
    try {
      const box = new THREE.Box3().setFromObject(model);
      
      // Only add helper if box is valid
      if (box.isEmpty()) {
        console.warn('Cannot add bounding box helper - box is empty');
        return;
      }
      
      const helper = new THREE.Box3Helper(box, 0x00ff00);
      helper.name = 'BoundingBoxHelper';
      this.scene.add(helper);
      
      console.log('✓ Added green bounding box helper for visualization');
    } catch (error) {
      console.warn('Failed to add bounding box helper:', error);
    }
  }
  
  /**
   * FIX: Ensure all materials are visible and properly configured
   */
  private ensureMaterialsVisible(model: THREE.Object3D): void {
    console.log('=== Fixing Materials ===');
    
    let materialsFixed = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Ensure mesh is visible
        child.visible = true;
        child.frustumCulled = false; // Temporarily disable frustum culling for debugging
        
        // Fix materials
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach((material) => {
          if (material) {
            // Ensure material is visible
            material.visible = true;
            
            // Fix transparency issues
            if (material.transparent && material.opacity === 0) {
              material.opacity = 1.0;
              materialsFixed++;
            }
            
            // Ensure side is visible
            if (material.side === THREE.FrontSide) {
              material.side = THREE.DoubleSide; // Render both sides
              materialsFixed++;
            }
            
            // Force material update
            material.needsUpdate = true;
            
            // If it's a MeshBasicMaterial or MeshStandardMaterial, ensure it has color
            if ('color' in material && material.color) {
              // Ensure color is not black (which might be invisible with certain lighting)
              if (material.color.getHex() === 0x000000) {
                material.color.setHex(0xaaaaaa); // Set to gray
                materialsFixed++;
              }
            }
          }
        });
      }
    });
    
    console.log(`✓ Fixed ${materialsFixed} material issues`);
    console.log('=== End Material Fixes ===');
  }

  /**
   * Center camera on loaded model
   */
  private centerCameraOnModel(model: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(model);
    
    // Check if box is valid
    if (box.isEmpty()) {
      console.error('Cannot center camera - bounding box is empty!');
      // Fallback to default camera position
      this.camera.position.set(10, 10, 10);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Ensure maxDim is not zero
    if (maxDim === 0) {
      console.error('Model has zero dimensions!');
      this.camera.position.set(10, 10, 10);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }
    
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Add some padding

    this.camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
    this.controls.target.copy(center);
    this.controls.update();
    
    console.log('Camera positioned at:', this.camera.position.toArray());
    console.log('Camera looking at:', this.controls.target.toArray());
    console.log('Camera distance:', this.camera.position.distanceTo(this.controls.target));
    
    // FIX: Adjust camera near/far planes if needed for the model size
    const distanceToCenter = this.camera.position.distanceTo(center);
    const recommendedNear = Math.max(0.1, distanceToCenter / 100);
    const recommendedFar = Math.max(1000, (distanceToCenter + maxDim) * 2);
    
    if (this.camera.near > recommendedNear || this.camera.far < recommendedFar) {
      console.warn(`⚠️ Camera near/far planes may need adjustment:`);
      console.warn(`  Current: near=${this.camera.near}, far=${this.camera.far}`);
      console.warn(`  Recommended: near=${recommendedNear.toFixed(2)}, far=${recommendedFar.toFixed(2)}`);
      
      // Automatically adjust if needed
      this.camera.near = recommendedNear;
      this.camera.far = recommendedFar;
      this.camera.updateProjectionMatrix();
      console.log('✓ Camera planes adjusted automatically');
    }

      // Update culling after camera movement
      this.fragmentsService.updateCulling().catch(console.error);
  }

  /**
   * Download current model as .frag file
   */
  async downloadFragment(): Promise<void> {
    const model = this.currentModel();
    if (!model?.fragmentUuid) {
      console.error('No model loaded');
      return;
    }

    try {
      const buffer = await this.fragmentsService.exportFragment(model.fragmentUuid);
      if (!buffer) {
        throw new Error('Failed to export fragment');
      }

      // Create blob and download
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${model.name}.frag`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);

      console.log(`Fragment exported: ${model.name}.frag`);
    } catch (error) {
      console.error('Failed to download fragment:', error);
    }
  }

  /**
   * Open file picker
   */
  openFilePicker(): void {
    this.fileInputRef().nativeElement.click();
  }

  /**
   * Cleanup resources on destroy
   */
  ngOnDestroy(): void {
    try {
      // Cancel animation frame
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      // Remove stats
      if (this.stats?.dom) {
        this.stats.dom.remove();
      }

      // Dispose controls
      if (this.controls) {
        this.controls.dispose();
      }

      // Dispose resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }

      // Dispose scene objects
      this.scene?.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });

      // Dispose renderer
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }

      // Dispose fragments service
      this.fragmentsService.dispose().catch(console.error);

      console.log('IFC Viewer disposed successfully');
    } catch (error) {
      console.error('Error during viewer disposal:', error);
    }
  }
}

