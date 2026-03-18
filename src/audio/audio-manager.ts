// ============================================================
// Audio Manager — Web Audio API bus architecture
// GDD Phase 5 §3.1: Source → Bus → Compressor → Master → Out
// ============================================================

export class AudioManager {
  private _ctx: AudioContext | null = null;
  private _masterGain!: GainNode;
  private _compressor!: DynamicsCompressorNode;

  // Three buses as per GDD spec
  private _sfxGain!: GainNode;
  private _musicGain!: GainNode;
  private _uiGain!: GainNode;

  private _initialized = false;

  /** Must be called after a user gesture (iOS Safari requirement) */
  async init(): Promise<void> {
    if (this._initialized) return;

    this._ctx = new AudioContext();

    // Create master output chain: Bus → Compressor → Master Gain → Destination
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1.0;

    this._compressor = this._ctx.createDynamicsCompressor();
    this._compressor.threshold.value = -24;
    this._compressor.knee.value = 30;
    this._compressor.ratio.value = 12;
    this._compressor.attack.value = 0.003;
    this._compressor.release.value = 0.25;

    this._compressor.connect(this._masterGain);
    this._masterGain.connect(this._ctx.destination);

    // Create individual bus gain nodes
    this._sfxGain = this._ctx.createGain();
    this._sfxGain.gain.value = 1.0;
    this._sfxGain.connect(this._compressor);

    this._musicGain = this._ctx.createGain();
    this._musicGain.gain.value = 0.7;
    this._musicGain.connect(this._compressor);

    this._uiGain = this._ctx.createGain();
    this._uiGain.gain.value = 0.8;
    this._uiGain.connect(this._compressor);

    this._initialized = true;
  }

  /** Resume AudioContext if suspended (required after user gesture on iOS) */
  async resume(): Promise<void> {
    if (this._ctx && this._ctx.state === 'suspended') {
      await this._ctx.resume();
    }
  }

  get context(): AudioContext {
    if (!this._ctx) throw new Error('AudioManager not initialized');
    return this._ctx;
  }

  get sfxBus(): GainNode { return this._sfxGain; }
  get musicBus(): GainNode { return this._musicGain; }
  get uiBus(): GainNode { return this._uiGain; }

  /** Set volume for a specific bus (0..1) */
  setVolume(bus: 'sfx' | 'music' | 'ui' | 'master', volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    switch (bus) {
      case 'sfx': this._sfxGain.gain.value = v; break;
      case 'music': this._musicGain.gain.value = v; break;
      case 'ui': this._uiGain.gain.value = v; break;
      case 'master': this._masterGain.gain.value = v; break;
    }
  }

  /** Play a simple tone (placeholder for real SFX loading) */
  playTone(frequency: number, duration: number, bus: 'sfx' | 'ui' = 'sfx'): void {
    if (!this._ctx) return;

    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.frequency.value = frequency;
    osc.type = 'sine';

    gain.gain.value = 0.3;
    gain.gain.setValueAtTime(0.3, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(bus === 'sfx' ? this._sfxGain : this._uiGain);

    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  get initialized(): boolean {
    return this._initialized;
  }
}
