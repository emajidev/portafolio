import { Directive, ElementRef, HostListener, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

@Directive({ selector: '[appMagnetic]', standalone: true })
export class MagneticDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  readonly strength = input(0.35);

  private get enabled(): boolean {
    return isPlatformBrowser(this.platformId) && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  @HostListener('mousemove', ['$event'])
  move(e: MouseEvent): void {
    if (!this.enabled) return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    gsap.to(this.el.nativeElement, {
      x: dx * this.strength(),
      y: dy * this.strength(),
      duration: 0.35,
      ease: 'power3.out',
    });
  }

  @HostListener('mouseleave')
  leave(): void {
    if (!this.enabled) return;
    gsap.to(this.el.nativeElement, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  }
}
