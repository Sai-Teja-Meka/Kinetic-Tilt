import * as THREE from 'three';

export class GameUI {
  // DOM Elements
  private container: HTMLDivElement;
  private startScreen: HTMLDivElement;
  private hudContainer: HTMLDivElement;
  private timerElement!: HTMLDivElement;
  private scoreElement!: HTMLDivElement;
  private progressElement!: HTMLDivElement;
  private winModal: HTMLDivElement;
  private gameOverModal: HTMLDivElement;
  private muteBtn: HTMLButtonElement;
  
  // Callbacks
  private onStartGame?: () => void;
  private onRestart?: () => void;
  private onMuteToggle?: () => boolean;

  constructor() {
    this.injectStyles();

    // Main Container
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    document.body.appendChild(this.container);

    // FIX 4: Orientation Prompt
    this.createOrientationPrompt();

    // Initialize Screens
    this.startScreen = this.createStartScreen();
    this.hudContainer = this.createHUD();
    this.winModal = this.createWinModal();
    this.gameOverModal = this.createGameOverModal();
    this.muteBtn = this.createMuteButton();
    this.muteBtn.style.display = 'flex'; // simple read/use

    // Default State
    this.showStartScreen();
  }

  // --- 1. STYLING SYSTEM ---
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #game-ui {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 1000;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        user-select: none;
      }
      .ui-screen {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(5px);
        pointer-events: auto;
        opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none; /* Default hidden state */
      }
      .ui-screen.active {
        opacity: 1; pointer-events: auto;
      }
      .ui-title {
        font-size: 4rem; font-weight: 800; color: #4488ff;
        text-shadow: 0 0 30px rgba(68,136,255,0.8);
        margin-bottom: 0.5rem; text-align: center; letter-spacing: 2px;
      }
      .ui-subtitle {
        font-size: 1.5rem; color: #ffffff; opacity: 0.8;
        margin-bottom: 2rem; text-align: center;
      }
      .ui-stat-box {
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem;
        text-align: center; min-width: 300px;
      }
      .ui-stat-row {
        display: flex; justify-content: space-between; margin: 0.5rem 0;
        font-size: 1.2rem; color: #eee;
      }
      .ui-stat-val { font-weight: bold; color: #ffaa00; }
      
      /* Buttons */
      .ui-btn {
        background: linear-gradient(135deg, #4488ff, #2266dd);
        border: none; border-radius: 50px;
        padding: 1rem 3rem; font-size: 1.5rem; font-weight: bold; color: white;
        cursor: pointer; transition: all 0.2s ease;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        box-shadow: 0 0 20px rgba(68,136,255,0.4);
      }
      .ui-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(68,136,255,0.8); }
      .ui-btn:active { transform: scale(0.95); }
      
      /* HUD */
      #ui-hud {
        display: none; width: 100%; height: 100%; pointer-events: none;
      }
      .hud-panel {
        position: absolute; padding: 10px 20px;
        font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      }
      #hud-timer {
        top: 20px; left: 50%; transform: translateX(-50%);
        font-size: 3rem; color: #4488ff;
        text-shadow: 0 0 20px rgba(68,136,255,0.5);
      }
      #hud-score {
        top: 20px; right: 20px; font-size: 1.8rem; color: #ffaa00; text-align: right;
      }
      #hud-progress {
        top: 20px; left: 20px; font-size: 1.8rem; color: white;
      }

      /* NEW ANIMATIONS & MUTE BTN */
      @keyframes scorePopup {
        0% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) translateY(-30px) scale(1.2); }
        100% { transform: translate(-50%, -50%) translateY(-60px) scale(0.8); opacity: 0; }
      }
      
      @keyframes timerPulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.15); }
      }

      #btn-mute {
        position: fixed; top: 20px; right: 20px;
        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3);
        border-radius: 50%; width: 50px; height: 50px;
        font-size: 1.5rem; color: white; cursor: pointer;
        z-index: 2000; pointer-events: auto;
        display: flex; justify-content: center; align-items: center;
        transition: transform 0.2s;
      }
      #btn-mute:hover { transform: scale(1.1); background: rgba(0,0,0,0.8); }
    `;
    document.head.appendChild(style);
  }

  // --- 2. SCREEN CREATION ---

  private createMuteButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.id = 'btn-mute';
    btn.textContent = '🔊';
    btn.onclick = () => {
      if (this.onMuteToggle) {
        const isMuted = this.onMuteToggle();
        btn.textContent = isMuted ? '🔇' : '🔊';
      }
    };
    document.body.appendChild(btn);
    return btn;
  }

  private createStartScreen(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'ui-screen active';
    el.innerHTML = `
      <h1 class="ui-title">KINETIC TILT</h1>
      <p class="ui-subtitle">Collect 10 rings before time runs out</p>
      <div style="margin-bottom: 2rem; color: #aaa; font-size: 1rem;">
        Tilt device or drag mouse to control
      </div>
      <button class="ui-btn" id="btn-start">START GAME</button>
    `;
    
    el.querySelector('#btn-start')?.addEventListener('click', () => {
      if (this.onStartGame) this.onStartGame();
    });
    
    this.container.appendChild(el);
    return el;
  }

  private createHUD(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = 'ui-hud';
    el.innerHTML = `
      <div id="hud-progress" class="hud-panel">Goals: 0/10</div>
      <div id="hud-timer" class="hud-panel">60.0</div>
      <div id="hud-score" class="hud-panel">Score: 0</div>
    `;
    
    this.container.appendChild(el);
    this.progressElement = el.querySelector('#hud-progress')!;
    this.timerElement = el.querySelector('#hud-timer')!;
    this.scoreElement = el.querySelector('#hud-score')!;
    
    return el;
  }

  private createWinModal(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'ui-screen';
    el.innerHTML = `
      <h1 class="ui-title" style="color: #ffaa00; text-shadow: 0 0 30px rgba(255,170,0,0.8)">VICTORY!</h1>
      <div class="ui-stat-box">
        <div class="ui-stat-row"><span>Final Score</span><span class="ui-stat-val" id="win-score">0</span></div>
        <div class="ui-stat-row"><span>Time Bonus</span><span class="ui-stat-val" id="win-bonus">0</span></div>
      </div>
      <button class="ui-btn" id="btn-restart-win">PLAY AGAIN</button>
    `;
    
    el.querySelector('#btn-restart-win')?.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });

    this.container.appendChild(el);
    return el;
  }

  private createGameOverModal(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'ui-screen';
    el.innerHTML = `
      <h1 class="ui-title" style="color: #ff4444; text-shadow: 0 0 30px rgba(255,68,68,0.8)">TIME'S UP</h1>
      <div class="ui-stat-box">
        <div class="ui-stat-row"><span>Goals Collected</span><span class="ui-stat-val" id="lose-goals">0/10</span></div>
        <div class="ui-stat-row"><span>Final Score</span><span class="ui-stat-val" id="lose-score">0</span></div>
      </div>
      <button class="ui-btn" id="btn-restart-lose" style="background: linear-gradient(135deg, #ff4444, #dd2222)">TRY AGAIN</button>
    `;
    
    el.querySelector('#btn-restart-lose')?.addEventListener('click', () => {
      if (this.onRestart) this.onRestart();
    });

    this.container.appendChild(el);
    return el;
  }

  private createOrientationPrompt(): void {
    const el = document.createElement('div');
    el.id = 'orientation-prompt';
    el.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: none; /* Hidden by default */
      justify-content: center; align-items: center; flex-direction: column;
      z-index: 9999; color: white; font-family: sans-serif;
      text-align: center; padding: 2rem; pointer-events: auto;
    `;
    
    el.innerHTML = `
      <div style="font-size: 4rem; margin-bottom: 1rem;">📱➡️</div>
      <div style="font-size: 2rem; font-weight: bold;">Rotate Device</div>
      <div style="font-size: 1rem; opacity: 0.7; margin-top: 1rem;">
        Landscape mode required
      </div>
    `;
    
    document.body.appendChild(el);
    
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      el.style.display = isPortrait ? 'flex' : 'none';
    };
    
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
  }

  // --- 3. PUBLIC API ---

  public setStartCallback(callback: () => void): void {
    this.onStartGame = callback;
  }

  public setRestartCallback(callback: () => void): void {
    this.onRestart = callback;
  }

  public setMuteCallback(callback: () => boolean): void {
    this.onMuteToggle = callback;
  }

  public showStartScreen(): void {
    this.hideAll();
    this.startScreen.classList.add('active');
  }

  public showGameHUD(): void {
    this.hideAll();
    this.hudContainer.style.display = 'block';
  }

  public showWinScreen(score: number, timeRemaining: number): void {
    this.hideAll();
    this.winModal.classList.add('active');
    
    const bonus = Math.floor(timeRemaining * 100);
    this.winModal.querySelector('#win-score')!.textContent = score.toString();
    this.winModal.querySelector('#win-bonus')!.textContent = `+${bonus}`;
  }

  public showGameOverScreen(score: number, collected: number, required: number): void {
    this.hideAll();
    this.gameOverModal.classList.add('active');
    
    this.gameOverModal.querySelector('#lose-score')!.textContent = score.toString();
    this.gameOverModal.querySelector('#lose-goals')!.textContent = `${collected}/${required}`;
  }

  public showScorePopup(amount: number, worldPosition: THREE.Vector3, camera: THREE.Camera): void {
    // 1. Project 3D position to 2D Screen Coordinates
    const vector = worldPosition.clone().project(camera);
    
    // Convert NDC (-1 to +1) to pixel coordinates
    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    
    // 2. Create Element
    const popup = document.createElement('div');
    popup.textContent = `+${amount}`;
    popup.style.cssText = `
      position: fixed;
      left: ${screenX}px;
      top: ${screenY}px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      color: #ffaa00;
      text-shadow: 0 0 15px rgba(255,170,0,0.8);
      pointer-events: none;
      animation: scorePopup 1s ease-out forwards;
      z-index: 1001;
      transform: translate(-50%, -50%); /* Center on point */
    `;
    
    document.body.appendChild(popup);
    
    // 3. Cleanup
    setTimeout(() => popup.remove(), 1000);
  }

  private hideAll(): void {
    this.startScreen.classList.remove('active');
    this.winModal.classList.remove('active');
    this.gameOverModal.classList.remove('active');
    this.hudContainer.style.display = 'none';
  }

  // --- 4. HUD UPDATES ---

  public updateTimer(seconds: number): void {
    const text = seconds.toFixed(1);
    if (this.timerElement.textContent === text) return;
    
    this.timerElement.textContent = text;

    if (seconds <= 10) {
      this.timerElement.style.color = '#ff4444';
      this.timerElement.style.textShadow = '0 0 20px rgba(255, 68, 68, 0.8)';
      this.timerElement.style.animation = 'timerPulse 0.5s ease-in-out infinite';
    } else {
      this.timerElement.style.color = '#4488ff';
      this.timerElement.style.textShadow = '0 0 20px rgba(68, 136, 255, 0.5)';
      this.timerElement.style.animation = 'none';
    }
  }

  public updateScore(score: number): void {
    this.scoreElement.textContent = `Score: ${score}`;
  }

  public updateProgress(collected: number, required: number): void {
    this.progressElement.textContent = `Goals: ${collected}/${required}`;
  }
}