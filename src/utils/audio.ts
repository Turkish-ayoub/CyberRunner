/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynth {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private bgmOscillator: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private bgmTempo: number = 130; // BPM
  private _volume: number = 0.7; // Boosted to 0.7 for commercial-grade punchiness
  private _bgmVolume: number = 0.7;
  private _sfxVolume: number = 0.7;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  constructor() {
    // Lazy loaded to handle browser policy
  }

  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    this._bgmVolume = this._volume;
    this._sfxVolume = this._volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(v: number) {
    this._bgmVolume = Math.max(0, Math.min(1, v));
  }

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      // Initialize Master Gain and Dynamics Compressor to prevent any distortion or clipping
      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
      }
      if (!this.masterCompressor) {
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        // Mathematical limiting settings to avoid any crackle/painful frequencies
        this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime); // -12dB threshold
        this.masterCompressor.knee.setValueAtTime(20, this.ctx.currentTime);       // Smooth compression knee
        this.masterCompressor.ratio.setValueAtTime(12, this.ctx.currentTime);      // Strict limiting ratio
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);  // Fast attack to clamp transients
        this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);  // Quick release to keep melody lively
        
        // Connect Master Gain -> Master Compressor -> Output
        this.masterGain.connect(this.masterCompressor);
        this.masterCompressor.connect(this.ctx.destination);
      }
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopBGM();
    } else {
      this.init();
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  playCoin() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // First high note
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    const baseGain = 0.16 * this._sfxVolume; // Boosted for crystal clear coin chime
    gain1.gain.setValueAtTime(baseGain, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(this.masterGain || this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.25);
  }

  playJump() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);

    const baseGain = 0.22 * this._sfxVolume; // Boosted for clean jump feedback
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playSlide() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);

    const baseGain = 0.12 * this._sfxVolume; // Boosted for slide woosh
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playHit() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator(); // Or a custom low-frequency saw
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.25);

    noise.type = 'square';
    noise.frequency.setValueAtTime(130, now);
    noise.frequency.linearRampToValueAtTime(50, now + 0.25);

    const baseGain = 0.25 * this._sfxVolume; // Crisp and punchy crash
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.25);
    noise.stop(now + 0.25);
  }

  playBlockHit() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Low bump
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(261.63, now); // C4
    osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.1); // C5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now);
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

    const baseGain = 0.20 * this._sfxVolume; // Solid feedback punch
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.15);
    osc2.stop(now + 0.15);
  }

  playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    const baseGain = 0.18 * this._sfxVolume;
    gain.gain.setValueAtTime(baseGain, now);

    // Play a descending ditty
    const notes = [523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 261.63]; // C5, B4, A4, G4, F4, E4, C4
    const duration = 0.12;

    notes.forEach((freq, idx) => {
      const time = now + idx * duration;
      osc.frequency.setValueAtTime(freq, time);
    });

    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.setValueAtTime(baseGain, now + duration * (notes.length - 2));
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * notes.length);

    osc.start(now);
    osc.stop(now + duration * notes.length + 0.05);
  }

  // Classic procedural arpeggiator/music generator (retro feel)
  playBGM() {
    if (!this.soundEnabled || this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    
    // We can do an interval-based music playing loop to synthesize a nice, simple,
    // repetitive bassline that is classic Mario-esque chiptune.
    let step = 0;
    // Mario theme basic chord notes
    const bassline = [
      130.81, 130.81, 0, 130.81, 0, 104.83, 130.81, 0, // C3 C3 - C3 - F2 C3
      155.56, 0, 155.56, 0, 146.83, 116.54, 130.81, 0, // D#3 - D#3 - D3 A#2 C3
      130.81, 130.81, 0, 130.81, 0, 104.83, 130.81, 0,
      196.00, 196.00, 196.00, 0, 98.00, 0, 0, 0        // G3 G3 G3 - G2
    ];

    const melody = [
      329.63, 329.63, 0, 329.63, 0, 261.63, 329.63, 0, // E4 E4 - E4 - C4 E4
      392.00, 0, 0, 0, 196.00, 0, 0, 0,                // G4 - - - G3
      261.63, 0, 0, 196.00, 0, 0, 164.81, 0,           // C4 - - G3 - - E3
      220.00, 0, 246.94, 0, 233.08, 220.00, 0, 0       // A3 - B3 - A#3 A3
    ];

    const playStep = () => {
      if (!this.bgmPlaying || !this.soundEnabled || !this.ctx) return;

      const now = this.ctx.currentTime;
      const beatDuration = 60 / this.bgmTempo / 2; // Eighth notes

      // Bass note (multiplied by master volume slider) - enhanced base gain for fuller chiptune
      const bassFreq = bassline[step % bassline.length];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);
        
        // Boosted baseline background track volume (increased default volume scale)
        const bassGainValue = 0.16 * this._bgmVolume;
        gain.gain.setValueAtTime(bassGainValue, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.9);
        
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + beatDuration);
      }

      // Melody note
      const melFreq = melody[step % melody.length];
      if (melFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(melFreq, now);

        // Boosted baseline background track volume (increased default volume scale)
        const melodyGainValue = 0.07 * this._bgmVolume;
        gain.gain.setValueAtTime(melodyGainValue, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beatDuration * 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + beatDuration);
      }

      step++;
      
      // Schedule next tick
      const timeToNext = beatDuration * 1000;
      (this as any).bgmTimer = setTimeout(playStep, timeToNext);
    };

    playStep();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if ((this as any).bgmTimer) {
      clearTimeout((this as any).bgmTimer);
    }
  }

  playWhistle() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Descending high pitch whistle
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.85);

    const baseGain = 0.15 * this._sfxVolume;
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  playThunder() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Low frequency rumbling explosion oscillator
    const oscLow = this.ctx.createOscillator();
    oscLow.type = 'sawtooth';
    oscLow.frequency.setValueAtTime(80, now);
    oscLow.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    // High frequency electric crackle oscillator
    const oscHigh = this.ctx.createOscillator();
    oscHigh.type = 'square';
    oscHigh.frequency.setValueAtTime(450, now);
    oscHigh.frequency.linearRampToValueAtTime(120, now + 0.35);

    const gainLow = this.ctx.createGain();
    const gainHigh = this.ctx.createGain();

    const lowVolume = 0.28 * this._sfxVolume;
    gainLow.gain.setValueAtTime(lowVolume, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    const highVolume = 0.18 * this._sfxVolume;
    gainHigh.gain.setValueAtTime(highVolume, now);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscLow.connect(gainLow);
    oscHigh.connect(gainHigh);

    gainLow.connect(this.masterGain || this.ctx.destination);
    gainHigh.connect(this.masterGain || this.ctx.destination);

    oscLow.start(now);
    oscHigh.start(now);

    oscLow.stop(now + 0.6);
    oscHigh.stop(now + 0.35);
  }

  playSwish() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Multiple rapid swishes
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now + delay);
      osc.frequency.exponentialRampToValueAtTime(1200, now + delay + 0.18);

      const baseGain = 0.08 * this._sfxVolume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(baseGain, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.18);
    }
  }

  playDragonRoar() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.6;

    // Creating a monster growl using detuned sawtooth oscillators and rapid pitch modulation
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator(); // frequency modulation LFO
    const modGain = this.ctx.createGain();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    mod.type = 'sawtooth';

    // Base frequencies
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + duration);

    osc2.frequency.setValueAtTime(143, now); // slightly detuned for chorus effect
    osc2.frequency.exponentialRampToValueAtTime(46, now + duration);

    // Modulation frequency (growl texture)
    mod.frequency.setValueAtTime(35, now);
    mod.frequency.linearRampToValueAtTime(15, now + duration);

    // Modulation depth
    modGain.gain.setValueAtTime(60, now);
    modGain.gain.linearRampToValueAtTime(15, now + duration);

    // Audio envelope
    const maxVolume = 0.35 * this._sfxVolume;
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(maxVolume, now + 0.15); // fade in
    gainNode.gain.linearRampToValueAtTime(maxVolume * 0.8, now + 0.5); // sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // fade out

    // Connect modulation path
    mod.connect(modGain);
    modGain.connect(osc1.frequency);
    modGain.connect(osc2.frequency);

    // Connect audio path
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain || this.ctx.destination);

    // Start everything
    mod.start(now);
    osc1.start(now);
    osc2.start(now);

    mod.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  playCyberDash() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);

    noise.type = 'sine';
    noise.frequency.setValueAtTime(80, now);
    noise.frequency.exponentialRampToValueAtTime(350, now + 0.35);

    const baseGain = 0.28 * this._sfxVolume;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(baseGain, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.4);
    noise.stop(now + 0.4);
  }

  playLaserBlast() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    const baseGain = 0.30 * this._sfxVolume;
    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const gameAudio = new AudioSynth();

