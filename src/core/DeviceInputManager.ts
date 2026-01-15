import { InputState, TelemetryEvent } from './types';
import * as THREE from 'three';

export class DeviceInputManager {
  public state: InputState;
  private onGravityUpdate: (beta: number, gamma: number) => void;
  // Callback reference for internal use
  private callback: (beta: number, gamma: number) => void;

  constructor(gravityCallback: (beta: number, gamma: number) => void) {
    this.onGravityUpdate = gravityCallback;
    this.callback = gravityCallback; // Alias for easier access
    this.state = {
      isSupported: false,
      permissionGranted: false,
      usingFallback: false,
      debugMode: false,
    };

    this.detectCapabilities();
    this.setupKeyboardControls();
  }

  private detectCapabilities() {
    if (window.DeviceOrientationEvent !== undefined) {
      this.state.isSupported = true;
      setTimeout(() => {
        // If no permission granted & no fallback active after 1s, force fallback
        if (!this.state.permissionGranted && !this.state.usingFallback) {
          console.log("No orientation data detected. Activating Touch/Mouse Fallback.");
          this.enableMouseFallback();
        }
      }, 1000);
    } else {
      this.logTelemetry('UNSUPPORTED_DEVICE');
      this.enableMouseFallback();
    }
  }

  private setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.reset();
      if (e.code === 'KeyD') {
        this.state.debugMode = !this.state.debugMode;
        console.log(`Debug Mode: ${this.state.debugMode}`);
      }
    });
  }

  public reset() {
    this.onGravityUpdate(0, 0);
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      this.state.permissionGranted = true;
      this.startListening();
      return true;
    }

    try {
      const response = await (DeviceOrientationEvent as any).requestPermission();
      if (response === 'granted') {
        this.state.permissionGranted = true;
        this.startListening();
        return true;
      } else {
        this.handleDenial();
        return false;
      }
    } catch (error) {
      console.error("Permission request error:", error);
      this.handleDenial();
      return false;
    }
  }

  private startListening() {
    window.addEventListener('deviceorientation', (event) => {
      if (event.beta === null || event.gamma === null) return;
      this.onGravityUpdate(event.beta, event.gamma);
    });
  }

  // FIX 1: Enhanced Touch/Mouse Fallback
  private enableMouseFallback(): void {
    console.log('[Input] Using Mouse/Touch Fallback');
    this.state.usingFallback = true;
    this.logTelemetry('FALLBACK_TRIGGERED');

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    // --- Mouse Events ---
    window.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = e.clientX;
      currentY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX;
      currentY = e.clientY;
      this.updateFromInputPosition(currentX, currentY, startX, startY);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      this.callback(0, 0); // Reset to neutral on release
    });

    // --- Touch Events ---
    window.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Critical: Prevent scrolling
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      currentX = touch.clientX;
      currentY = touch.clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Critical: Prevent scrolling
      if (!isDragging) return;
      const touch = e.touches[0];
      currentX = touch.clientX;
      currentY = touch.clientY;
      this.updateFromInputPosition(currentX, currentY, startX, startY);
    }, { passive: false });

    window.addEventListener('touchend', () => {
      isDragging = false;
      this.callback(0, 0); // Reset to neutral
    });

    window.addEventListener('touchcancel', () => {
      isDragging = false;
      this.callback(0, 0);
    });
  }

  private updateFromInputPosition(currentX: number, currentY: number, startX: number, startY: number): void {
    // Calculate offset from start position (Virtual Joystick logic)
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Sensitivity Tuning
    const SENSITIVITY = 0.3; 
    
    // Convert to degrees
    // Note: Y-Axis inversion logic from previous fix
    // Drag Down (+Y) -> Tilt Back (+Beta) -> Force Forward (-Z)
    // Actually, wait. Let's stick to the "Drag Object" metaphor?
    // If I drag DOWN, I want the ball to come TOWARDS me (Positive Z Force).
    // Positive Z Force comes from Negative Beta (Tilt Forward/Down).
    // So: Drag Down (+Y) -> Negative Beta.
    const beta = THREE.MathUtils.clamp(-deltaY * SENSITIVITY, -45, 45);
    const gamma = THREE.MathUtils.clamp(deltaX * SENSITIVITY, -45, 45);
    
    this.callback(beta, gamma);
  }

  private handleDenial() {
    this.logTelemetry('PERMISSION_DENIED');
    alert("Motion sensors disabled. Check Settings > Safari > Motion & Orientation Access.");
    this.enableMouseFallback();
  }

  private logTelemetry(event: TelemetryEvent['event']) {
    console.warn(`[TELEMETRY]: ${event} at ${Date.now()}`);
  }
}