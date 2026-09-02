export type BitSentiment = 'yes' | 'no' | 'neutral';

const MUTE_KEY = 'davi-muted';

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

class BitSoundEngine {
  private ctx?: AudioContext;
  private unlocked = false;
  private mutedState = false;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      this.mutedState = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.mutedState = false;
    }
    const unlock = (): void => {
      this.ensureContext()?.resume().catch(() => {});
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  }

  get muted(): boolean {
    return this.mutedState;
  }

  setMuted(value: boolean): void {
    this.mutedState = value;
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  private ensureContext(): AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return undefined;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  private blip(freq: number, duration: number, type: OscillatorType, distortion: number, gainPeak = 0.06): void {
    if (this.mutedState) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(distortion);
    shaper.oversample = '2x';

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(shaper).connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  playIdleTick(): void {
    this.blip(520, 0.07, 'square', 4, 0.035);
  }

  playHit(): void {
    this.blip(880, 0.05, 'square', 5, 0.045);
  }

  playScore(): void {
    this.blip(660, 0.08, 'square', 6, 0.05);
    setTimeout(() => this.blip(990, 0.1, 'square', 6, 0.05), 60);
  }

  playCountdownTick(): void {
    this.blip(440, 0.09, 'square', 3, 0.04);
  }

  playWin(): void {
    if (this.mutedState) return;
    [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => this.blip(f, 0.16, 'square', 5, 0.055), i * 100));
  }

  playLose(): void {
    if (this.mutedState) return;
    [420, 320, 220, 140].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'sawtooth', 24, 0.05), i * 120));
  }

  /** Estallido de "derez" tipo Tron: zap agudo + rumble grave descendente. */
  playCrash(): void {
    if (this.mutedState) return;
    this.blip(1500, 0.07, 'square', 10, 0.055);
    this.blip(140, 0.32, 'sawtooth', 30, 0.07);
    setTimeout(() => this.blip(90, 0.4, 'sawtooth', 34, 0.06), 50);
    setTimeout(() => this.blip(700, 0.05, 'square', 8, 0.04), 90);
  }

  playYesChirp(): void {
    if (this.mutedState) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.blip(720, 0.09, 'square', 6, 0.05);
    setTimeout(() => this.blip(1180, 0.11, 'square', 8, 0.05), 70);
  }

  playNoBuzz(): void {
    if (this.mutedState) return;
    this.blip(300, 0.16, 'sawtooth', 22, 0.05);
    setTimeout(() => this.blip(150, 0.2, 'sawtooth', 28, 0.045), 90);
  }

  /** "Habla" el texto: una secuencia de notas cortas derivadas de sus caracteres, coloreada por sentimiento. */
  speak(text: string, sentiment: BitSentiment): void {
    if (this.mutedState) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const chunks = text
      .replace(/[¿?¡!.,]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 14);
    if (!chunks.length) return;

    const [lo, hi] = sentiment === 'yes' ? [520, 1300] : sentiment === 'no' ? [140, 420] : [320, 780];
    const type: OscillatorType = sentiment === 'no' ? 'sawtooth' : 'square';
    const distortion = sentiment === 'no' ? 24 : sentiment === 'yes' ? 5 : 10;

    chunks.forEach((word, i) => {
      const code = word.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
      const freq = lo + (code % (hi - lo));
      const jitter = 1 + (Math.random() - 0.5) * 0.08;
      setTimeout(() => this.blip(freq * jitter, 0.07, type, distortion, 0.045), i * 85);
    });
  }
}

export const bitSound = new BitSoundEngine();
