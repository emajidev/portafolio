import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { ClawdComponent } from '../mascot/clawd.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ClawdComponent, RevealDirective],
  template: `
    <section id="hero" class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-inner">
        <div appReveal>
          <p class="hero-tag font-mono text-sm text-matrix-terminal">
            <span class="text-matrix-neon">&gt;</span> {{ role() }}<span class="cursor-blink">_</span>
          </p>
          <h1 class="hero-name">Emanuel <span class="neon-text">J.M</span></h1>
          <h2 class="hero-headline">
            Impulsando el <span class="neon-text">Futuro con IA</span> y
            <span class="neon-text">DevOps</span> Inteligente
          </h2>
          <p class="hero-desc">
            Ingeniero backend especializado en IA, automatización, DevOps y arquitecturas escalables.
            Creo soluciones que combinan Machine Learning e infraestructura cloud.
          </p>
          <div class="hero-cta">
            <button type="button" class="interactive btn-primary" (click)="go('projects')">
              ◎ Ver Proyectos de IA →
            </button>
            <button type="button" class="interactive btn-secondary" (click)="go('skills')">
              ∞ Enfoque DevOps
            </button>
          </div>
        </div>

        <div class="hero-visual" appReveal [delay]="150">
          <app-clawd variant="hero" />
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 6rem 1.5rem 4rem;
      overflow: hidden;
    }
    .hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgb(139 255 77 / 3%) 1px, transparent 1px),
        linear-gradient(90deg, rgb(139 255 77 / 3%) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent);
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 3rem;
      width: 100%;
      max-width: 72rem;
      margin: 0 auto;
      align-items: center;
    }
    @media (min-width: 1024px) {
      .hero-inner { grid-template-columns: 1fr 1fr; gap: 4rem; }
    }
    .hero-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2.5rem, 6vw, 3.75rem);
      font-weight: 700;
      margin-top: 0.75rem;
    }
    .hero-headline {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.35rem, 3vw, 1.875rem);
      font-weight: 600;
      line-height: 1.3;
      margin-top: 1rem;
    }
    .hero-desc {
      margin-top: 1.25rem;
      max-width: 32rem;
      line-height: 1.7;
      color: rgb(237 237 237 / 65%);
    }
    .hero-cta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 2rem;
    }
    .hero-visual {
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      min-height: 14rem;
      padding: 1rem;
      overflow: visible;
    }
    .cursor-blink { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class HeroComponent implements OnInit {
  readonly role = signal('Backend Engineer');
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const roles = ['Backend Engineer', 'IA & DevOps Specialist', 'Cloud Architect'];
    let i = 0;
    setInterval(() => this.role.set(roles[i++ % roles.length]), 2800);
  }

  go(id: string): void {
    this.scroll.to(id);
  }
}
