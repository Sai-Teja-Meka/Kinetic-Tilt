import * as THREE from 'three';
import { CollisionDetector } from './CollisionDetector';

interface Goal {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  wasColliding: boolean;
  seed: number;
}

export class GoalSystem {
  private goals: Goal[];
  private collisionDetector: CollisionDetector;
  
  private readonly WORLD_SIZE = 20;
  private readonly MIN_EDGE_DIST = 3; 
  private readonly GOAL_RADIUS = 1.0;
  private readonly VISUAL_RADIUS = 0.6; 
  private readonly TUBE_THICKNESS = 0.1;

  constructor(scene: THREE.Scene, collisionDetector: CollisionDetector) {
    this.collisionDetector = collisionDetector;
    this.goals = [];
    this.spawnGoal(scene);
  }

  // FIX 2: Reset Method
  public reset(scene: THREE.Scene): void {
    // 1. Cleanup Visuals
    this.goals.forEach(goal => {
      scene.remove(goal.mesh);
      goal.mesh.geometry.dispose();
      (goal.mesh.material as THREE.Material).dispose();
    });
    
    // 2. Clear Data
    this.goals = [];
    
    // 3. Spawn Fresh Goal
    this.spawnGoal(scene);
    console.log('GoalSystem reset - spawned fresh goal');
  }

  private createGoalMesh(): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(
      this.VISUAL_RADIUS, 
      this.TUBE_THICKNESS, 
      16, 
      32
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0xffaa00,    
      emissive: 0xff4400, 
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  private spawnGoal(scene: THREE.Scene): void {
    let position: THREE.Vector3 | null = null;
    const maxAttempts = 20;
    const spawnRange = this.WORLD_SIZE - (this.MIN_EDGE_DIST * 2);

    for (let i = 0; i < maxAttempts; i++) {
      const x = (Math.random() - 0.5) * spawnRange;
      const z = (Math.random() - 0.5) * spawnRange;
      position = new THREE.Vector3(x, 0.5, z);
      break; 
    }

    if (!position) {
      position = new THREE.Vector3(0, 0.5, -5);
    }

    const mesh = this.createGoalMesh();
    mesh.position.copy(position);
    scene.add(mesh);

    this.goals.push({
      mesh,
      position,
      radius: this.GOAL_RADIUS,
      wasColliding: false,
      seed: Math.random() * 100 
    });
  }

  public update(deltaTime: number, heroPosition: THREE.Vector3, scene: THREE.Scene): number | null {
    let collectedGoalIndex: number | null = null;
    const time = Date.now() * 0.001; 

    this.goals.forEach((goal, index) => {
      goal.mesh.rotation.z += deltaTime * 1.5; 
      const pulseSpeed = 2.0;
      const scale = 1.0 + Math.sin(time * pulseSpeed + goal.seed) * 0.15;
      goal.mesh.scale.set(scale, scale, scale);
      goal.mesh.position.y = 0.5 + Math.sin(time * 1.5 + goal.seed) * 0.1;

      const isColliding = this.collisionDetector.checkGoalEntry(
        heroPosition,
        0.5, 
        goal.position,
        goal.radius,
        0.7 
      );

      if (isColliding && !goal.wasColliding) {
        collectedGoalIndex = index;
      }
      goal.wasColliding = isColliding;
    });

    if (collectedGoalIndex !== null) {
      const goal = this.goals[collectedGoalIndex];
      scene.remove(goal.mesh);
      goal.mesh.geometry.dispose();
      (goal.mesh.material as THREE.Material).dispose();
      this.goals.splice(collectedGoalIndex, 1);
      this.spawnGoal(scene);
    }

    return collectedGoalIndex;
  }

  public getGoals() { return this.goals; }
}