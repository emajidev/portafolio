import { Component } from '@angular/core';
import { SKILLS } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';
import { SpotlightDirective } from '../../shared/directives/spotlight.directive';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [RevealDirective, TiltDirective, SpotlightDirective],
  template: `
    <section id="skills" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Stack <span class="neon-text">Fullstack, DevOps & IA</span></h2>
        <p class="section-subtitle">&gt; Competencias técnicas verificadas en producción</p>
      </div>
      <div class="container mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (s of skills; track s.name; let i = $index) {
          <article appTilt appSpotlight appReveal [delay]="i * 40" class="skill-card">
            <div class="skill-card__orb" aria-hidden="true"></div>
            <svg class="skill-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path [attr.d]="s.icon" />
            </svg>
            <h3 class="mt-2 font-medium">{{ s.name }}</h3>
            <span class="font-mono text-xs text-matrix-neon">{{ s.level }}%</span>
            <div class="skill-bar mt-2">
              <div class="skill-bar__fill" [style.width.%]="s.level"></div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [
    `
    .skill-card {
      position: relative;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 20%);
      background: rgb(17 17 17 / 50%);
      overflow: hidden;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .skill-card:hover {
      border-color: rgb(0 229 255 / 45%);
      box-shadow: 0 0 24px rgb(0 229 255 / 15%);
    }
    .skill-card__orb {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgb(0 229 255 / 10%);
      filter: blur(20px);
    }
    .skill-icon {
      width: 1.75rem;
      height: 1.75rem;
      color: #00e5ff;
      filter: drop-shadow(0 0 6px rgb(0 229 255 / 45%));
    }
    .skill-bar {
      height: 4px;
      border-radius: 2px;
      background: rgb(255 255 255 / 8%);
      overflow: hidden;
    }
    .skill-bar__fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #7df9ff, #00e5ff);
      box-shadow: 0 0 8px #22d3ee;
      transition: width 1s ease;
    }
    `,
  ],
})
export class SkillsComponent {
  readonly skills = SKILLS;
}
