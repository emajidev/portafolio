import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HERO_TECH } from '../../core/data/portfolio.data';
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
          <app-clawd />
          <svg class="tech-lines" aria-hidden="true">
            @for (n of tech; track n.id; let i = $index) {
              @if (i > 0) {
                <line
                  [attr.x1]="tech[i-1].x + '%'" [attr.y1]="tech[i-1].y + '%'"
                  [attr.x2]="n.x + '%'" [attr.y2]="n.y + '%'"
                  stroke="rgba(139,255,77,0.15)" stroke-width="1"
                />
              }
            }
          </svg>
          @for (n of tech; track n.id) {
            <div class="tech-node interactive" [style.left.%]="n.x - 6" [style.top.%]="n.y">
              <span class="tech-icon">{{ n.icon }}</span>
              <span class="tech-label">{{ n.label }}</span>
            </div>
          }
          <div class="desk-props" aria-hidden="true">
            <div class="desk-laptop">
              <span class="text-matrix-neon">class</span> Soluciones:<br />
              <span class="text-white/40">  self.ia = True</span><br />
              <span class="text-matrix-terminal">  return "🚀"</span>
            </div>
            <div class="desk-mug">&lt;/&gt;</div>
          </div>
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
      position: relative;
      min-height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tech-lines {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .tech-node {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid rgb(139 255 77 / 30%);
      border-radius: 0.75rem;
      background: rgb(17 17 17 / 80%);
      backdrop-filter: blur(12px);
      transition: all 0.3s;
    }
    .tech-node:hover {
      border-color: rgb(139 255 77 / 60%);
      box-shadow: 0 0 20px rgb(139 255 77 / 25%);
      transform: scale(1.05);
    }
    .tech-icon { font-size: 1.25rem; }
    .tech-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.6rem;
      color: #8bff4d;
    }
    .desk-props {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 5rem;
      display: none;
    }
    @media (min-width: 768px) { .desk-props { display: block; } }
    .desk-laptop {
      position: absolute;
      left: 5%;
      bottom: 0;
      width: 7rem;
      padding: 0.35rem;
      border: 1px solid rgb(139 255 77 / 20%);
      border-radius: 0.25rem;
      background: rgb(0 0 0 / 80%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.45rem;
      line-height: 1.4;
      box-shadow: 0 0 15px rgb(139 255 77 / 10%);
    }
    .desk-mug {
      position: absolute;
      right: 8%;
      bottom: 0.5rem;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgb(139 255 77 / 25%);
      border-radius: 0.25rem;
      background: rgb(17 17 17 / 90%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      color: #8bff4d;
      text-shadow: 0 0 8px #39ff14;
    }
    .cursor-blink { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class HeroComponent implements OnInit {
  readonly tech = HERO_TECH;
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
