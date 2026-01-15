import * as THREE from 'three';

export class ScreenShake {
  private camera: THREE.Camera;
  private originalPosition: THREE.Vector3;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeDecay: number = 0.9; // How fast shake stops

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.originalPosition = camera.position.clone();
  }

  /**
   * Trigger screen shake
   * @param intensity - Shake amount (0.1 = subtle, 0.5 = strong)
   * @param duration - How long to shake in seconds
   */
  public shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  /**
   * Update shake effect (call every frame)
   */
  public update(deltaTime: number): void {
    if (this.shakeDuration <= 0) {
      // Smoothly return camera to original position
      // Only if we are not actively shaking
      if (this.camera.position.distanceToSquared(this.originalPosition) > 0.001) {
         this.camera.position.lerp(this.originalPosition, 0.1);
      }
      return;
    }

    // Apply random offset
    // Reduce intensity by decay factor
    this.shakeIntensity = Math.max(0, this.shakeIntensity - (this.shakeDecay * deltaTime));
    
    const rx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    const ry = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    const rz = (Math.random() - 0.5) * 2 * this.shakeIntensity;

    this.camera.position.set(
      this.originalPosition.x + rx,
      this.originalPosition.y + ry,
      this.originalPosition.z + rz
    );

    this.shakeDuration -= deltaTime;
    
    // Safety clamp
    if (this.shakeDuration < 0) this.shakeDuration = 0;
  }

  /**
   * Update camera's "rest" position if camera moves during gameplay
   * (Not used currently since camera is static, but good for future proofing)
   */
  public updateOrigin(newPosition: THREE.Vector3): void {
    this.originalPosition.copy(newPosition);
  }
}