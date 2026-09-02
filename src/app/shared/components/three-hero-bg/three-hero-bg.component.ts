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

type ThreeModule = typeof THREE;

interface Ripple {
  mesh: THREE.Mesh;
  start: number;
}

@Component({
  selector: 'app-three-hero-bg',
  standalone: true,
  template: `<canvas #c class="three-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
    .three-canvas {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      cursor: grab;
    }
    .three-canvas:active { cursor: grabbing; }
    `,
  ],
})
export class ThreeHeroBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private T?: ThreeModule;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private group?: THREE.Group;
  private points?: THREE.Points;
  private lines?: THREE.LineSegments;
  private vertices: THREE.Vector3[] = [];
  private baseColor?: THREE.Color;
  private hotColor?: THREE.Color;
  private raycaster?: THREE.Raycaster;
  private plane?: THREE.Plane;
  private ripples: Ripple[] = [];

  private raf = 0;
  private running = false;
  private reducedMotion = false;
  private clock?: THREE.Clock;
  private destroyed = false;

  private ndcMouse?: THREE.Vector2;
  private targetTiltX = 0;
  private targetTiltZ = 0;

  private dragging = false;
  private dragMoved = false;
  private lastPointer = { x: 0, y: 0 };
  private angularVelocity = { x: 0, y: 0.0016 };

  private resizeObs?: ResizeObserver;
  private visibilityObs?: IntersectionObserver;
  private onVisibilityChange?: () => void;
  private onPointerMove?: (e: PointerEvent) => void;
  private onPointerDown?: (e: PointerEvent) => void;
  private onPointerUp?: (e: PointerEvent) => void;
  private onPointerLeave?: () => void;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const T = await import('three');
    if (this.destroyed) return;
    this.T = T;
    this.clock = new T.Clock();
    this.baseColor = new T.Color(0x00e5ff);
    this.hotColor = new T.Color(0xe0feff);
    this.raycaster = new T.Raycaster();
    this.plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
    this.ndcMouse = new T.Vector2(10, 10);

    const canvas = this.canvasRef.nativeElement;
    const host = this.host.nativeElement;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 9;

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const group = new T.Group();

    const count = 260;
    const radius = 4.4;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.82 + Math.random() * 0.18);
      const v = new T.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      vertices.push(v);
      positions.set([v.x, v.y, v.z], i * 3);
      colors.set([this.baseColor.r, this.baseColor.g, this.baseColor.b], i * 3);
    }
    this.vertices = vertices;

    const pointsGeo = new T.BufferGeometry();
    pointsGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new T.BufferAttribute(colors, 3));
    const pointsMat = new T.PointsMaterial({
      size: 0.055,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
    });
    const points = new T.Points(pointsGeo, pointsMat);

    const linePositions: number[] = [];
    const maxDist = 1.35;
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        if (vertices[i].distanceTo(vertices[j]) < maxDist) {
          linePositions.push(vertices[i].x, vertices[i].y, vertices[i].z);
          linePositions.push(vertices[j].x, vertices[j].y, vertices[j].z);
        }
      }
    }
    const lineGeo = new T.BufferGeometry();
    lineGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new T.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.16 });
    const lines = new T.LineSegments(lineGeo, lineMat);

    group.add(points, lines);
    scene.add(group);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.group = group;
    this.points = points;
    this.lines = lines;
    this.raycaster.params.Points = { threshold: 0.32 };

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

    const updateNdc = (clientX: number, clientY: number): void => {
      if (!this.ndcMouse) return;
      const r = canvas.getBoundingClientRect();
      this.ndcMouse.x = ((clientX - r.left) / r.width) * 2 - 1;
      this.ndcMouse.y = -((clientY - r.top) / r.height) * 2 + 1;
      this.targetTiltX = this.ndcMouse.y * 0.25;
      this.targetTiltZ = this.ndcMouse.x * -0.15;
    };

    this.onPointerMove = (e: PointerEvent): void => {
      updateNdc(e.clientX, e.clientY);
      if (this.dragging) {
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) this.dragMoved = true;
        this.angularVelocity.y = dx * 0.0022;
        this.angularVelocity.x = dy * 0.0022;
        group.rotation.y += this.angularVelocity.y;
        group.rotation.x += this.angularVelocity.x;
        this.lastPointer = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });

    this.onPointerDown = (e: PointerEvent): void => {
      this.dragging = true;
      this.dragMoved = false;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerdown', this.onPointerDown);

    this.onPointerUp = (e: PointerEvent): void => {
      this.dragging = false;
      if (!this.dragMoved && !this.reducedMotion) this.spawnRipple();
      canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerup', this.onPointerUp);

    this.onPointerLeave = (): void => {
      this.ndcMouse?.set(10, 10);
    };
    canvas.addEventListener('pointerleave', this.onPointerLeave);

    if (this.reducedMotion) {
      group.rotation.set(0.3, -0.4, 0);
      renderer.render(scene, camera);
      return;
    }

    this.visibilityObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.start();
        else this.stop();
      },
      { threshold: 0.01 }
    );
    this.visibilityObs.observe(host);

    this.onVisibilityChange = (): void => {
      if (document.hidden) this.stop();
      else if (this.isHostIntersecting(host)) this.start();
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.start();
  }

  private spawnRipple(): void {
    if (!this.T || !this.scene || !this.camera || !this.raycaster || !this.plane || !this.ndcMouse) return;
    this.raycaster.setFromCamera(this.ndcMouse, this.camera);
    const hit = new this.T.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plane, hit)) return;

    const geo = new this.T.RingGeometry(0.05, 0.09, 40);
    const mat = new this.T.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.8,
      side: this.T.DoubleSide,
    });
    const mesh = new this.T.Mesh(geo, mat);
    mesh.position.copy(hit);
    mesh.lookAt(this.camera.position);
    this.scene.add(mesh);
    this.ripples.push({ mesh, start: this.clock?.getElapsedTime() ?? 0 });
  }

  private updateRipples(now: number): void {
    if (!this.ripples.length) return;
    this.ripples = this.ripples.filter((r) => {
      const t = (now - r.start) / 0.9;
      if (t >= 1) {
        this.scene?.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        return false;
      }
      const scale = 1 + t * 22;
      r.mesh.scale.setScalar(scale);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
      return true;
    });
  }

  private updateParticleGlow(): void {
    if (!this.points || !this.camera || !this.raycaster || !this.baseColor || !this.hotColor || !this.ndcMouse || this.dragging) return;
    const colorAttr = this.points.geometry.getAttribute('color') as THREE.BufferAttribute;
    this.raycaster.setFromCamera(this.ndcMouse, this.camera);
    const hits = this.raycaster.intersectObject(this.points);
    const hitIndex = hits.length ? (hits[0].index ?? -1) : -1;

    for (let i = 0; i < this.vertices.length; i++) {
      let t = 0;
      if (hitIndex !== -1) {
        const d = this.vertices[i].distanceTo(this.vertices[hitIndex]);
        t = Math.max(0, 1 - d / 2.2);
      }
      const mixed = this.baseColor.clone().lerp(this.hotColor, t);
      colorAttr.setXYZ(i, mixed.r, mixed.g, mixed.b);
    }
    colorAttr.needsUpdate = true;
  }

  private isHostIntersecting(host: HTMLElement): boolean {
    const rect = host.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.running = true;
    const animate = (): void => {
      if (!this.running || !this.scene || !this.camera || !this.renderer || !this.group || !this.clock) return;
      const group = this.group;
      if (!this.dragging) {
        group.rotation.y += this.angularVelocity.y;
        group.rotation.x += (this.targetTiltX - group.rotation.x) * 0.02;
        group.rotation.z += (this.targetTiltZ - group.rotation.z) * 0.02;
        this.angularVelocity.y += (0.0016 - this.angularVelocity.y) * 0.01;
        this.angularVelocity.x *= 0.94;
      }
      this.updateParticleGlow();
      this.updateRipples(this.clock.getElapsedTime());
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
    if (this.onVisibilityChange) document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.onPointerMove) window.removeEventListener('pointermove', this.onPointerMove);
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      if (this.onPointerDown) canvas.removeEventListener('pointerdown', this.onPointerDown);
      if (this.onPointerUp) canvas.removeEventListener('pointerup', this.onPointerUp);
      if (this.onPointerLeave) canvas.removeEventListener('pointerleave', this.onPointerLeave);
    }
    for (const r of this.ripples) {
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    }
    this.points?.geometry.dispose();
    (this.points?.material as THREE.Material | undefined)?.dispose();
    this.lines?.geometry.dispose();
    (this.lines?.material as THREE.Material | undefined)?.dispose();
    this.renderer?.dispose();
  }
}
