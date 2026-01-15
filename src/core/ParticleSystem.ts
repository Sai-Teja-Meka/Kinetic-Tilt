import * as THREE from 'three';

export class ParticleSystem {
  private mesh: THREE.InstancedMesh;
  private count: number;
  private dummy: THREE.Object3D; 
  
  private positions: Float32Array; 
  private velocities: Float32Array;

  private readonly WORLD_SIZE = 20;
  private readonly HALF_SIZE = 10;
  private readonly INFLUENCE_RADIUS = 2.5;
  private readonly INFLUENCE_SQ = this.INFLUENCE_RADIUS * this.INFLUENCE_RADIUS;
  private readonly DRAG = 0.95; 

  constructor(scene: THREE.Scene, count: number = 2000) {
    this.count = count;
    this.dummy = new THREE.Object3D();

    const geometry = new THREE.IcosahedronGeometry(0.08, 0); 
    const material = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      depthWrite: false 
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    
    this.initParticles();
    scene.add(this.mesh);
  }

  // FIX 3: Reset Method
  public reset(): void {
    console.log('Resetting particle system...');
    this.initParticles();
  }

  private initParticles() {
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      let x = 0, z = 0;
      let valid = false;
      let tries = 0;

      while (!valid && tries < 10) {
        x = (Math.random() - 0.5) * this.WORLD_SIZE;
        z = (Math.random() - 0.5) * this.WORLD_SIZE;
        if (x*x + z*z > 4) valid = true; 
        tries++;
      }

      this.positions[idx] = x;
      this.positions[idx+1] = 0.2; 
      this.positions[idx+2] = z;

      this.velocities[idx] = (Math.random() - 0.5) * 0.1;
      this.velocities[idx+1] = 0;
      this.velocities[idx+2] = (Math.random() - 0.5) * 0.1;

      this.updateInstanceMatrix(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public update(deltaTime: number, heroPosition: THREE.Vector3) {
    const heroX = heroPosition.x;
    const heroZ = heroPosition.z;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      
      this.positions[idx]   += this.velocities[idx] * deltaTime;
      this.positions[idx+2] += this.velocities[idx+2] * deltaTime;

      const dx = this.positions[idx] - heroX;
      const dz = this.positions[idx+2] - heroZ;
      const distSq = dx*dx + dz*dz;

      if (distSq < this.INFLUENCE_SQ) {
        const dist = Math.sqrt(distSq);
        const pushFactor = (this.INFLUENCE_RADIUS - dist) * 5.0 * deltaTime; 
        
        if (dist > 0.001) {
            this.velocities[idx]   += (dx / dist) * pushFactor;
            this.velocities[idx+2] += (dz / dist) * pushFactor;
        }
      }

      this.velocities[idx]   *= this.DRAG;
      this.velocities[idx+2] *= this.DRAG;

      if (this.positions[idx] > this.HALF_SIZE) this.positions[idx] -= this.WORLD_SIZE;
      else if (this.positions[idx] < -this.HALF_SIZE) this.positions[idx] += this.WORLD_SIZE;
      
      if (this.positions[idx+2] > this.HALF_SIZE) this.positions[idx+2] -= this.WORLD_SIZE;
      else if (this.positions[idx+2] < -this.HALF_SIZE) this.positions[idx+2] += this.WORLD_SIZE;

      this.updateInstanceMatrix(i);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private updateInstanceMatrix(index: number) {
    const idx = index * 3;
    this.dummy.position.set(
      this.positions[idx],
      this.positions[idx+1],
      this.positions[idx+2]
    );
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(index, this.dummy.matrix);
  }
}