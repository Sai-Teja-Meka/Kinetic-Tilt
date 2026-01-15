import * as THREE from 'three';
import { GravityController } from '../core/GravityController';

export class DebugScene {
  private canvas: HTMLCanvasElement;
  private gravityController: GravityController;
  
  // Three.js Core
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  
  // Objects
  private heroSphere: THREE.Mesh;
  private gravityArrow: THREE.ArrowHelper;
  private animationId: number = 0;

  constructor(canvas: HTMLCanvasElement, gravityController: GravityController) {
    this.canvas = canvas;
    this.gravityController = gravityController;

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // CAMERA
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 15); // Adjusted: Higher up to see walls
    this.camera.lookAt(0, 0, 0);

    // SCENE & LIGHTS
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);
    this.scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x888888));

    // HERO SPHERE
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    // Add texture or wireframe to see rotation later
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4488ff, metalness: 0.6, roughness: 0.3 
    });
    this.heroSphere = new THREE.Mesh(geometry, material);
    this.heroSphere.position.set(0, 0.5, 0);
    this.scene.add(this.heroSphere);

    // GRAVITY ARROW
    this.gravityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.5, 0), 1, 0x00ff00
    );
    this.scene.add(this.gravityArrow);

    window.addEventListener('resize', this.handleResize.bind(this));
  }

  // INTERFACE FOR PHYSICS
  public getHeroSphere(): THREE.Mesh {
    return this.heroSphere;
  }
  
  public getScene(): THREE.Scene {
    return this.scene;
  }
  
  public start(): void {
    if (!this.animationId) this.animate();
  }
  
  private animate = (): void => {
    // Visual Updates Only (Gravity Arrow)
    const gravityVector = this.gravityController.getGravityVector();
    const magnitude = gravityVector.length();

    if (magnitude > 0.01) {
      const direction = gravityVector.clone().normalize();
      if (!isNaN(direction.x) && !isNaN(direction.y) && !isNaN(direction.z)) {
        this.gravityArrow.setDirection(direction);
      }
      // Keep visual arrow attached to hero
      this.gravityArrow.position.copy(this.heroSphere.position); 

      const visualLength = Math.max(0.5, (magnitude / 9.8) * 3.0);
      this.gravityArrow.setLength(visualLength);

      let color = 0x00ff00;
      if (magnitude > 4.9 && magnitude <= 7.84) color = 0xffff00;
      else if (magnitude > 7.84) color = 0xff0000;
      this.gravityArrow.setColor(color);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
