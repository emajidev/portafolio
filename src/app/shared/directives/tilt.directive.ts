import { Directive, ElementRef, HostListener, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Directive({ selector: '[appTilt]', standalone: true })
export class TiltDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  readonly intensity = input(10);

  @HostListener('mousemove', ['$event'])
  move(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -this.intensity();
    const ry = ((e.clientX - r.left) / r.width - 0.5) * this.intensity();
    gsap.to(this.el.nativeElement, {
      rotateX: rx,
      rotateY: ry,
      scale: 1.02,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
      transformOrigin: 'center',
    });
  }

  @HostListener('mouseleave')
  leave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    gsap.to(this.el.nativeElement, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.6)',
    });
  }
}
