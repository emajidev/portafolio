import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

// Pista alojada localmente (public/audio/lofi-loop.mp3) para no depender de streams
// externos que pueden bloquearse por red/CDN. Fuente: Wikimedia Commons, CC BY 4.0.
const TRACK_LABEL = '"Fly Forward" — raspberrymusic (CC BY 4.0)';
const VOLUME_KEY = 'davi-radio-volume-v3';
const BAR_COUNT = 12;

@Component({
  selector: 'app-radio-player',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="radio-bar">
      <audio #audio src="audio/lofi-loop.mp3" preload="auto" loop></audio>

      <button
        type="button"
        class="interactive radio-play"
        [attr.aria-label]="playing() ? 'Pausar radio' : 'Reproducir radio'"
        (click)="toggle()"
      >
        <app-icon [name]="loading() ? 'radio' : playing() ? 'pause' : 'play'" class="radio-play__icon" [class.radio-play__icon--spin]="loading()" />
      </button>

      <div class="radio-info">
        <p class="radio-info__title">LOFI <span class="neon-text">RADIO</span></p>
        <p class="radio-info__sub" [class.radio-info__sub--error]="errored()">
          {{ errored() ? 'No se pudo cargar el audio — click para reintentar' : trackLabel }}
        </p>
      </div>

      <div class="radio-bars" [class.radio-bars--live]="playing()" aria-hidden="true">
        @for (b of bars; track $index) {
          <span class="radio-bar__eq" [style.animationDelay.ms]="$index * 70"></span>
        }
      </div>

      <div class="radio-volume-wrap">
        <app-icon [name]="isMuted() || volume() === 0 ? 'volume-x' : 'volume'" class="radio-volume-icon" />
        <input
          type="range"
          class="radio-volume"
          min="0"
          max="1"
          step="0.01"
          [value]="volume()"
          (input)="setVolume($event)"
          aria-label="Volumen de la radio"
        />
      </div>
    </div>
  `,
  styles: [
    `
    .radio-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 60;
      height: var(--radio-bar-h);
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0 1.25rem;
      border-bottom: 1px solid rgb(0 229 255 / 25%);
      background: rgb(3 5 10 / 92%);
      backdrop-filter: blur(10px);
    }

    .radio-play {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.9rem;
      height: 1.9rem;
      flex-shrink: 0;
      border-radius: 50%;
      background: rgb(0 229 255 / 12%);
      border: 1px solid rgb(0 229 255 / 45%);
      color: #00e5ff;
      transition: background 0.2s, transform 0.15s;
    }
    .radio-play:hover { background: rgb(0 229 255 / 22%); transform: scale(1.06); }
    .radio-play__icon { width: 0.9rem; height: 0.9rem; }
    .radio-play__icon--spin { animation: radio-spin 1.4s linear infinite; }
    @keyframes radio-spin { to { transform: rotate(360deg); } }

    .radio-info {
      flex-shrink: 0;
      line-height: 1.15;
      min-width: 0;
    }
    .radio-info__title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: #ededed;
    }
    .radio-info__sub {
      margin-top: 0.1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.62rem;
      color: rgb(125 249 255 / 60%);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 14rem;
    }
    .radio-info__sub--error {
      color: #ff3b3b;
    }

    .radio-bars {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      height: 1.1rem;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    @media (min-width: 640px) {
      .radio-bars { display: flex; }
    }
    .radio-bar__eq {
      width: 0.2rem;
      height: 20%;
      border-radius: 999px;
      background: linear-gradient(180deg, #00e5ff, #22d3ee);
      opacity: 0.35;
      transition: height 0.2s ease, opacity 0.2s ease;
    }
    .radio-bars--live .radio-bar__eq {
      opacity: 0.9;
      animation: radio-eq 0.85s ease-in-out infinite alternate;
    }
    @keyframes radio-eq {
      0% { height: 15%; }
      100% { height: 100%; }
    }

    .radio-volume-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      margin-left: auto;
    }
    .radio-volume-icon {
      width: 0.95rem;
      height: 0.95rem;
      color: rgb(125 249 255 / 70%);
      flex-shrink: 0;
    }
    .radio-volume {
      width: 5rem;
      appearance: none;
      height: 3px;
      border-radius: 999px;
      background: rgb(0 229 255 / 18%);
      outline: none;
      cursor: pointer;
    }
    .radio-volume::-webkit-slider-thumb {
      appearance: none;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #00e5ff;
      box-shadow: 0 0 8px rgb(0 229 255 / 60%);
    }
    .radio-volume::-moz-range-thumb {
      width: 11px;
      height: 11px;
      border: none;
      border-radius: 50%;
      background: #00e5ff;
      box-shadow: 0 0 8px rgb(0 229 255 / 60%);
    }

    @media (max-width: 639px) {
      .radio-info__sub { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .radio-bars--live .radio-bar__eq, .radio-play__icon--spin { animation: none; }
    }
    `,
  ],
})
export class RadioPlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('audio') private readonly audioRef!: ElementRef<HTMLAudioElement>;
  private readonly platformId = inject(PLATFORM_ID);

  readonly trackLabel = TRACK_LABEL;
  readonly playing = signal(false);
  readonly loading = signal(false);
  readonly errored = signal(false);
  readonly isMuted = signal(false);
  readonly volume = signal(0.1);
  readonly bars = Array.from({ length: BAR_COUNT });

  private wantsToPlay = false;
  private loadingTimer?: ReturnType<typeof setTimeout>;
  private onPlaying?: () => void;
  private onWaiting?: () => void;
  private onPause?: () => void;
  private onError?: () => void;
  private onFirstGesture?: () => void;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      if (saved !== null) this.volume.set(Number(saved));
    } catch {
      /* ignore */
    }

    const audio = this.audioRef.nativeElement;
    audio.volume = this.volume();

    this.onPlaying = () => {
      clearTimeout(this.loadingTimer);
      this.loading.set(false);
      this.playing.set(true);
      this.errored.set(false);
    };
    this.onWaiting = () => this.loading.set(true);
    this.onPause = () => {
      if (this.wantsToPlay) return;
      this.loading.set(false);
      this.playing.set(false);
    };
    this.onError = () => {
      this.wantsToPlay = false;
      this.loading.set(false);
      this.playing.set(false);
      this.errored.set(true);
      const mediaError = audio.error;
      const codes: Record<number, string> = {
        1: 'MEDIA_ERR_ABORTED',
        2: 'MEDIA_ERR_NETWORK',
        3: 'MEDIA_ERR_DECODE',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
      };
      console.warn(
        '[radio-player] audio error',
        mediaError ? `${codes[mediaError.code] ?? mediaError.code} — ${mediaError.message || '(sin mensaje)'}` : '(sin MediaError, probablemente timeout)',
        { src: audio.currentSrc, networkState: audio.networkState, readyState: audio.readyState },
      );
    };

    audio.addEventListener('playing', this.onPlaying);
    audio.addEventListener('waiting', this.onWaiting);
    audio.addEventListener('pause', this.onPause);
    audio.addEventListener('error', this.onError);

    // Los navegadores bloquean el autoplay CON sonido sin gesto del usuario, pero
    // siempre permiten autoplay silenciado. Arrancamos así y desmuteamos en el primer
    // click/tecla que el usuario haga en cualquier parte de la página.
    audio.muted = true;
    this.isMuted.set(true);
    this.play();

    this.onFirstGesture = () => {
      audio.muted = false;
      this.isMuted.set(false);
      // Este handler corre dentro de un gesto real del usuario: es el contexto más
      // confiable posible para arrancar audio. Si por lo que sea seguía sin sonar
      // (extensión del navegador, bloqueo del sitio, etc.), lo reintentamos aquí.
      if (audio.paused && this.wantsToPlay) {
        audio.play().catch(() => this.onError?.());
      }
      document.removeEventListener('pointerdown', this.onFirstGesture!);
      document.removeEventListener('keydown', this.onFirstGesture!);
    };
    document.addEventListener('pointerdown', this.onFirstGesture, { passive: true });
    document.addEventListener('keydown', this.onFirstGesture);
  }

  private play(): void {
    const audio = this.audioRef.nativeElement;
    this.wantsToPlay = true;
    this.errored.set(false);
    this.loading.set(true);

    clearTimeout(this.loadingTimer);
    this.loadingTimer = setTimeout(() => {
      if (this.loading()) this.onError?.();
    }, 6000);

    // Un rechazo de play() suele ser una política de autoplay transitoria, no un archivo
    // roto — reintenta una vez tras un respiro. El evento 'error' real del <audio> (archivo
    // caído, formato no soportado) es la única fuente de verdad para marcar fallo genuino.
    audio.play().catch(() => {
      setTimeout(() => {
        if (this.wantsToPlay) audio.play().catch(() => {});
      }, 400);
    });
  }

  toggle(): void {
    const audio = this.audioRef.nativeElement;
    if (this.errored()) {
      this.play();
      return;
    }
    if (this.playing() || this.loading()) {
      this.wantsToPlay = false;
      audio.pause();
      this.loading.set(false);
      this.playing.set(false);
      return;
    }
    this.play();
  }

  setVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume.set(value);
    this.audioRef.nativeElement.volume = value;
    try {
      localStorage.setItem(VOLUME_KEY, String(value));
    } catch {
      /* ignore */
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    clearTimeout(this.loadingTimer);
    if (this.onFirstGesture) {
      document.removeEventListener('pointerdown', this.onFirstGesture);
      document.removeEventListener('keydown', this.onFirstGesture);
    }
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    audio.pause();
    if (this.onPlaying) audio.removeEventListener('playing', this.onPlaying);
    if (this.onWaiting) audio.removeEventListener('waiting', this.onWaiting);
    if (this.onPause) audio.removeEventListener('pause', this.onPause);
    if (this.onError) audio.removeEventListener('error', this.onError);
  }
}
