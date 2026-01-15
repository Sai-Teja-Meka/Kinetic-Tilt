import Matter from 'matter-js'; 
import './main.css';

import { GravityController } from './core/GravityController';
import { DeviceInputManager } from './core/DeviceInputManager';
import { DebugScene } from './scenes/DebugScene';
import { PhysicsWorld } from './core/PhysicsWorld';
import { ParticleSystem } from './core/ParticleSystem';
import { CollisionDetector } from './core/CollisionDetector';
import { GoalSystem } from './core/GoalSystem';
import { GameStateManager, GameState } from './core/GameStateManager';
import { GameUI } from './ui/GameUI';
import { SoundManager } from './audio/SoundManager';
import { ScreenShake } from './effects/ScreenShake';

console.log("🚀 Booting Kinetic Tilt v1.0");

// 1. Core Systems
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) throw new Error("Canvas element not found");

const gravityController = new GravityController();
const inputManager = new DeviceInputManager((beta, gamma) => {
  gravityController.update(beta, gamma);
});

// Fix: Log manager state to silence unused variable warning
console.log('Input Manager Online:', inputManager.state);

// 2. Visuals & Physics
const debugScene = new DebugScene(canvas, gravityController);
const physicsWorld = new PhysicsWorld();
physicsWorld.addHeroSphere(debugScene.getHeroSphere());
physicsWorld.addBoundaries();

// 3. Effects & Audio
const particleSystem = new ParticleSystem(debugScene.getScene());
const soundManager = new SoundManager();
const screenShake = new ScreenShake(debugScene.getCamera());

// 4. Gameplay Logic
const collisionDetector = new CollisionDetector();
const goalSystem = new GoalSystem(debugScene.getScene(), collisionDetector);
const gameState = new GameStateManager();
const gameUI = new GameUI();

// --- WIRING ---

gameUI.setStartCallback(() => {
  soundManager.ensureContextResumed(); // Critical for Audio
  gameState.startGame();
  gameUI.showGameHUD();
});

gameUI.setRestartCallback(() => {
  // Logic Reset
  gameState.reset();
  gravityController.reset();
  goalSystem.reset(debugScene.getScene());
  particleSystem.reset();
  
  // Physics Reset
  const heroBody = physicsWorld.getHeroBody();
  if (heroBody) {
    Matter.Body.setPosition(heroBody, { x: 0, y: 0 }); 
    Matter.Body.setVelocity(heroBody, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(heroBody, 0);
  }
  
  // Visual Reset
  debugScene.getHeroSphere().position.set(0, 0.5, 0);
  
  gameUI.showStartScreen();
});

gameUI.setMuteCallback(() => {
  soundManager.toggleMute();
  return soundManager.isSoundMuted();
});

// State Changes -> Audio/UI
gameState.setStateChangeCallback((newState: GameState) => {
  switch (newState) {
    case GameState.WIN:
      soundManager.playWin();
      gameUI.showWinScreen(
        gameState.getScore(),
        gameState.getTimeRemaining()
      );
      break;
      
    case GameState.GAME_OVER:
      soundManager.playLose();
      const progress = gameState.getProgress();
      gameUI.showGameOverScreen(
        gameState.getScore(),
        progress.collected,
        progress.required
      );
      break;
  }
});

// --- MAIN GAME LOOP ---
const FIXED_TIMESTEP = 1000 / 60;
let accumulator = 0;
let lastTime = performance.now();

debugScene.start(); 

const gameLoop = () => {
  const currentTime = performance.now();
  const frameTime = Math.min(currentTime - lastTime, 100);
  lastTime = currentTime;
  accumulator += frameTime;
  
  // 1. Physics (Fixed)
  while (accumulator >= FIXED_TIMESTEP) {
    const gravityVec = gravityController.getGravityVector();
    physicsWorld.update(FIXED_TIMESTEP, gravityVec);
    accumulator -= FIXED_TIMESTEP;
  }
  
  physicsWorld.syncVisuals();
  
  // 2. Effects (Variable)
  const dtSeconds = frameTime / 1000;
  const heroMesh = debugScene.getHeroSphere();
  
  particleSystem.update(dtSeconds, heroMesh.position);
  screenShake.update(dtSeconds); // Apply camera shake
  
  // 3. Gameplay Logic
  if (gameState.getState() === GameState.PLAYING) {
    gameState.update(dtSeconds);
    
    // Check Goals
    const collectedIndex = goalSystem.update(
      dtSeconds,
      heroMesh.position,
      debugScene.getScene()
    );
    
    if (collectedIndex !== null) {
      // GOAL COLLECTED EVENT
      
      // Spawn effects at Hero/Goal Position
      particleSystem.createBurst(heroMesh.position);
      screenShake.shake(0.2, 0.3);
      soundManager.playGoalCollect();
      
      // Calculate Score for Popup
      const scoreGained = 100 + Math.floor(gameState.getTimeRemaining() * 2);
      
      // Show Popup (Now using the fixed getCamera method)
      gameUI.showScorePopup(scoreGained, heroMesh.position, debugScene.getCamera());
      
      gameState.onGoalCollected();
    }
    
    // Sync HUD
    gameUI.updateTimer(gameState.getTimeRemaining());
    gameUI.updateScore(gameState.getScore());
    const p = gameState.getProgress();
    gameUI.updateProgress(p.collected, p.required);
  }
  
  requestAnimationFrame(gameLoop);
};

gameLoop();