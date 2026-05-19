import { Component } from '@angular/core';
import { EXPERIENCES } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section id="experience" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Experiencia <span class="neon-text">Timeline</span></h2>
        <p class="section-subtitle">&gt; Trayectoria profesional</p>
      </div>
      <div class="timeline-wrap mt-10">
        <div class="timeline-track" aria-hidden="true"></div>
        <div class="timeline-scroll">
          @for (e of exp; track e.company; let i = $index) {
            <article appReveal [delay]="i * 100" class="timeline-card">
              <span class="timeline-dot"></span>
              <p class="font-mono text-xs text-matrix-terminal">{{ e.period }}</p>
              <h3 class="mt-2 font-semibold text-matrix-neon">{{ e.role }}</h3>
              <p class="font-medium">{{ e.company }}</p>
              <p class="mt-2 text-sm text-white/55">{{ e.impact }}</p>
              <div class="mt-3 flex flex-wrap gap-1">
                @for (t of e.technologies; track t) {
                  <span class="chip">{{ t }}</span>
                }
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .timeline-wrap { position: relative; }
    .timeline-track {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 2.5rem;
      height: 2px;
      background: linear-gradient(90deg, transparent, #8bff4d, transparent);
      opacity: 0.4;
    }
    .timeline-scroll {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0 1.5rem 1.5rem;
      scroll-snap-type: x mandatory;
    }
    .timeline-card {
      position: relative;
      flex: 0 0 18rem;
      scroll-snap-align: start;
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgb(139 255 77 / 20%);
      background: rgb(17 17 17 / 60%);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .timeline-card:hover {
      border-color: rgb(139 255 77 / 45%);
      box-shadow: 0 0 24px rgb(139 255 77 / 12%);
    }
    .timeline-dot {
      position: absolute;
      top: -6px;
      left: 1.5rem;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #8bff4d;
      box-shadow: 0 0 10px #39ff14;
    }
    .chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: rgb(139 255 77 / 10%);
      color: #8bff4d;
    }
    `,
  ],
})
export class ExperienceComponent {
  readonly exp = EXPERIENCES;
}
