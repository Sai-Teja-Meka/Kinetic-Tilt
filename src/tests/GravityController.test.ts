import { describe, it, expect, beforeEach } from 'vitest';
import { GravityController } from '../core/GravityController';

describe('GravityController', () => {
  let controller: GravityController;

  beforeEach(() => {
    controller = new GravityController();
    // FIX 4: Disable smoothing for instant deterministic testing
    controller.setSmoothing(1.0);
  });

  it('should initialize with zero gravity', () => {
    const v = controller.getGravityVector();
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });

  it('should map positive gamma (right tilt) to positive X', () => {
    controller.update(0, 45); 
    // No loop needed due to setSmoothing(1.0)
    const v = controller.getGravityVector();
    expect(v.x).toBeCloseTo(9.8, 0.1);
  });

  it('should map positive beta (top up) to negative Z (into screen)', () => {
    // FIX 1 Verification
    controller.update(45, 0); 
    const v = controller.getGravityVector();
    expect(v.z).toBeCloseTo(-9.8, 0.1);
  });

  it('should clamp gravity when tilt exceeds MAX_TILT', () => {
    controller.update(0, 90);
    const v = controller.getGravityVector();
    expect(v.x).toBeCloseTo(9.8, 0.1);
  });

  it('should handle gimbal lock zone safely', () => {
    // FIX 2 Verification
    // Input 89 degrees (unsafe zone), should be clamped to 80
    controller.update(89, 0);
    
    // Expected: (80 clamped / 45 max) = 1.0 (clamped to 1) * -9.8
    const v = controller.getGravityVector();
    expect(v.z).toBeCloseTo(-9.8, 0.1); 
  });
});