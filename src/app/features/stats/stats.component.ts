import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { STATS, Stat } from '../../core/data/portfolio.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { TiltDirective } from '../../shared/directives/tilt.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RevealDirective, TiltDirective, IconComponent],
  template: `
    <section id="stats" class="section stats-section">
      <div class="container" appReveal>
        <p class="stats-eyebrow font-mono">&gt; En números</p>
        <div class="stats-grid mt-4">
          @for (s of stats; track s.label; let i = $index) {
            <article appTilt appReveal [delay]="i * 80" class="stat-card">
              <app-icon class="stat-card__icon" [name]="s.icon" aria-hidden="true" />
              <div class="stat-card__value">
                {{ format(displayValues()[i], s) }}<span class="stat-card__suffix">{{ s.suffix }}</span>
              </div>
              <p class="stat-card__label">{{ s.label }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
    .stats-section { padding: 3.5rem 0; }
    .stats-eyebrow {
      font-size: 0.8rem;
      color: rgb(237 237 237 / 50%);
    }
    .stats-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 768px) {
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .stat-card {
      padding: 1.5rem 1.25rem;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 18%);
      background: rgb(17 17 17 / 55%);
      backdrop-filter: blur(12px);
      transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
    }
    .stat-card:hover {
      border-color: rgb(0 229 255 / 45%);
      box-shadow: 0 0 28px rgb(0 229 255 / 12%);
    }
    .stat-card__icon {
      width: 1.5rem;
      height: 1.5rem;
      color: #00e5ff;
      filter: drop-shadow(0 0 6px rgb(0 229 255 / 45%));
    }
    .stat-card__value {
      margin-top: 0.75rem;
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      color: #ededed;
      line-height: 1;
    }
    .stat-card__suffix {
      color: #00e5ff;
      text-shadow: 0 0 14px rgb(0 229 255 / 55%);
    }
    .stat-card__label {
      margin-top: 0.5rem;
      font-size: 0.78rem;
      color: rgb(237 237 237 / 55%);
      line-height: 1.4;
    }
    `,
  ],
})
export class StatsComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  readonly stats = STATS;
  readonly displayValues = signal<number[]>(this.stats.map(() => 0));

  private obs?: IntersectionObserver;
  private triggered = false;
  private tweens: gsap.core.Tween[] = [];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      this.displayValues.set(this.stats.map((s) => s.value));
      return;
    }

    this.obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.triggered) {
          this.triggered = true;
          this.animateCounts();
          this.obs?.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    this.obs.observe(this.host.nativeElement);
  }

  private animateCounts(): void {
    this.stats.forEach((s, i) => {
      const target = { v: 0 };
      const tween = gsap.to(target, {
        v: s.value,
        duration: 1.6,
        delay: i * 0.12,
        ease: 'power2.out',
        onUpdate: () => {
          this.displayValues.update((arr) => {
            const next = arr.slice();
            next[i] = target.v;
            return next;
          });
        },
      });
      this.tweens.push(tween);
    });
  }

  format(value: number, s: Stat): string {
    return s.decimals ? value.toFixed(s.decimals) : Math.round(value).toString();
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
    this.tweens.forEach((t) => t.kill());
  }
}
