export class SoundManager {
  private audioContext: AudioContext;
  private isMuted: boolean = false;
  private masterGain: GainNode;

  constructor() {
    // 1. Initialize Context (Cross-browser compatibility)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // 2. Master Gain (Volume Control)
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Default volume 30% to save ears
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Browsers block audio until user interaction.
   * Call this on the first click/tap of the "Start Game" button.
   */
  public async ensureContextResumed(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('🔊 AudioContext Resumed');
    }
  }

  /**
   * Sound: "Ding"
   * Context: Collecting a ring
   */
  public playGoalCollect(): void {
    if (this.isMuted) return;

    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    // Configuration
    osc.type = 'sine'; // Pure tone
    
    // Pitch Variation: 880Hz (A5) +/- 10%
    const variance = 0.9 + Math.random() * 0.2;
    osc.frequency.setValueAtTime(880 * variance, t);

    // Envelope (ADSR-lite)
    // Attack: 0 -> 1 in 0.02s
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
    // Decay: 1 -> 0.01 in 0.3s
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.35); // Cleanup
  }

  /**
   * Sound: "Victory Fanfare"
   * Context: Level Complete / Win
   */
  public playWin(): void {
    if (this.isMuted) return;

    const t = this.audioContext.currentTime;
    
    // Play C Major Triad (C - E - G)
    this.playNote(261.63, t, 0.4, 'triangle');        // C4
    this.playNote(329.63, t + 0.15, 0.4, 'triangle'); // E4
    this.playNote(392.00, t + 0.30, 0.6, 'triangle'); // G4
  }

  /**
   * Helper for musical notes
   */
  private playNote(freq: number, startTime: number, duration: number, type: OscillatorType): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  /**
   * Sound: "Failure Slide"
   * Context: Time Over / Loss
   */
  public playLose(): void {
    if (this.isMuted) return;

    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth'; // Harsher, buzzing tone
    
    // Pitch Slide: 400Hz -> 100Hz
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);

    // Envelope
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    // Set master volume to 0 or restore to 0.3
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.3, this.audioContext.currentTime, 0.1);
    console.log(`Sound: ${this.isMuted ? 'MUTED' : 'UNMUTED'}`);
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}