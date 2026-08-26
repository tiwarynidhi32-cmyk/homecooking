// Sound Service for Order Alert Ringtone & Audio Notifications using Web Audio API

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isRingingActive: boolean = false;
  private ringInterval: any = null;
  private isMuted: boolean = false;
  private listeners: Set<(ringing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('hc_ringtone_muted');
      this.isMuted = storedMute === 'true';
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_ringtone_muted', muted ? 'true' : 'false');
    }
    if (muted && this.isRingingActive) {
      this.silenceAudioNodes();
    } else if (!muted && this.isRingingActive) {
      this.playChimeSequence();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public subscribe(listener: (ringing: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isRingingActive);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn(this.isRingingActive));
  }

  /**
   * Synthesize a lively, high-contrast melodic order dispatch chime
   * Pattern: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz) double ring
   */
  private playChimeSequence() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Bell / Marimba harmonic frequencies
      const notes = [
        { freq: 587.33, start: 0.0, dur: 0.22, gain: 0.35 }, // D5
        { freq: 739.99, start: 0.16, dur: 0.22, gain: 0.4 }, // F#5
        { freq: 880.00, start: 0.32, dur: 0.25, gain: 0.45 }, // A5
        { freq: 1174.66, start: 0.48, dur: 0.55, gain: 0.5 }, // D6
        
        // Echo accent pulse
        { freq: 880.00, start: 0.85, dur: 0.2, gain: 0.35 },
        { freq: 1174.66, start: 1.02, dur: 0.5, gain: 0.45 },
      ];

      notes.forEach(({ freq, start, dur, gain: noteGain }) => {
        const osc = ctx.createOscillator();
        const oscHarmonic = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Sine base + Triangle harmonic overtone for realistic restaurant bell timbre
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(freq * 2, now + start);

        // Envelope: Instant attack, bright sustain, smooth natural decay
        gainNode.gain.setValueAtTime(0.0001, now + start);
        gainNode.gain.exponentialRampToValueAtTime(noteGain, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gainNode);
        oscHarmonic.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + start);
        oscHarmonic.start(now + start);

        osc.stop(now + start + dur + 0.05);
        oscHarmonic.stop(now + start + dur + 0.05);
      });
    } catch (err) {
      console.warn('Audio ring playback error:', err);
    }
  }

  private silenceAudioNodes() {
    // Soft silence
  }

  /**
   * Start looping the incoming order ringtone continuously until stopped or accepted
   */
  public startOrderRingtone() {
    if (this.isRingingActive) return;
    this.isRingingActive = true;
    this.notifyListeners();

    // Play first chime immediately
    this.playChimeSequence();

    // Loop chime every 1.9 seconds
    if (this.ringInterval) clearInterval(this.ringInterval);
    this.ringInterval = setInterval(() => {
      if (this.isRingingActive) {
        this.playChimeSequence();
      }
    }, 1900);
  }

  /**
   * Stop the ringtone once the order is accepted or confirmed
   */
  public stopOrderRingtone() {
    if (!this.isRingingActive) return;
    this.isRingingActive = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    this.notifyListeners();
  }

  public isRinging(): boolean {
    return this.isRingingActive;
  }

  /**
   * Short success sound on order acceptance / assignment
   */
  public playAcceptSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18); // C6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (err) {}
  }

  /**
   * Manual test sound trigger
   */
  public testRingtone() {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      this.playChimeSequence();
    } catch (e) {
      console.warn('Test audio error:', e);
    }
  }
}

export const soundService = new SoundService();
