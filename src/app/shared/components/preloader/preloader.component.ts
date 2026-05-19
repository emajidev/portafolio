import { Component, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-preloader',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="preloader" role="alert" aria-busy="true">
        <p class="preloader-title">EMANUEL_J.M</p>
        <p class="preloader-sub">{{ text() }}</p>
        <div class="preloader-track"><div class="preloader-fill" [style.width.%]="pct()"></div></div>
      </div>
    }
  `,
  styles: [
    `
    .preloader {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #050505;
      gap: 1rem;
    }
    .preloader-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.25rem;
      color: #8bff4d;
      text-shadow: 0 0 20px #39ff14;
    }
    .preloader-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: rgb(237 237 237 / 50%);
    }
    .preloader-track {
      width: 240px;
      height: 3px;
      background: #111;
      border-radius: 2px;
      overflow: hidden;
    }
    .preloader-fill {
      height: 100%;
      background: linear-gradient(90deg, #39ff14, #8bff4d);
      transition: width 0.3s ease;
    }
    `,
  ],
})
export class PreloaderComponent implements OnInit {
  readonly loaded = output<void>();
  readonly visible = signal(true);
  readonly pct = signal(0);
  readonly text = signal('Inicializando...');

  ngOnInit(): void {
    const steps = [
      { p: 25, t: 'Cargando Matrix...' },
      { p: 55, t: 'Activando Davi...' },
      { p: 85, t: 'Sync DevOps stack...' },
      { p: 100, t: 'Listo.' },
    ];
    let i = 0;
    const tick = (): void => {
      if (i < steps.length) {
        this.pct.set(steps[i].p);
        this.text.set(steps[i].t);
        i++;
        setTimeout(tick, 350);
      } else {
        setTimeout(() => {
          this.visible.set(false);
          this.loaded.emit();
        }, 300);
      }
    };
    tick();
  }
}
