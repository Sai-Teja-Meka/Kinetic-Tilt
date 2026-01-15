import * as THREE from 'three';

export interface GravityVector {
  x: number;
  y: number; // Usually 0 in our logic, or -9.8 if doing full 3D
  z: number;
}

export interface InputState {
  isSupported: boolean;
  permissionGranted: boolean;
  usingFallback: boolean; // True if on desktop/mouse
  debugMode: boolean;
}

export interface TelemetryEvent {
  event: 'PERMISSION_DENIED' | 'FALLBACK_TRIGGERED' | 'UNSUPPORTED_DEVICE';
  timestamp: number;
  userAgent: string;
}