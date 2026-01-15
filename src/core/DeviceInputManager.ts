import { InputState, TelemetryEvent } from './types';

export class DeviceInputManager {
  public state: InputState;
  private onGravityUpdate: (beta: number, gamma: number) => void;

  constructor(gravityCallback: (beta: number, gamma: number) => void) {
    this.onGravityUpdate = gravityCallback;
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
        if (!this.state.permissionGranted && !this.state.usingFallback) {
          console.log("No orientation data detected. Activating Desktop Fallback.");
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
      if (e.code === 'Space') {
        this.reset();
      }
      if (e.code === 'KeyD') {
        this.state.debugMode = !this.state.debugMode;
        console.log(`Debug Mode: ${this.state.debugMode}`);
      }
    });
  }

  public reset() {
    this.onGravityUpdate(0, 0);
    console.log("Orientation Reset");
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

  public enableMouseFallback() {
    this.state.usingFallback = true;
    this.logTelemetry('FALLBACK_TRIGGERED');
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const SENSITIVITY = 0.1;

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      // Map pixels to Degrees
      const gamma = dx * SENSITIVITY;
      
      // FIX: Invert Y-Axis for natural "Drag to Tilt" feel
      // Mouse Down (+Y) -> Negative Beta -> Gravity pulls Z+ (Towards Camera)
      const beta = -dy * SENSITIVITY; 
      
      this.onGravityUpdate(beta, gamma);
    });
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