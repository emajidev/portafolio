import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AI_EXPERIMENTS } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-ai-lab',
  standalone: true,
  imports: [RevealDirective, FormsModule],
  template: `
    <section id="ai-lab" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">AI <span class="neon-text">Lab</span></h2>
        <p class="section-subtitle">&gt; Experimentos y automatizaciones en vivo</p>
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
            <article appReveal [delay]="i * 80" class="exp-card">
              <div class="flex justify-between items-start">
                <h3 class="font-semibold text-sm">{{ e.title }}</h3>
                <span class="exp-badge" [class.exp-badge--beta]="e.status === 'beta'">{{ e.status }}</span>
              </div>
              <p class="mt-2 font-mono text-[10px] text-matrix-terminal">{{ e.log }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .terminal {
      border-radius: 1rem;
      border: 1px solid rgb(139 255 77 / 25%);
      overflow: hidden;
      background: rgb(5 5 5 / 90%);
    }
    .terminal-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: rgb(17 17 17);
      border-bottom: 1px solid rgb(139 255 77 / 15%);
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
      color: #00ff88;
      line-height: 1.6;
    }
    .terminal-cursor { animation: blink 1s step-end infinite; }
    .terminal-input {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid rgb(139 255 77 / 15%);
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
      border: 1px solid rgb(139 255 77 / 18%);
      background: rgb(17 17 17 / 50%);
      transition: border-color 0.3s;
    }
    .exp-card:hover { border-color: rgb(139 255 77 / 40%); }
    .exp-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: rgb(139 255 77 / 15%);
      color: #8bff4d;
    }
    .exp-badge--beta {
      background: rgb(254 188 46 / 15%);
      color: #febc2e;
    }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class AiLabComponent implements OnInit, OnDestroy {
  readonly experiments = AI_EXPERIMENTS;
  readonly lines = signal<string[]>(['[BOOT] AI Lab v2.4.1', '[OK] Davi connected']);
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
}
