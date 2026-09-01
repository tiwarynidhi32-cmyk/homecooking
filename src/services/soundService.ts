// Sound Service for Order Alert Ringtone & Audio Notifications
// Features Dual-Engine Web Audio API + HTML5 Audio fallback + Vibration + Autoplay Unlock

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isRingingActive: boolean = false;
  private ringInterval: any = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private listeners: Set<(ringing: boolean) => void> = new Set();
  private fallbackAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('hc_ringtone_muted');
      this.isMuted = storedMute === 'true';

      // Pre-generate fallback WAV audio for maximum browser compatibility
      this.initFallbackAudio();

      // Auto-unlock Web Audio on first user interaction for Mobile / APK / iOS / Safari / Android
      const unlock = () => {
        this.unlockAudio();
      };
      ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, unlock, { passive: true });
      });

      // Resume on tab focus or visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRingingActive) {
          this.unlockAudio();
          this.playChimeSequence();
        }
      });
      window.addEventListener('focus', () => {
        if (this.isRingingActive) {
          this.unlockAudio();
          this.playChimeSequence();
        }
      });
    }
  }

  /**
   * Generates a loud, resonant bell chime WAV data-URI as an HTML5 audio fallback
   */
  private initFallbackAudio() {
    try {
      if (typeof window === 'undefined') return;
      const sampleRate = 22050;
      const duration = 1.2;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // WAV Header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Synthesize 4 ascending melodic bell tones: 587Hz (D5), 740Hz (F#5), 880Hz (A5), 1174Hz (D6)
      const tones = [
        { freq: 587.33, start: 0.0, dur: 0.25 },
        { freq: 739.99, start: 0.18, dur: 0.25 },
        { freq: 880.00, start: 0.36, dur: 0.30 },
        { freq: 1174.66, start: 0.54, dur: 0.60 }
      ];

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        for (const tone of tones) {
          if (t >= tone.start && t <= tone.start + tone.dur) {
            const toneT = t - tone.start;
            const envelope = Math.exp(-toneT * 6.5);
            // Fundamental + 2nd harmonic
            const wave = Math.sin(2 * Math.PI * tone.freq * toneT) * 0.7 +
                         Math.sin(2 * Math.PI * tone.freq * 2 * toneT) * 0.3;
            sample += wave * envelope * 0.85;
          }
        }

        // Clamp to 16-bit PCM
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);
      this.fallbackAudio = new Audio(audioUrl);
      this.fallbackAudio.preload = 'auto';
    } catch (e) {
      console.warn('Fallback audio creation note:', e);
    }
  }

  public unlockAudio(): boolean {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (this.fallbackAudio) {
        // Warm-up HTML5 audio element
        this.fallbackAudio.volume = 0.01;
        const playPromise = this.fallbackAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.fallbackAudio?.pause();
            if (this.fallbackAudio) this.fallbackAudio.currentTime = 0;
            if (this.fallbackAudio) this.fallbackAudio.volume = 1.0;
          }).catch(() => {});
        }
      }
      this.isUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  public isAudioReady(): boolean {
    return this.isUnlocked && this.audioCtx !== null && this.audioCtx.state === 'running';
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
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
      if (this.fallbackAudio) this.fallbackAudio.pause();
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
   * Synthesize a loud, lively, pleasant melodic order dispatch chime
   * Pattern: D5 (587Hz) -> F#5 (740Hz) -> A5 (880Hz) -> D6 (1175Hz)
   */
  public playChimeSequence() {
    if (this.isMuted) return;

    // Trigger mobile device vibration in Android / Chrome / Mobile APK
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([400, 150, 400, 150, 600]);
      }
    } catch {}

    let webAudioSuccess = false;

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (ctx.state === 'running') {
        const now = ctx.currentTime;
        const notes = [
          { freq: 587.33, start: 0.0, dur: 0.25, gain: 0.60 }, // D5
          { freq: 739.99, start: 0.18, dur: 0.25, gain: 0.65 }, // F#5
          { freq: 880.00, start: 0.36, dur: 0.28, gain: 0.70 }, // A5
          { freq: 1174.66, start: 0.54, dur: 0.65, gain: 0.80 }, // D6
          
          // Echo accent chime
          { freq: 880.00, start: 0.95, dur: 0.22, gain: 0.55 },
          { freq: 1174.66, start: 1.15, dur: 0.60, gain: 0.75 },
        ];

        notes.forEach(({ freq, start, dur, gain: noteGain }) => {
          const osc = ctx.createOscillator();
          const oscHarmonic = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + start);

          oscHarmonic.type = 'triangle';
          oscHarmonic.frequency.setValueAtTime(freq * 2, now + start);

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

        webAudioSuccess = true;
      }
    } catch (err) {
      console.warn('Web Audio synthesis note:', err);
    }

    // If Web Audio was not running or blocked, use HTML5 Audio fallback
    if (!webAudioSuccess && this.fallbackAudio) {
      try {
        this.fallbackAudio.currentTime = 0;
        this.fallbackAudio.volume = 1.0;
        this.fallbackAudio.play().catch(() => {});
      } catch (err) {
        console.warn('HTML5 Audio fallback note:', err);
      }
    }
  }

  /**
   * Start looping the incoming order ringtone continuously until stopped or accepted
   */
  public startOrderRingtone() {
    this.unlockAudio();
    if (this.isRingingActive) return;
    this.isRingingActive = true;
    this.notifyListeners();

    // Play first chime immediately
    this.playChimeSequence();

    // Loop chime every 1.8 seconds
    if (this.ringInterval) clearInterval(this.ringInterval);
    this.ringInterval = setInterval(() => {
      if (this.isRingingActive) {
        this.playChimeSequence();
      }
    }, 1800);
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
    if (this.fallbackAudio) {
      try {
        this.fallbackAudio.pause();
        this.fallbackAudio.currentTime = 0;
      } catch {}
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
      this.unlockAudio();
      const ctx = this.getAudioContext();
      if (ctx.state === 'running') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.20); // C6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.5, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      }
    } catch (err) {}
  }

  /**
   * Manual test sound trigger
   */
  public testRingtone() {
    this.unlockAudio();
    this.playChimeSequence();
  }
}

export const soundService = new SoundService();
