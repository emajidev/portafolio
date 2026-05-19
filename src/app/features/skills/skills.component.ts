import { Component } from '@angular/core';
import { SKILLS } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [RevealDirective, TiltDirective],
  template: `
    <section id="skills" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Stack <span class="neon-text">DevOps & IA</span></h2>
        <p class="section-subtitle">&gt; Competencias técnicas en producción</p>
      </div>
      <div class="container mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        @for (s of skills; track s.name; let i = $index) {
          <article appTilt appReveal [delay]="i * 40" class="skill-card">
            <div class="skill-card__orb" aria-hidden="true"></div>
            <span class="text-2xl">{{ s.icon }}</span>
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
      border: 1px solid rgb(139 255 77 / 20%);
      background: rgb(17 17 17 / 50%);
      overflow: hidden;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .skill-card:hover {
      border-color: rgb(139 255 77 / 45%);
      box-shadow: 0 0 24px rgb(139 255 77 / 15%);
    }
    .skill-card__orb {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgb(139 255 77 / 10%);
      filter: blur(20px);
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
      background: linear-gradient(90deg, #00ff88, #8bff4d);
      box-shadow: 0 0 8px #39ff14;
      transition: width 1s ease;
    }
    `,
  ],
})
export class SkillsComponent {
  readonly skills = SKILLS;
}
