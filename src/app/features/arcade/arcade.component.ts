import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as THREE from 'three';
import { BitGameService } from '../../core/services/bit-game.service';
import { bitSound } from '../../shared/utils/bit-sound';
import { RevealDirective } from '../../shared/directives/reveal.directive';

type ThreeModule = typeof THREE;

@Component({
  selector: 'app-arcade',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section id="arcade" class="section">
      <div class="container" appReveal>
        <h2 class="section-title">Video <span class="neon-text">Game</span></h2>
        <p class="section-subtitle">&gt; Una máquina arcade en 3D — reta a Bit cuando quieras</p>
      </div>
      <div class="container mt-10">
        <div class="arcade-stage" appReveal [delay]="100">
          <canvas
            #c
            class="arcade-canvas"
            role="button"
            tabindex="0"
            aria-label="Jugar contra Bit en la máquina arcade"
            (pointermove)="onPointerMove($event)"
            (pointerdown)="onPointerDown($event)"
            (pointerup)="onPointerUp($event)"
            (pointerleave)="onPointerLeave()"
            (keydown.enter)="openGames()"
            (keydown.space)="openGames()"
          ></canvas>
        </div>
        <p class="arcade-hint font-mono">&gt; Arrastra para girar la máquina · clic en la pantalla para jugar</p>
      </div>
    </section>
  `,
  styles: [
    `
    .arcade-stage {
      position: relative;
      width: 100%;
      max-width: 34rem;
      aspect-ratio: 4 / 3;
      margin: 0 auto;
      border-radius: 1rem;
      border: 1px solid rgb(0 229 255 / 18%);
      background: radial-gradient(ellipse at 50% 70%, rgb(0 40 48 / 35%), rgb(2 4 6 / 92%));
      overflow: hidden;
    }
    .arcade-canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }
    .arcade-canvas:active { cursor: grabbing; }
    .arcade-canvas--hover { cursor: pointer; }
    .arcade-hint {
      margin-top: 0.85rem;
      text-align: center;
      font-size: 0.75rem;
      color: rgb(237 237 237 / 45%);
    }
    `,
  ],
})
export class ArcadeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly bitGame = inject(BitGameService);

  private T?: ThreeModule;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private group?: THREE.Group;
  private raycaster?: THREE.Raycaster;
  private ndcMouse?: THREE.Vector2;
  private screenMesh?: THREE.Mesh;
  private screenTexture?: THREE.CanvasTexture;
  private screenCanvas?: HTMLCanvasElement;
  private screenCtx?: CanvasRenderingContext2D;
  private screenOn = true;

  private raf = 0;
  private running = false;
  private reducedMotion = false;
  private clock?: THREE.Clock;
  private destroyed = false;

  private dragging = false;
  private dragMoved = false;
  private lastPointer = { x: 0, y: 0 };
  private angularVelocity = 0.0035;
  private hovering = false;

  private resizeObs?: ResizeObserver;
  private visibilityObs?: IntersectionObserver;
  private onVisibilityChange?: () => void;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const T = await import('three');
    if (this.destroyed) return;
    this.T = T;

    const canvas = this.canvasRef.nativeElement;
    const host = canvas.parentElement as HTMLElement;
    this.clock = new T.Clock();
    this.raycaster = new T.Raycaster();
    this.ndcMouse = new T.Vector2(10, 10);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 2.15, 7.2);
    camera.lookAt(0, 1.95, 0);

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const floor = new T.Mesh(
      new T.PlaneGeometry(7, 7, 14, 14),
      new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const group = new T.Group();
    this.buildCabinet(T, group);
    scene.add(group);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.group = group;

    const resize = (): void => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    this.resizeObs = new ResizeObserver(resize);
    this.resizeObs.observe(host);

    if (this.reducedMotion) {
      group.rotation.y = 0.35;
      renderer.render(scene, camera);
      return;
    }

    this.visibilityObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.start();
        else this.stop();
      },
      { threshold: 0.01 },
    );
    this.visibilityObs.observe(host);

    this.onVisibilityChange = (): void => {
      if (document.hidden) this.stop();
      else this.start();
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.start();
  }

  private buildCabinet(T: ThreeModule, group: THREE.Group): void {
    const edges = (geo: THREE.BufferGeometry, color = 0x00e5ff, opacity = 1): THREE.LineSegments => {
      const edgeGeo = new T.EdgesGeometry(geo);
      geo.dispose();
      return new T.LineSegments(edgeGeo, new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    };

    const baseW = 2.6;
    const baseH = 0.5;
    const baseD = 1.9;
    const bodyW = 2.3;
    const bodyH = 2.7;
    const bodyD = 1.6;

    const base = edges(new T.BoxGeometry(baseW, baseH, baseD));
    base.position.set(0, baseH / 2, 0);
    group.add(base);

    const body = edges(new T.BoxGeometry(bodyW, bodyH, bodyD));
    body.position.set(0, baseH + bodyH / 2, 0);
    group.add(body);

    const marquee = edges(new T.BoxGeometry(2.55, 0.85, 1.25));
    marquee.position.set(0, baseH + bodyH + 0.35, -0.15);
    marquee.rotation.x = -0.22;
    group.add(marquee);

    // Screen bezel + glowing attract-mode screen (raycast target for "play").
    const screenY = baseH + bodyH * 0.68;
    const bezel = edges(new T.BoxGeometry(1.72, 1.28, 0.1));
    bezel.position.set(0, screenY, bodyD / 2);
    group.add(bezel);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 192;
    const ctx = screenCanvas.getContext('2d');
    if (ctx) {
      this.screenCanvas = screenCanvas;
      this.screenCtx = ctx;
    }
    const texture = new T.CanvasTexture(screenCanvas);
    this.screenTexture = texture;
    this.drawScreen(true);

    const screenMesh = new T.Mesh(
      new T.PlaneGeometry(1.46, 1.02),
      new T.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    screenMesh.position.set(0, screenY, bodyD / 2 + 0.03);
    group.add(screenMesh);
    this.screenMesh = screenMesh;

    // Control panel with joystick and buttons.
    const panelGroup = new T.Group();
    panelGroup.position.set(0, baseH + bodyH * 0.34, bodyD / 2 + 0.32);
    panelGroup.rotation.x = -0.32;
    group.add(panelGroup);

    const panelBox = edges(new T.BoxGeometry(2.0, 0.2, 0.85));
    panelGroup.add(panelBox);

    const joyBase = edges(new T.CylinderGeometry(0.13, 0.15, 0.08, 10));
    joyBase.position.set(-0.55, 0.15, 0);
    panelGroup.add(joyBase);
    const joyStick = edges(new T.CylinderGeometry(0.035, 0.035, 0.5, 8));
    joyStick.position.set(-0.55, 0.38, 0);
    panelGroup.add(joyStick);
    const joyBall = edges(new T.IcosahedronGeometry(0.12, 0));
    joyBall.position.set(-0.55, 0.64, 0);
    panelGroup.add(joyBall);

    const btn1 = edges(new T.CylinderGeometry(0.11, 0.11, 0.05, 14));
    btn1.position.set(0.32, 0.14, 0);
    panelGroup.add(btn1);
    const btn2 = edges(new T.CylinderGeometry(0.11, 0.11, 0.05, 14));
    btn2.position.set(0.64, 0.14, 0);
    panelGroup.add(btn2);

    // Coin door.
    const coinDoor = edges(new T.BoxGeometry(0.55, 0.42, 0.06), 0x00e5ff, 0.6);
    coinDoor.position.set(0, baseH + 0.32, bodyD / 2 + 0.02);
    group.add(coinDoor);
  }

  private drawScreen(showText: boolean): void {
    const ctx = this.screenCtx;
    const canvas = this.screenCanvas;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#020608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    if (showText) {
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00e5ff';
      ctx.font = '700 26px "JetBrains Mono", monospace';
      ctx.fillText('▶ PLAY', canvas.width / 2, canvas.height / 2 - 6);
      ctx.shadowBlur = 6;
      ctx.font = '400 12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.75)';
      ctx.fillText('CONTRA BIT', canvas.width / 2, canvas.height / 2 + 20);
    }
    if (this.screenTexture) this.screenTexture.needsUpdate = true;
  }

  private updateNdc(clientX: number, clientY: number): void {
    if (!this.ndcMouse) return;
    const canvas = this.canvasRef.nativeElement;
    const r = canvas.getBoundingClientRect();
    this.ndcMouse.x = ((clientX - r.left) / r.width) * 2 - 1;
    this.ndcMouse.y = -((clientY - r.top) / r.height) * 2 + 1;
  }

  private hitsScreen(): boolean {
    if (!this.raycaster || !this.camera || !this.ndcMouse || !this.screenMesh) return false;
    this.raycaster.setFromCamera(this.ndcMouse, this.camera);
    return this.raycaster.intersectObject(this.screenMesh).length > 0;
  }

  onPointerMove(e: PointerEvent): void {
    this.updateNdc(e.clientX, e.clientY);
    const canvas = this.canvasRef.nativeElement;
    if (this.dragging) {
      const dx = e.clientX - this.lastPointer.x;
      if (Math.abs(dx) > 2) this.dragMoved = true;
      this.group?.rotateY(dx * 0.0055);
      this.lastPointer = { x: e.clientX, y: e.clientY };
      return;
    }
    this.hovering = this.hitsScreen();
    canvas.classList.toggle('arcade-canvas--hover', this.hovering);
  }

  onPointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.dragMoved = false;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvasRef.nativeElement.setPointerCapture(e.pointerId);
  }

  onPointerUp(e: PointerEvent): void {
    this.dragging = false;
    this.canvasRef.nativeElement.releasePointerCapture(e.pointerId);
    if (!this.dragMoved && this.hitsScreen()) this.openGames();
  }

  onPointerLeave(): void {
    this.ndcMouse?.set(10, 10);
    this.hovering = false;
    this.canvasRef?.nativeElement.classList.remove('arcade-canvas--hover');
  }

  openGames(): void {
    bitSound.playYesChirp();
    this.bitGame.open();
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.running = true;
    const animate = (): void => {
      if (!this.running || !this.scene || !this.camera || !this.renderer || !this.group || !this.clock) return;
      const t = this.clock.getElapsedTime();
      if (!this.dragging) this.group.rotateY(this.angularVelocity);

      const blink = Math.sin(t * 2.6) > 0;
      if (blink !== this.screenOn) {
        this.screenOn = blink;
        this.drawScreen(blink);
      }

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
    this.screenTexture?.dispose();
    this.scene?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.renderer?.dispose();
  }
}
