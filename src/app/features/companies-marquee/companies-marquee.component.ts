import { Component } from '@angular/core';
import { EXPERIENCES } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-companies-marquee',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section class="marquee-section" aria-label="Empresas con las que he trabajado">
      <div class="container" appReveal>
        <p class="marquee-eyebrow font-mono">&gt; Empresas con las que he trabajado</p>
      </div>
      <div class="marquee-track" aria-hidden="true">
        <div class="marquee-row">
          @for (c of companies; track $index) {
            <span class="marquee-item">{{ c }}</span>
          }
        </div>
        <div class="marquee-row">
          @for (c of companies; track $index) {
            <span class="marquee-item">{{ c }}</span>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .marquee-section {
      position: relative;
      padding: 2.5rem 0;
      border-top: 1px solid rgb(255 255 255 / 4%);
      overflow: hidden;
    }
    .marquee-eyebrow {
      font-size: 0.8rem;
      color: rgb(237 237 237 / 45%);
      margin-bottom: 1.25rem;
    }
    .marquee-track {
      display: flex;
      width: max-content;
      animation: marquee-scroll 32s linear infinite;
    }
    .marquee-row {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .marquee-item {
      flex-shrink: 0;
      padding: 0 2.25rem;
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.1rem, 2.4vw, 1.6rem);
      font-weight: 600;
      color: rgb(237 237 237 / 30%);
      white-space: nowrap;
      transition: color 0.3s;
    }
    .marquee-item::after {
      content: '◆';
      margin-left: 2.25rem;
      font-size: 0.6rem;
      color: rgb(0 229 255 / 30%);
      vertical-align: middle;
    }
    .marquee-section:hover .marquee-track {
      animation-play-state: paused;
    }
    @keyframes marquee-scroll {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .marquee-track { animation: none; }
    }
    `,
  ],
})
export class CompaniesMarqueeComponent {
  readonly companies = [...new Set(EXPERIENCES.map((e) => e.company))];
}
