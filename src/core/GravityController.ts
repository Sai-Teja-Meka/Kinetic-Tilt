import * as THREE from 'three';

/**
 * GravityController
 * * Responsibility: Maps raw DeviceOrientation (degrees) -> Physics World Vector.
 */
export class GravityController {
  // CONFIGURATION
  private readonly MAX_TILT_ANGLE = 45; 
  private readonly MAX_BETA_SAFE = 80;  
  private readonly GRAVITY_MULTIPLIER = 1.5; 
  private readonly DEADZONE = 2.0; 
  
  private smoothingFactor = 0.15; 

  // STATE
  private currentVector: THREE.Vector3;
  private targetVector: THREE.Vector3;
  
  // OBSERVABILITY
  private lastBeta: number = 0;
  private lastGamma: number = 0;
  
  constructor() {
    this.currentVector = new THREE.Vector3(0, 0, 0);
    this.targetVector = new THREE.Vector3(0, 0, 0);
  }

  public update(beta: number, gamma: number): void {
    // 1. DEADZONE FILTER
    // Ignore micro-tilts to prevent perpetual drift
    if (Math.abs(beta) < this.DEADZONE) beta = 0;
    if (Math.abs(gamma) < this.DEADZONE) gamma = 0;

    // 2. STORE PROCESSED VALUES (For HUD/Debug)
    this.lastBeta = beta;
    this.lastGamma = gamma;

    // 3. GIMBAL LOCK PROTECTION
    if (Math.abs(beta) > 85) {
      console.warn('Approaching gimbal lock zone. Limit device tilt.');
    }
    const betaClamped = THREE.MathUtils.clamp(beta, -this.MAX_BETA_SAFE, this.MAX_BETA_SAFE);

    // 4. NORMALIZE & CLAMP
    const xIntensity = THREE.MathUtils.clamp(gamma / this.MAX_TILT_ANGLE, -1, 1);
    const zIntensity = THREE.MathUtils.clamp(betaClamped / this.MAX_TILT_ANGLE, -1, 1);

    // 5. MAP TO TARGET VECTOR (+Beta -> -Z)
    this.targetVector.set(
      xIntensity * this.GRAVITY_MULTIPLIER, 
      0, 
      -zIntensity * this.GRAVITY_MULTIPLIER 
    );
  }

  public getGravityVector(): THREE.Vector3 {
    this.currentVector.lerp(this.targetVector, this.smoothingFactor);
    return this.currentVector;
  }

  public reset(): void {
    this.currentVector.set(0, 0, 0);
    this.targetVector.set(0, 0, 0);
    this.lastBeta = 0;
    this.lastGamma = 0;
  }

  public setSmoothing(factor: number): void {
    this.smoothingFactor = factor;
  }

  // OBSERVABILITY GETTERS
  public getLastBeta(): number { return this.lastBeta; }
  public getLastGamma(): number { return this.lastGamma; }
}