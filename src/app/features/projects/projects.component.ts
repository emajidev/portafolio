import { Component, signal } from '@angular/core';
import { PROJECTS } from '../../core/data/portfolio.data';
import { Project } from '../../core/models/portfolio.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RevealDirective, TiltDirective],
  template: `
    <section id="projects" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Proyectos <span class="neon-text">IA</span></h2>
        <p class="section-subtitle">&gt; Experimentos y productos en producción</p>
      </div>
      <div class="container mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (p of projects; track p.id; let i = $index) {
          <article
            appTilt
            appReveal
            [delay]="i * 60"
            class="project-card interactive"
            [class.project-card--featured]="p.featured"
            (click)="open(p)"
            (keydown.enter)="open(p)"
            tabindex="0"
            role="button"
          >
            <div class="project-card__glow" aria-hidden="true"></div>
            <div class="project-card__visual">
              <span class="project-card__tag">{{ p.tags[0] }}</span>
            </div>
            <div class="project-card__body">
              <div class="flex flex-wrap gap-1">
                @for (t of p.tags; track t) {
                  <span class="chip">{{ t }}</span>
                }
              </div>
              <h3 class="mt-3 font-display text-lg font-semibold">{{ p.title }}</h3>
              <p class="mt-2 text-sm text-white/55 line-clamp-2">{{ p.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                @for (s of p.stack.slice(0, 3); track s) {
                  <span class="font-mono text-[10px] text-matrix-terminal">{{ s }}</span>
                }
              </div>
            </div>
          </article>
        }
      </div>

      @if (selected(); as p) {
        <div class="modal-backdrop" (click)="close()" (keydown.escape)="close()">
          <article class="modal" (click)="$event.stopPropagation()" appReveal>
            <button type="button" class="modal-close interactive" (click)="close()">✕</button>
            <h3 class="font-display text-2xl font-bold neon-text">{{ p.title }}</h3>
            <p class="mt-4 text-white/75">{{ p.description }}</p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h4 class="font-mono text-sm text-matrix-neon">Challenge</h4>
                <p class="mt-1 text-sm text-white/60">{{ p.challenges }}</p>
              </div>
              <div>
                <h4 class="font-mono text-sm text-matrix-neon">Resultado</h4>
                <p class="mt-1 text-sm text-white/60">{{ p.results }}</p>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              @for (s of p.stack; track s) {
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
    .project-card {
      position: relative;
      overflow: hidden;
      border-radius: 1rem;
      border: 1px solid rgb(255 255 255 / 8%);
      background: rgb(17 17 17 / 60%);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .project-card--featured { grid-column: span 1; }
    @media (min-width: 768px) {
      .project-card--featured:first-child { grid-column: span 2; }
    }
    .project-card:hover {
      border-color: rgb(139 255 77 / 45%);
      box-shadow: 0 0 30px rgb(139 255 77 / 12%);
    }
    .project-card__glow {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgb(139 255 77 / 8%), transparent 50%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .project-card:hover .project-card__glow { opacity: 1; }
    .project-card__visual {
      height: 8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, rgb(139 255 77 / 12%), rgb(5 5 5));
    }
    .project-card--featured .project-card__visual { height: 10rem; }
    .project-card__tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2rem;
      opacity: 0.25;
      color: #8bff4d;
    }
    .project-card__body { padding: 1.25rem; position: relative; }
    .chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgb(139 255 77 / 10%);
      color: #8bff4d;
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
      max-width: 36rem;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid rgb(139 255 77 / 30%);
      background: rgb(17 17 17 / 95%);
      box-shadow: 0 0 40px rgb(139 255 77 / 15%);
    }
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: #8bff4d;
      font-family: monospace;
    }
    `,
  ],
})
export class ProjectsComponent {
  readonly projects = PROJECTS;
  readonly selected = signal<Project | null>(null);

  open(p: Project): void {
    this.selected.set(p);
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.selected.set(null);
    document.body.style.overflow = '';
  }
}
