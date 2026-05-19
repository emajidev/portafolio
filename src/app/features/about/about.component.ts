import { Component } from '@angular/core';
import { ABOUT_CARDS } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RevealDirective, TiltDirective],
  template: `
    <section id="about" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Sobre <span class="neon-text">mí</span></h2>
        <p class="section-subtitle">&gt; Filosofía, experiencia y visión</p>
      </div>
      <div class="container mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (c of cards; track c.title; let i = $index) {
          <article appTilt appReveal [delay]="i * 50" class="bento-card">
            <span class="text-3xl">{{ c.icon }}</span>
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
      border: 1px solid rgb(139 255 77 / 18%);
      background: rgb(17 17 17 / 55%);
      backdrop-filter: blur(12px);
      transition: all 0.35s;
    }
    .bento-card:hover {
      border-color: rgb(139 255 77 / 45%);
      box-shadow: 0 0 28px rgb(139 255 77 / 10%);
      transform: translateY(-2px);
    }
    `,
  ],
})
export class AboutComponent {
  readonly cards = ABOUT_CARDS;
}
