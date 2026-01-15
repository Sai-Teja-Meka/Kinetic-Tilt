export enum GameState {
  READY,      // Start screen visible
  PLAYING,    // Active gameplay
  PAUSED,     // (Reserved)
  WIN,        // Success
  GAME_OVER   // Time expired
}

export class GameStateManager {
  private state: GameState = GameState.READY;
  
  // Scoring & Progression
  private score: number = 0;
  private highScore: number = 0; // NEW
  private goalsCollected: number = 0;
  private readonly GOALS_REQUIRED: number = 10;
  
  // Timer settings
  private timeRemaining: number = 60.0; 
  private readonly TIME_LIMIT: number = 60.0;
  private readonly TIME_BONUS_MULTIPLIER: number = 10; // Points per sec left at win
  
  // Callbacks
  private onStateChange?: (newState: GameState) => void;

  constructor() {
    this.loadHighScore(); // Load on init
    this.reset();
  }

  public setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  // --- HIGH SCORE LOGIC ---
  private loadHighScore(): void {
    const saved = localStorage.getItem('kinetic-tilt-highscore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
      console.log(`📊 High Score Loaded: ${this.highScore}`);
    }
  }

  private saveHighScore(): void {
    localStorage.setItem('kinetic-tilt-highscore', this.highScore.toString());
    console.log(`💾 High Score Saved: ${this.highScore}`);
  }

  public getHighScore(): number {
    return this.highScore;
  }

  /**
   * Internal state transition handler
   */
  private setState(newState: GameState): void {
    if (this.state === newState) return;
    
    this.state = newState;
    console.log(`[GameState] Transition: ${GameState[newState]}`);
    
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  public startGame(): void {
    this.reset();
    this.setState(GameState.PLAYING);
    console.log('🎮 GAME STARTED - GOAL: Collect 10 Rings!');
  }

  public reset(): void {
    this.state = GameState.READY;
    this.score = 0;
    this.goalsCollected = 0;
    this.timeRemaining = this.TIME_LIMIT;
    
    // Notify UI of reset (optional, but good for cleaning up 'Game Over' screens)
    if (this.onStateChange) this.onStateChange(GameState.READY);
  }

  /**
   * Main Logic Loop
   * Call this every frame with deltaTime (in seconds)
   */
  public update(deltaTime: number): void {
    if (this.state !== GameState.PLAYING) return;

    // 1. Countdown
    this.timeRemaining -= deltaTime;

    // 2. Check Lose Condition
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.handleGameOver();
    }
  }

  /**
   * Called by GoalSystem when a goal is hit
   */
  public onGoalCollected(): void {
    if (this.state !== GameState.PLAYING) return;

    this.goalsCollected++;

    // Scoring Logic
    const baseScore = 100;
    // Speed Bonus: +2 points for every second left on the clock when you score
    const speedBonus = Math.floor(this.timeRemaining * 2); 
    
    const totalGoalScore = baseScore + speedBonus;
    this.score += totalGoalScore;

    console.log(`🎯 Goal Collected | +${totalGoalScore} pts`);

    // 3. Check Win Condition
    if (this.goalsCollected >= this.GOALS_REQUIRED) {
      this.handleWin();
    }
  }

  private handleWin(): void {
    // Final Time Bonus: Big reward for finishing early
    const timeBonus = Math.floor(this.timeRemaining * this.TIME_BONUS_MULTIPLIER);
    this.score += timeBonus;
    
    // CHECK HIGH SCORE
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      console.log('🌟 NEW HIGH SCORE!');
    }
    
    console.log(`🏆 VICTORY! Time Bonus: +${timeBonus} (Total: ${this.score})`);
    this.setState(GameState.WIN);
  }

  private handleGameOver(): void {
    console.log(`💀 GAME OVER - Time Expired. Final Score: ${this.score}`);
    this.setState(GameState.GAME_OVER);
  }

  // --- Getters for UI/HUD ---
  public getState(): GameState { return this.state; }
  public getScore(): number { return this.score; }
  public getTimeRemaining(): number { return this.timeRemaining; }
  public getGoalsCollected(): number { return this.goalsCollected; }
  public getGoalsRequired(): number { return this.GOALS_REQUIRED; }
  
  public getProgress(): { collected: number, required: number } {
    return { 
      collected: this.goalsCollected, 
      required: this.GOALS_REQUIRED 
    };
  }
}