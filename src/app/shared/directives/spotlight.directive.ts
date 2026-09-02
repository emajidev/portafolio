import { Directive, ElementRef, HostListener, OnDestroy, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Mouse-follow radial glow behind the host's content — a subtle "flashlight" hover effect
 * for cards. Self-contained: injects its own overlay element, no per-component CSS needed.
 */
@Directive({ selector: '[appSpotlight]', standalone: true })
export class SpotlightDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  readonly color = input('0, 229, 255');
  readonly radius = input(220);

  private glow?: HTMLElement;

  private get enabled(): boolean {
    return isPlatformBrowser(this.platformId) && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /** Created lazily on first hover — by then all of the host's own template content is already rendered. */
  private ensureGlow(): HTMLElement {
    if (this.glow) return this.glow;
    const host = this.el.nativeElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const glow = document.createElement('span');
    glow.setAttribute('aria-hidden', 'true');
    glow.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s ease;';
    host.prepend(glow);
    this.glow = glow;
    return glow;
  }

  @HostListener('mousemove', ['$event'])
  move(e: MouseEvent): void {
    if (!this.enabled) return;
    const glow = this.ensureGlow();
    const r = this.el.nativeElement.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    glow.style.background = `radial-gradient(${this.radius()}px circle at ${x}px ${y}px, rgba(${this.color()}, 0.16), transparent 70%)`;
    glow.style.opacity = '1';
  }

  @HostListener('mouseleave')
  leave(): void {
    if (this.glow) this.glow.style.opacity = '0';
  }

  ngOnDestroy(): void {
    this.glow?.remove();
  }
}
