import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as THREE from 'three';

@Component({
  selector: 'app-ai-core-orb',
  standalone: true,
  template: `<canvas #c class="orb-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .orb-canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }
    `,
  ],
})
export class AiCoreOrbComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private outer?: THREE.LineSegments;
  private core?: THREE.Mesh;
  private raf = 0;
  private running = false;
  private reducedMotion = false;
  private speed = 1;
  private targetSpeed = 1;
  private destroyed = false;

  private resizeObs?: ResizeObserver;
  private visibilityObs?: IntersectionObserver;
  private onEnter?: () => void;
  private onLeave?: () => void;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const T = await import('three');
    if (this.destroyed) return;

    const canvas = this.canvasRef.nativeElement;
    const host = this.host.nativeElement;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.z = 3.4;

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const outerGeo = new T.IcosahedronGeometry(1.15, 1);
    const outer = new T.LineSegments(
      new T.EdgesGeometry(outerGeo),
      new T.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.65 })
    );

    const coreGeo = new T.IcosahedronGeometry(0.5, 2);
    const coreMat = new T.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 });
    const core = new T.Mesh(coreGeo, coreMat);

    scene.add(outer, core);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.outer = outer;
    this.core = core;

    const resize = (): void => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    this.resizeObs = new ResizeObserver(resize);
    this.resizeObs.observe(host);

    this.onEnter = (): void => {
      this.targetSpeed = 5;
      coreMat.opacity = 1;
    };
    this.onLeave = (): void => {
      this.targetSpeed = 1;
      coreMat.opacity = 0.85;
    };
    canvas.addEventListener('pointerenter', this.onEnter);
    canvas.addEventListener('pointerleave', this.onLeave);

    if (this.reducedMotion) {
      outer.rotation.set(0.4, 0.6, 0);
      core.rotation.set(0.2, 0.4, 0);
      renderer.render(scene, camera);
      return;
    }

    this.visibilityObs = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? this.start() : this.stop()),
      { threshold: 0.01 }
    );
    this.visibilityObs.observe(host);
    this.start();
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.running = true;
    const animate = (): void => {
      if (!this.running || !this.scene || !this.camera || !this.renderer || !this.outer || !this.core) return;
      this.speed += (this.targetSpeed - this.speed) * 0.06;
      this.outer.rotation.y += 0.004 * this.speed;
      this.outer.rotation.x += 0.002 * this.speed;
      this.core.rotation.y -= 0.006 * this.speed;
      this.core.rotation.x += 0.004 * this.speed;
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(animate);
    };
    this.raf = requestAnimationFrame(animate);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (!isPlatformBrowser(this.platformId)) return;
    this.stop();
    this.resizeObs?.disconnect();
    this.visibilityObs?.disconnect();
    const canvas = this.canvasRef?.nativeElement;
    if (canvas && this.onEnter) canvas.removeEventListener('pointerenter', this.onEnter);
    if (canvas && this.onLeave) canvas.removeEventListener('pointerleave', this.onLeave);
    this.outer?.geometry.dispose();
    (this.outer?.material as THREE.Material | undefined)?.dispose();
    this.core?.geometry.dispose();
    (this.core?.material as THREE.Material | undefined)?.dispose();
    this.renderer?.dispose();
  }
}
