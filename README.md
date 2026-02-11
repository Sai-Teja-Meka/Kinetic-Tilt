<p align="center">
  <h1 align="center">Kinetic Tilt</h1>
  <p align="center">
    A mobile-first tilt-controlled 3D micro-game: roll the ball, collect rings, beat the clock.
  </p>

  <p align="center">
    <!-- Badges -->
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Three.js-0.182-black?logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Matter.js-0.20-4B5563" alt="Matter.js" />
    <img src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  </p>
</p>

---

## What is this?

**Kinetic Tilt** is a browser game where you control a rolling sphere by tilting your device (DeviceOrientation) or by dragging with mouse/touch fallback on desktop.  
Your goal: collect **10 rings** before the **60s timer** hits zero.

Built to demonstrate: real-time input → physics → rendering → UI feedback loops in a clean TypeScript architecture.

---

## Gameplay

- Tilt your phone to "tilt gravity" and roll the ball.
- Collect glowing rings to score points (faster collections score more).
- Win by collecting 10 rings before time runs out.
- Includes particles, screen shake, score popups, and synth audio feedback.

---

## Tech highlights

- **Three.js** scene with a 3D hero sphere, grid floor, lighting, and animated goal rings.
- **Matter.js** physics (2D) mapped into a 3D X/Z world (X/Z → X/Y).
- **Fixed timestep** physics loop + frame loop, with velocity clamping for stability.
- **Mobile-first** ergonomics: full-screen canvas, touch-action suppression, and a landscape prompt overlay.
- **Audio** via Web Audio API (no external audio assets).
- **Tests** with Vitest (GravityController unit tests).

---

## Project structure
```
.
├─ index.html
├─ src/
│  ├─ main.ts                # bootstrap + wiring + main loop
│  ├─ main.css               # fullscreen + touch behavior
│  ├─ scenes/DebugScene.ts   # Three.js scene + renderer + gravity arrow
│  ├─ core/
│  │  ├─ PhysicsWorld.ts     # Matter.js engine + boundary + sync to meshes
│  │  ├─ GravityController.ts# device angles -> gravity vector (smoothed)
│  │  ├─ DeviceInputManager.ts # DeviceOrientation + mouse/touch fallback
│  │  ├─ GoalSystem.ts       # rings: spawn/animate/collect lifecycle
│  │  ├─ CollisionDetector.ts# pure math collision checks
│  │  └─ GameStateManager.ts # timer/score/win/lose/highscore
│  ├─ ui/GameUI.ts           # start/win/lose screens + HUD + score popups
│  ├─ audio/SoundManager.ts  # synth SFX + mute
│  ├─ effects/ScreenShake.ts # camera shake
│  └─ tests/
│     └─ GravityController.test.ts
└─ vite.config.ts
```

---

## Getting started

### Prereqs
- Node.js (LTS recommended)
- npm

### Install
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

> Note: the dev server is configured for **HTTPS**, which helps with motion/orientation permissions on mobile browsers.

### Build
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Run tests
```bash
npx vitest
```

---

## Controls

### Mobile (recommended)
- Tilt device to steer.

If prompted:
- Allow Motion / Orientation access (iOS Safari requires explicit permission).

### Desktop / fallback
- Click/drag to "tilt" using a virtual joystick.
- Release to return to neutral gravity.

---

## Notes & tuning knobs

A few core knobs live in code and are easy to tweak:

- `GravityController`
  - tilt clamp, deadzone, smoothing, gravity multiplier
- `PhysicsWorld`
  - `PHYSICS_SCALE`, friction/restitution, max speed clamp
- `GameStateManager`
  - time limit, rings required, scoring multipliers

---

## License

MIT — see [LICENSE](LICENSE).
