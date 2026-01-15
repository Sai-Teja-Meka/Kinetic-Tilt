import * as THREE from 'three';

/**
 * CollisionDetector
 * Responsibility: Pure math checks for gameplay triggers.
 * Stateless: Does not store game state, only evaluates current positions.
 */
export class CollisionDetector {
  
  /**
   * Checks if the Hero Sphere has entered a Goal Zone.
   * Uses Squared Distance for performance (avoids Math.sqrt).
   * * @param heroPos - Current position of the hero
   * @param heroRadius - Radius of the hero (usually 0.5)
   * @param goalPos - Center position of the goal
   * @param goalRadius - Radius of the goal zone
   * @param threshold - (0.0 to 1.0) How "deep" into the goal must they be? 
   * 1.0 = Edge touch, 0.0 = Dead center. Default 0.8.
   */
  public checkGoalEntry(
    heroPos: THREE.Vector3, 
    heroRadius: number, 
    goalPos: THREE.Vector3, 
    goalRadius: number,
    threshold: number = 0.8 
  ): boolean {
    // 1. Calculate distance on the X-Z plane (ignore Y height)
    const dx = heroPos.x - goalPos.x;
    const dz = heroPos.z - goalPos.z;
    const distSq = dx*dx + dz*dz;

    // 2. Define the "Success Radius"
    // We combine radii, then multiply by threshold to require overlap
    // Example: Hero(0.5) + Goal(1.0) = 1.5 touch distance.
    // Threshold 0.5 means dist must be < 0.75 (Hero must be halfway in)
    // Actually, simpler logic: Is Hero Center inside Goal Radius?
    // Let's strictly check: Distance < (GoalRadius - HeroRadius * tolerance)
    // This ensures the sphere is fully contained or mostly contained.
    
    // Revised Logic: Distance Check
    // Success if Hero Center is within (GoalRadius * threshold)
    const triggerDistance = goalRadius * threshold;
    
    return distSq < (triggerDistance * triggerDistance);
  }

  /**
   * Helper to visualize the trigger zone (Debug only)
   */
  public getDebugVisual(goalPos: THREE.Vector3, radius: number): THREE.Mesh {
    const geometry = new THREE.RingGeometry(radius * 0.9, radius, 32);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.5 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Lay flat on X-Z plane
    mesh.position.copy(goalPos);
    mesh.position.y = 0.05; // Slightly above floor
    return mesh;
  }
}