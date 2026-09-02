import { Component } from '@angular/core';
import { EXPERIENCES } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section id="experience" class="section experience-section">
      <div class="container" appReveal>
        <h2 class="section-title">Experiencia <span class="neon-text">Timeline</span></h2>
        <p class="section-subtitle">&gt; Trayectoria profesional</p>
      </div>

      <div class="timeline-wrap">
        <div class="timeline-scroll">
          @for (e of exp; track e.company; let i = $index) {
            <article appReveal [delay]="i * 100" class="timeline-card">
              <span class="timeline-dot" aria-hidden="true"></span>
              <p class="font-mono text-xs text-matrix-terminal">{{ e.period }}</p>
              <h3 class="mt-2 font-semibold text-matrix-neon leading-snug">{{ e.role }}</h3>
              <p class="font-medium text-white/90">{{ e.company }}</p>
              @if (e.bullets?.length) {
                <ul class="mt-2 flex flex-col gap-1.5">
                  @for (b of e.bullets; track b) {
                    <li class="flex gap-1.5 text-sm text-white/55 leading-relaxed">
                      <span class="text-matrix-neon" aria-hidden="true">▹</span>
                      <span>{{ b }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-2 text-sm text-white/55 leading-relaxed">{{ e.impact }}</p>
              }
              <div class="mt-4 flex flex-wrap gap-1.5">
                @for (t of e.technologies; track t) {
                  <span class="chip">{{ t }}</span>
                }
              </div>
            </article>
          }
        </div>

        <!-- Línea debajo de las cards, sin solapar -->
        <div class="timeline-rail" aria-hidden="true">
          <div class="timeline-rail__line"></div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .experience-section {
      padding-bottom: 6rem;
      overflow: hidden;
    }

    .timeline-wrap {
      margin-top: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .timeline-scroll {
      display: flex;
      gap: 1.25rem;
      overflow-x: auto;
      padding: 1rem 1.5rem 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgb(0 229 255 / 30%) transparent;
    }

    .timeline-scroll::-webkit-scrollbar {
      height: 4px;
    }
    .timeline-scroll::-webkit-scrollbar-thumb {
      background: rgb(0 229 255 / 35%);
      border-radius: 2px;
    }

    .timeline-card {
      position: relative;
      flex: 0 0 min(21rem, 88vw);
      scroll-snap-align: start;
      padding: 1.5rem 1.5rem 1.75rem;
      margin-top: 0.5rem;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 20%);
      background: rgb(17 17 17 / 70%);
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    .timeline-card:hover {
      border-color: rgb(0 229 255 / 45%);
      box-shadow: 0 0 24px rgb(0 229 255 / 12%);
    }

    .timeline-dot {
      position: absolute;
      top: -5px;
      left: 1.5rem;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00e5ff;
      box-shadow: 0 0 10px #22d3ee;
      z-index: 2;
    }

    .chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: rgb(0 229 255 / 10%);
      color: #00e5ff;
      white-space: nowrap;
    }

    /* Rail debajo de las cards */
    .timeline-rail {
      position: relative;
      margin: 1.25rem 1.5rem 0;
      height: 2px;
      flex-shrink: 0;
    }

    .timeline-rail__line {
      width: 100%;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgb(0 229 255 / 50%) 15%,
        rgb(0 229 255 / 50%) 85%,
        transparent 100%
      );
      box-shadow: 0 0 8px rgb(0 229 255 / 20%);
    }

    @media (min-width: 768px) {
      .timeline-scroll {
        padding-left: max(1.5rem, calc((100% - 72rem) / 2 + 1.5rem));
        padding-right: 1.5rem;
      }
      .timeline-rail {
        margin-left: max(1.5rem, calc((100% - 72rem) / 2 + 1.5rem));
        margin-right: max(1.5rem, calc((100% - 72rem) / 2 + 1.5rem));
      }
    }
    `,
  ],
})
export class ExperienceComponent {
  readonly exp = EXPERIENCES;
}
