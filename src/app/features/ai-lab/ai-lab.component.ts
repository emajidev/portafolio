import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AI_EXPERIMENTS } from '../../core/data/portfolio.data';
import { AiExperiment } from '../../core/models/portfolio.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';
import { AiCoreOrbComponent } from '../../shared/components/ai-core-orb/ai-core-orb.component';

@Component({
  selector: 'app-ai-lab',
  standalone: true,
  imports: [RevealDirective, SpotlightDirective, FormsModule, AiCoreOrbComponent],
  template: `
    <section id="ai-lab" class="section">
      <div class="container flex flex-wrap items-center justify-between gap-4" appReveal>
        <div>
          <h2 class="section-title">AI <span class="neon-text">Lab</span></h2>
          <p class="section-subtitle">&gt; Experimentos y automatizaciones en vivo</p>
        </div>
        <div class="ai-core" title="Núcleo de IA — pasa el mouse">
          <app-ai-core-orb />
        </div>
      </div>
      <div class="container mt-10 grid gap-6 lg:grid-cols-2">
        <div appReveal class="terminal">
          <div class="terminal-bar">
            <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
            <span class="terminal-title">davi&#64;ai-lab</span>
          </div>
          <div class="terminal-body">
            @for (line of lines(); track $index) {
              <p>{{ line }}</p>
            }
            <span class="terminal-cursor">█</span>
          </div>
          <form class="terminal-input" (submit)="run($event)">
            <span class="text-matrix-neon">&gt;</span>
            <input [(ngModel)]="cmd" name="cmd" placeholder="status | list | help" />
          </form>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (e of experiments; track e.title; let i = $index) {
            <article
              appReveal
              appSpotlight
              [delay]="i * 80"
              class="exp-card interactive"
              (click)="open(e)"
              (keydown.enter)="open(e)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Ver detalle de ' + e.title"
            >
              <div class="flex justify-between items-start">
                <h3 class="font-semibold text-sm">{{ e.title }}</h3>
                <span class="exp-badge" [class.exp-badge--beta]="e.status === 'beta'">{{ e.status }}</span>
              </div>
              <p class="mt-2 font-mono text-[10px] text-matrix-terminal">{{ e.log }}</p>
              <p class="mt-2 exp-more">Ver detalle →</p>
            </article>
          }
        </div>
      </div>

      @if (selected(); as e) {
        <div class="modal-backdrop" (click)="close()" (keydown.escape)="close()">
          <article class="modal" (click)="$event.stopPropagation()" appReveal>
            <button type="button" class="modal-close interactive" (click)="close()" aria-label="Cerrar">✕</button>
            <div class="flex justify-between items-start gap-4">
              <h3 class="font-display text-xl font-bold neon-text">{{ e.title }}</h3>
              <span class="exp-badge" [class.exp-badge--beta]="e.status === 'beta'">{{ e.status }}</span>
            </div>
            <p class="mt-1 font-mono text-[11px] text-matrix-terminal">{{ e.log }}</p>
            <p class="mt-4 text-sm text-white/75 leading-relaxed">{{ e.detail }}</p>
            <div class="mt-4">
              <h4 class="font-mono text-sm text-matrix-neon">Impacto</h4>
              <p class="mt-1 text-sm text-white/60">{{ e.impact }}</p>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              @for (s of e.stack; track s) {
                <span class="chip">{{ s }}</span>
              }
            </div>
          </article>
        </div>
      }
    </section>
  `,
  styles: [
    `
    .ai-core {
      width: 5.5rem;
      height: 5.5rem;
      flex-shrink: 0;
    }
    .terminal {
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 25%);
      overflow: hidden;
      background: rgb(5 5 5 / 90%);
    }
    .terminal-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: rgb(17 17 17);
      border-bottom: 1px solid rgb(0 229 255 / 15%);
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .red { background: #ff5f57; }
    .yellow { background: #febc2e; }
    .green { background: #28c840; }
    .terminal-title {
      margin-left: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: rgb(237 237 237 / 40%);
    }
    .terminal-body {
      height: 14rem;
      overflow-y: auto;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #7df9ff;
      line-height: 1.6;
    }
    .terminal-cursor { animation: blink 1s step-end infinite; }
    .terminal-input {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid rgb(0 229 255 / 15%);
    }
    .terminal-input input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #ededed;
    }
    .exp-card {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid rgb(0 229 255 / 18%);
      background: rgb(17 17 17 / 50%);
      transition: border-color 0.3s;
      cursor: pointer;
    }
    .exp-card:hover { border-color: rgb(0 229 255 / 40%); }
    .exp-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: rgb(0 229 255 / 15%);
      color: #00e5ff;
    }
    .exp-badge--beta {
      background: rgb(254 188 46 / 15%);
      color: #febc2e;
    }
    .exp-more {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: rgb(0 229 255 / 55%);
    }
    .chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgb(0 229 255 / 10%);
      color: #00e5ff;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgb(0 0 0 / 75%);
      backdrop-filter: blur(8px);
    }
    .modal {
      position: relative;
      max-width: 32rem;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 30%);
      background: rgb(17 17 17 / 95%);
      box-shadow: 0 0 40px rgb(0 229 255 / 15%);
    }
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: #00e5ff;
      font-family: monospace;
    }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class AiLabComponent implements OnInit, OnDestroy {
  readonly experiments = AI_EXPERIMENTS;
  readonly lines = signal<string[]>(['[BOOT] AI Lab v2.4.1', '[OK] Davi connected']);
  readonly selected = signal<AiExperiment | null>(null);
  cmd = '';
  private readonly platformId = inject(PLATFORM_ID);
  private interval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const extra = ['[SCAN] 4 experiments active', '[ML] Pipeline sync running'];
    let i = 0;
    this.interval = setInterval(() => {
      if (i < extra.length) this.lines.update((l) => [...l, extra[i++]]);
    }, 1800);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  run(e: Event): void {
    e.preventDefault();
    const c = this.cmd.trim().toLowerCase();
    const out: Record<string, string[]> = {
      status: ['[STATUS] All systems operational'],
      list: this.experiments.map((x) => `[EXP] ${x.title}`),
      help: ['Commands: status, list, help'],
    };
    this.lines.update((l) => [...l, `> ${c}`, ...(out[c] ?? [`Unknown: ${c}`])]);
    this.cmd = '';
  }

  open(e: AiExperiment): void {
    this.selected.set(e);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.selected.set(null);
    document.body.style.overflow = '';
  }
}
