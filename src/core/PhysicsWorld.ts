import Matter from 'matter-js';
import * as THREE from 'three';

// SCALING: Matter.js struggles with small bodies (< 1 unit).
// We scale the physics world up by 10x to ensure stable collision detection.
const PHYSICS_SCALE = 10;

export class PhysicsWorld {
  private engine: Matter.Engine;
  private heroBody: Matter.Body | null = null;
  private meshBodyPairs: Array<{ mesh: THREE.Mesh, body: Matter.Body }> = [];

  constructor() {
    this.engine = Matter.Engine.create({
      // We disable internal gravity calculations because we apply our own
      // vector manually based on device orientation.
      gravity: { x: 0, y: 0, scale: 0.001 } 
    });
  }

  /**
   * Links a Three.js Mesh to a Matter.js Physics Body.
   * Maps Three.js (X, Z) -> Matter.js (X, Y)
   */
  public addHeroSphere(mesh: THREE.Mesh): Matter.Body {
    // 1. Get Radius from Geometry (assuming SphereGeometry)
    // Default to 0.5 if not found, but cast to specific type
    const radius = (mesh.geometry as THREE.SphereGeometry).parameters.radius || 0.5;

    // 2. Create Body
    const body = Matter.Bodies.circle(
      mesh.position.x * PHYSICS_SCALE,
      mesh.position.z * PHYSICS_SCALE,
      radius * PHYSICS_SCALE,
      { 
        // TUNING: Heavier, more controllable physics
        restitution: 0.3,   // Less bouncy (was 0.4)
        friction: 0.075,     // Higher rolling resistance (was 0.01)
        frictionAir: 0.075,  // High drag to prevent infinite acceleration (was 0.01)
        density: 0.001,
        label: 'Hero'
      }
    );
    
    // 3. Add to World & Track
    Matter.Composite.add(this.engine.world, body);
    this.heroBody = body;
    this.meshBodyPairs.push({ mesh, body });
    
    return body;
  }

  /**
   * Creates the 20x20 unit boundary box around the play area.
   */
  public addBoundaries(): Matter.Body[] {
    const worldSize = 20;
    
    // TUNING: Thicker walls (5 units) to prevent tunneling at high speeds
    const wallThickness = 5; 
    
    const halfSize = (worldSize / 2) * PHYSICS_SCALE;
    const thickness = wallThickness * PHYSICS_SCALE;
    
    // Extend length to cover corners fully with new thickness
    const fullSize = (worldSize + wallThickness * 2) * PHYSICS_SCALE; 

    // Matter.js rectangles are defined by (Center X, Center Y, Width, Height)
    // Note: Y represents Three.js Z (Depth)
    const walls = [
      // Top Wall (Positive Z / Positive Y in Matter)
      Matter.Bodies.rectangle(0, halfSize + (thickness/2), fullSize, thickness, { isStatic: true, label: 'Wall_Top' }),
      // Bottom Wall (Negative Z / Negative Y in Matter)
      Matter.Bodies.rectangle(0, -halfSize - (thickness/2), fullSize, thickness, { isStatic: true, label: 'Wall_Bottom' }),
      // Left Wall
      Matter.Bodies.rectangle(-halfSize - (thickness/2), 0, thickness, fullSize, { isStatic: true, label: 'Wall_Left' }),
      // Right Wall
      Matter.Bodies.rectangle(halfSize + (thickness/2), 0, thickness, fullSize, { isStatic: true, label: 'Wall_Right' })
    ];

    walls.forEach(wall => Matter.Composite.add(this.engine.world, wall));
    return walls;
  }

  /**
   * The Deterministic Update Step
   * @param deltaTime - Fixed time step (16.66ms)
   * @param gravityVector - Input from Device Controller
   */
  public update(deltaTime: number, gravityVector: THREE.Vector3) {
    // 1. Map Gravity: Three.js (X, 0, Z) -> Matter.js (X, Y)
    // Matter.js gravity is usually normalized, but we'll feed direct vector
    // and rely on engine.gravity.scale to tune it.
    this.engine.gravity.x = gravityVector.x;
    this.engine.gravity.y = gravityVector.z; // Z becomes Y

    // 2. Step Simulation
    Matter.Engine.update(this.engine, deltaTime);

    // TUNING: Velocity Clamping (Anti-Tunneling)
    if (this.heroBody) {
      // 15 units/sec (scaled) is fast enough for fun, slow enough for safety
      const maxSpeed = 15; 
      const velocity = this.heroBody.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        Matter.Body.setVelocity(this.heroBody, {
          x: velocity.x * scale,
          y: velocity.y * scale
        });
      }
    }
  }

  /**
   * Sync Physics State -> Visual State
   * Call this AFTER physics updates, inside the render loop (or main loop).
   */
  public syncVisuals() {
    this.meshBodyPairs.forEach(({ mesh, body }) => {
      // Position Sync: Divide by Scale to get back to World Units
      mesh.position.x = body.position.x / PHYSICS_SCALE;
      mesh.position.z = body.position.y / PHYSICS_SCALE;
      
      // Y is constant (floor plane) for now
      mesh.position.y = 0.5;

      // Rotation Sync: Visual cues for rolling
      // In 2D, angle is Z-rotation. In 3D rolling on floor, it maps to X/Z rotation complexly,
      // but for simple visuals, mapping angle to Y gives a spin effect, 
      // or we calculate rolling axis. For Phase 2, we just ensure it doesn't look static.
      // A simple approximation for "rolling direction" is tricky in 1:1 map.
      // We will leave rotation simple or strictly based on velocity later.
      // For now, let's just apply the Z-spin to Y-spin to show activity.
      // mesh.rotation.y = -body.angle; 
      
      // Better Rolling Visual (Phase 3 Prep):
      // Actually, we want the ball to roll "over" the ground.
      // That requires calculating axis of rotation based on velocity.
      // Leaving rotation logic explicitly simple for Phase 2 foundation.
    });
  }

  public getHeroBody() { return this.heroBody; }
}