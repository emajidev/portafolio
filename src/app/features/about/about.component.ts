import { Component } from '@angular/core';
import { ABOUT_CARDS } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RevealDirective, TiltDirective, SpotlightDirective, IconComponent],
  template: `
    <section id="about" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Sobre <span class="neon-text">mí</span></h2>
        <p class="section-subtitle">&gt; Filosofía, experiencia y visión</p>
      </div>
      <div class="container mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (c of cards; track c.title; let i = $index) {
          <article appTilt appSpotlight appReveal [delay]="i * 50" class="bento-card">
            <app-icon class="bento-card__icon" [name]="c.icon" aria-hidden="true" />
            <h3 class="mt-3 font-display font-semibold text-matrix-neon">{{ c.title }}</h3>
            <p class="mt-2 text-sm text-white/60 leading-relaxed">{{ c.desc }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [
    `
    .bento-card {
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 18%);
      background: rgb(17 17 17 / 55%);
      backdrop-filter: blur(12px);
      transition: all 0.35s;
    }
    .bento-card:hover {
      border-color: rgb(0 229 255 / 45%);
      box-shadow: 0 0 28px rgb(0 229 255 / 10%);
      transform: translateY(-2px);
    }
    .bento-card__icon {
      width: 1.75rem;
      height: 1.75rem;
      color: #00e5ff;
      filter: drop-shadow(0 0 6px rgb(0 229 255 / 45%));
    }
    `,
  ],
})
export class AboutComponent {
  readonly cards = ABOUT_CARDS;
}
