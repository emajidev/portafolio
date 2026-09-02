import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../core/services/scroll.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ThreeHeroBgComponent } from '../../shared/components/three-hero-bg/three-hero-bg.component';
import { TextScramble } from '../../shared/utils/text-scramble';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RevealDirective, ThreeHeroBgComponent, MagneticDirective],
  template: `
    <section id="hero" class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-inner">
        <div appReveal>
          <p class="hero-tag font-mono text-sm text-matrix-terminal">
            <span class="text-matrix-neon">&gt;</span> <span #roleText>{{ role() }}</span><span class="cursor-blink">_</span>
          </p>
          <h1 class="hero-name">Emanuel <span class="neon-text">J.M</span></h1>
          <h2 class="hero-headline">
            <span class="neon-text">Fullstack</span>,
            <span class="neon-text">DevOps</span> e
            <span class="neon-text">Ingeniería de IA</span>
          </h2>
          <p class="hero-desc">
            7 años de experiencia diseñando sistemas escalables de punta a punta: APIs de alto
            rendimiento, frontends modernos, infraestructura cloud-native en AWS y agentes de IA
            propios integrados en producción. Del código al despliegue, sin fricción.
          </p>
          <div class="hero-cta">
            <button type="button" appMagnetic class="interactive btn-primary" (click)="go('projects')">
              ◎ Ver Proyectos →
            </button>
            <a href="cv-emanuel-jimenez.pdf" target="_blank" rel="noopener" appMagnetic class="interactive btn-secondary" download>
              ⬇ Descargar CV
            </a>
            <button type="button" appMagnetic class="interactive btn-secondary" (click)="go('contact')">
              ✉ Contactar
            </button>
          </div>
        </div>

        <div class="hero-visual" appReveal [delay]="150">
          <app-three-hero-bg class="hero-visual__bg" />
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
      padding: calc(6rem + var(--radio-bar-h)) 1.5rem 4rem;
      overflow: hidden;
    }
    .hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgb(0 229 255 / 3%) 1px, transparent 1px),
        linear-gradient(90deg, rgb(0 229 255 / 3%) 1px, transparent 1px);
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
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      min-height: 14rem;
      padding: 1rem;
      overflow: visible;
    }
    .hero-visual__bg {
      position: absolute;
      inset: -35% -15%;
      z-index: 0;
      pointer-events: auto;
      opacity: 0.85;
      mask-image: radial-gradient(closest-side, black 55%, transparent 100%);
    }
    .cursor-blink { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    `,
  ],
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('roleText') private readonly roleTextRef?: ElementRef<HTMLElement>;
  readonly role = signal('Fullstack Developer');
  private readonly scroll = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly roles = ['Fullstack Developer', 'DevOps & DevSecOps Engineer', 'AI Agents Engineer'];
  private roleIndex = 0;
  private scrambler?: TextScramble;
  private roleInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.roleInterval = setInterval(() => {
      this.roleIndex = (this.roleIndex + 1) % this.roles.length;
      const next = this.roles[this.roleIndex];
      if (this.scrambler) this.scrambler.setText(next);
      else this.role.set(next);
    }, 3200);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.roleTextRef) return;
    this.scrambler = new TextScramble(this.roleTextRef.nativeElement);
  }

  ngOnDestroy(): void {
    clearInterval(this.roleInterval);
    this.scrambler?.destroy();
  }

  go(id: string): void {
    this.scroll.to(id);
  }
}
