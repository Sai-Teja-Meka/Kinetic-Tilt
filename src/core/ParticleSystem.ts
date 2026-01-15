import * as THREE from 'three';

interface BurstParticle {
  active: boolean;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

export class ParticleSystem {
  // Ambient Swarm
  private mesh: THREE.InstancedMesh;
  private count: number;
  private dummy: THREE.Object3D; 
  private positions: Float32Array; 
  private velocities: Float32Array;

  // Burst System (New)
  private burstMesh: THREE.InstancedMesh;
  private burstCount: number = 100; // Pool size
  private burstParticles: BurstParticle[];
  private burstPositions: Float32Array;
  
  // Tuning
  private readonly WORLD_SIZE = 20;
  private readonly HALF_SIZE = 10;
  private readonly INFLUENCE_RADIUS = 2.5;
  private readonly INFLUENCE_SQ = this.INFLUENCE_RADIUS * this.INFLUENCE_RADIUS;
  private readonly DRAG = 0.95; 

  constructor(scene: THREE.Scene, count: number = 2000) {
    this.count = count;
    this.dummy = new THREE.Object3D();

    // --- 1. AMBIENT SWARM (Blue) ---
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

    // --- 2. BURST SYSTEM (Gold) ---
    const burstMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00, // Gold
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 1.0,
      depthWrite: false
    });

    this.burstMesh = new THREE.InstancedMesh(geometry, burstMaterial, this.burstCount);
    this.burstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Move burst particles off-screen initially
    for(let i=0; i<this.burstCount; i++) {
        this.dummy.position.set(0, -1000, 0);
        this.dummy.updateMatrix();
        this.burstMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.burstPositions = new Float32Array(this.burstCount * 3);
    this.burstParticles = [];
    for(let i=0; i<this.burstCount; i++) {
        this.burstParticles.push({
            active: false,
            life: 0,
            maxLife: 1.0,
            velocity: new THREE.Vector3()
        });
    }

    scene.add(this.burstMesh);
  }

  // ... [initParticles method unchanged] ...
  public reset(): void {
    console.log('Resetting particle system...');
    this.initParticles();
    // Clear bursts
    this.burstParticles.forEach(p => p.active = false);
    for(let i=0; i<this.burstCount; i++) {
        this.dummy.position.set(0, -1000, 0);
        this.dummy.updateMatrix();
        this.burstMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.burstMesh.instanceMatrix.needsUpdate = true;
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

  /**
   * Spawns an explosion of particles at the given position
   */
  public createBurst(position: THREE.Vector3): void {
    let spawned = 0;
    const particlesToSpawn = 30;

    // Find inactive particles in the pool
    for (let i = 0; i < this.burstCount; i++) {
        if (spawned >= particlesToSpawn) break;
        
        const p = this.burstParticles[i];
        if (!p.active) {
            p.active = true;
            p.life = 1.0;
            p.maxLife = 0.8 + Math.random() * 0.4; // Random life 0.8-1.2s
            
            // Set Position
            const idx = i * 3;
            this.burstPositions[idx] = position.x;
            this.burstPositions[idx+1] = position.y;
            this.burstPositions[idx+2] = position.z;

            // Set Velocity (Explosion)
            // Random direction in sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 5 + Math.random() * 5; // 5-10 units/sec

            p.velocity.set(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta),
                speed * Math.cos(phi)
            );

            spawned++;
        }
    }
  }

  public update(deltaTime: number, heroPosition: THREE.Vector3) {
    // --- 1. UPDATE AMBIENT SWARM ---
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

    // --- 2. UPDATE BURST PARTICLES ---
    let activeBursts = 0;
    for (let i = 0; i < this.burstCount; i++) {
        const p = this.burstParticles[i];
        if (p.active) {
            activeBursts++;
            const idx = i * 3;

            // Physics (Gravity applies to burst)
            p.velocity.y -= 9.8 * deltaTime; 

            this.burstPositions[idx]   += p.velocity.x * deltaTime;
            this.burstPositions[idx+1] += p.velocity.y * deltaTime;
            this.burstPositions[idx+2] += p.velocity.z * deltaTime;

            // Floor collision (Bounce)
            if (this.burstPositions[idx+1] < 0.08) {
                this.burstPositions[idx+1] = 0.08;
                p.velocity.y *= -0.5; // Dampened bounce
            }

            // Matrix Update
            this.dummy.position.set(
                this.burstPositions[idx],
                this.burstPositions[idx+1],
                this.burstPositions[idx+2]
            );
            
            // Scale down as they die
            const scale = p.life / p.maxLife;
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();
            this.burstMesh.setMatrixAt(i, this.dummy.matrix);

            // Lifecycle
            p.life -= deltaTime;
            if (p.life <= 0) {
                p.active = false;
                // Hide it
                this.dummy.position.set(0, -1000, 0); // Move offscreen
                this.dummy.scale.set(1,1,1);
                this.dummy.updateMatrix();
                this.burstMesh.setMatrixAt(i, this.dummy.matrix);
            }
        }
    }
    
    if (activeBursts > 0) {
        this.burstMesh.instanceMatrix.needsUpdate = true;
    }
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