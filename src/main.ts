import Matter from 'matter-js'; 
import { GravityController } from './core/GravityController';
import { DeviceInputManager } from './core/DeviceInputManager';
import { DebugScene } from './scenes/DebugScene';
import { PhysicsWorld } from './core/PhysicsWorld';
import { ParticleSystem } from './core/ParticleSystem';
import { CollisionDetector } from './core/CollisionDetector';
import { GoalSystem } from './core/GoalSystem';
import { GameStateManager, GameState } from './core/GameStateManager';
import { GameUI } from './ui/GameUI';
import './main.css';

// --- INITIALIZATION ---
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) throw new Error("Canvas element not found");

console.log("🚀 Initializing Kinetic Tilt Systems...");

const gravityController = new GravityController();
const inputManager = new DeviceInputManager((beta, gamma) => {
  gravityController.update(beta, gamma);
});

const debugScene = new DebugScene(canvas, gravityController);
const physicsWorld = new PhysicsWorld();

physicsWorld.addHeroSphere(debugScene.getHeroSphere());
physicsWorld.addBoundaries();

const particleSystem = new ParticleSystem(debugScene.getScene());

const collisionDetector = new CollisionDetector();
const goalSystem = new GoalSystem(debugScene.getScene(), collisionDetector);
const gameState = new GameStateManager();
const gameUI = new GameUI();

// --- UI CALLBACK WIRING ---

gameUI.setStartCallback(() => {
  console.log('🎮 User clicked START');
  gameState.startGame();
  gameUI.showGameHUD();
});

// FIX 1: Update Restart Callback
gameUI.setRestartCallback(() => {
  console.log('🔄 User clicked RESTART');
  
  // 1. Reset Game Logic (Score, Time, State -> READY)
  gameState.reset();
  
  // 2. Reset Visual Position
  const heroSphere = debugScene.getHeroSphere();
  heroSphere.position.set(0, 0.5, 0);
  heroSphere.rotation.set(0, 0, 0);
  
  // 3. Reset Physics Body (Critical to stop momentum)
  const heroBody = physicsWorld.getHeroBody();
  if (heroBody) {
    Matter.Body.setPosition(heroBody, { x: 0, y: 0 }); 
    Matter.Body.setVelocity(heroBody, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(heroBody, 0);
  }
  
  // 4. Reset Input Vector
  gravityController.reset();

  // 5. Reset Goals (Fixes ghost goals)
  goalSystem.reset(debugScene.getScene());

  // 6. Reset Particles (Fixes visual clutter)
  particleSystem.reset();
  
  // 7. Return to Start Screen (Do not auto-start)
  gameUI.showStartScreen();
});

// State Change Listener
gameState.setStateChangeCallback((newState: GameState) => {
  switch (newState) {
    case GameState.WIN:
      gameUI.showWinScreen(
        gameState.getScore(),
        gameState.getTimeRemaining()
      );
      break;
      
    case GameState.GAME_OVER:
      const progress = gameState.getProgress();
      gameUI.showGameOverScreen(
        gameState.getScore(),
        progress.collected,
        progress.required
      );
      break;
  }
});

// --- PERMISSION BUTTON ---
const createPermissionButton = () => {
  const btn = document.createElement('button');
  btn.innerText = "ENABLE TILT CONTROL";
  Object.assign(btn.style, {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    padding: '15px 30px', fontSize: '18px', fontWeight: 'bold',
    background: '#4488ff', color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', zIndex: '2000'
  });

  btn.onclick = async () => {
    const granted = await inputManager.requestPermission();
    if (granted) btn.remove();
    else {
      btn.innerText = "PERMISSION DENIED (Tap to retry)";
      btn.style.background = '#ff4444';
    }
  };

  document.body.appendChild(btn);
  setTimeout(() => {
    if (inputManager.state.permissionGranted || inputManager.state.usingFallback) {
      if (btn.parentNode) btn.remove();
    }
  }, 1000);
};

createPermissionButton();
debugScene.start();

// --- MAIN GAME LOOP ---
const FIXED_TIMESTEP = 1000 / 60;
let accumulator = 0;
let lastTime = performance.now();

const gameLoop = () => {
  const currentTime = performance.now();
  const frameTime = Math.min(currentTime - lastTime, 100);
  lastTime = currentTime;
  accumulator += frameTime;
  
  while (accumulator >= FIXED_TIMESTEP) {
    const gravityVec = gravityController.getGravityVector();
    physicsWorld.update(FIXED_TIMESTEP, gravityVec);
    accumulator -= FIXED_TIMESTEP;
  }
  
  physicsWorld.syncVisuals();
  
  const heroMesh = debugScene.getHeroSphere();
  particleSystem.update(frameTime / 1000, heroMesh.position);
  
  if (gameState.getState() === GameState.PLAYING) {
    const dtSeconds = frameTime / 1000;

    gameState.update(dtSeconds);
    
    const collectedIndex = goalSystem.update(
      dtSeconds,
      heroMesh.position,
      debugScene.getScene()
    );
    
    if (collectedIndex !== null) {
      gameState.onGoalCollected();
    }
    
    gameUI.updateTimer(gameState.getTimeRemaining());
    gameUI.updateScore(gameState.getScore());
    const progress = gameState.getProgress();
    gameUI.updateProgress(progress.collected, progress.required);
  }
  
  requestAnimationFrame(gameLoop);
};

gameLoop();