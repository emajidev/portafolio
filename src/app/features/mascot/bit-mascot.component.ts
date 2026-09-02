import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as THREE from 'three';
import { MascotChatService, Sentiment } from '../../core/services/mascot-chat.service';
import { bitSound } from '../../shared/utils/bit-sound';

type FlickerState = 'idle' | 'yes' | 'no';
type ThreeModule = typeof THREE;

const SIZE = 92;
const HEADER_SAFE = 132;
const FOOTER_SAFE = 96;
const MARGIN = 16;

function buildSpikyGeometry(T: ThreeModule): THREE.BufferGeometry {
  const geo = new T.IcosahedronGeometry(1, 1);
  const pos = geo.getAttribute('position');
  const v = new T.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const spike = 1 + Math.random() * 0.55;
    v.multiplyScalar(spike / v.length());
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

@Component({
  selector: 'app-bit-mascot',
  standalone: true,
  template: `
    <div class="bit-wrap" [style.width.px]="size" [style.height.px]="size">
      <canvas
        #c
        class="bit-canvas"
        role="button"
        tabindex="0"
        aria-label="Davi, asistente — un Bit flotante"
        (click)="onActivate()"
        (keydown.enter)="onActivate()"
        (keydown.space)="onActivate()"
      ></canvas>
      @if (latestDialog(); as d) {
        <div class="bit-bubble" [class.bit-bubble--exit]="d.exiting" role="status" aria-live="polite">
          <span class="bit-bubble__tag">DAVI://</span>
          <p>{{ d.text }}</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 45;
      will-change: transform;
    }
    .bit-wrap {
      position: relative;
    }
    .bit-canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
      pointer-events: auto;
      filter: drop-shadow(0 0 14px rgb(0 229 255 / 55%));
    }
    .bit-bubble {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 0.75rem);
      transform: translateX(-50%);
      min-width: 13rem;
      max-width: 17rem;
      padding: 0.6rem 0.85rem;
      border: 1px solid rgb(0 229 255 / 55%);
      background: rgb(3 5 10 / 92%);
      box-shadow: 0 0 18px rgb(0 229 255 / 20%);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      color: #7df9ff;
      animation: bit-bubble-in 0.3s ease forwards;
      clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
      pointer-events: none;
    }
    .bit-bubble::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgb(0 229 255 / 55%);
    }
    .bit-bubble--exit {
      animation: bit-bubble-out 0.3s ease forwards;
    }
    .bit-bubble__tag {
      display: block;
      margin-bottom: 0.15rem;
      font-size: 0.6rem;
      letter-spacing: 0.08em;
      color: #00e5ff;
      opacity: 0.7;
    }
    @keyframes bit-bubble-in {
      from { opacity: 0; transform: translate(-50%, 8px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes bit-bubble-out {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, 8px); }
    }
    `,
  ],
})
export class BitMascotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('c') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mascotChat = inject(MascotChatService);

  readonly size = SIZE;
  readonly latestDialog = computed(() => {
    const list = this.mascotChat.dialogs();
    return list.length ? list[list.length - 1] : null;
  });

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private group?: THREE.Group;
  private mesh?: THREE.Mesh;
  private material?: THREE.MeshBasicMaterial;
  private geometries?: { idle: THREE.BufferGeometry; yes: THREE.BufferGeometry; no: THREE.BufferGeometry };

  private raf = 0;
  private running = false;
  private reducedMotion = false;
  private clock?: THREE.Clock;
  private destroyed = false;
  private lastSeenDialogId = -1;

  private state: FlickerState = 'idle';
  private stateUntil = 0;
  private nextIdleFlicker = 8 + Math.random() * 6;
  private targetScale = 1;
  private currentScale = 1;

  // Free-roam movement across the viewport.
  private posX = 0;
  private posY = 0;
  private targetX = 0;
  private targetY = 0;
  private nextWander = 0;
  private onResize?: () => void;
  private onVisibilityChange?: () => void;

  constructor() {
    effect(() => {
      const d = this.latestDialog();
      if (d && d.id !== this.lastSeenDialogId) {
        this.lastSeenDialogId = d.id;
        this.speakFlicker(d.sentiment, d.text);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.pickInitialPosition();
    this.applyPosition();
    this.onResize = () => this.clampPosition();
    window.addEventListener('resize', this.onResize);

    const T = await import('three');
    if (this.destroyed) return;

    const canvas = this.canvasRef.nativeElement;
    this.clock = new T.Clock();

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, 1, 0.1, 20);
    camera.position.z = 3.6;

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const group = new T.Group();
    const geometries = {
      idle: new T.IcosahedronGeometry(1, 0),
      yes: new T.OctahedronGeometry(1.1, 0),
      no: buildSpikyGeometry(T),
    };
    const material = new T.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new T.Mesh(geometries.idle, material);
    group.add(mesh);
    scene.add(group);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.group = group;
    this.mesh = mesh;
    this.material = material;
    this.geometries = geometries;

    renderer.setSize(this.size, this.size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();

    if (this.reducedMotion) {
      group.rotation.set(0.3, 0.5, 0);
      renderer.render(scene, camera);
      return;
    }

    this.onVisibilityChange = (): void => {
      if (document.hidden) this.stop();
      else this.start();
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.start();
  }

  private pickInitialPosition(): void {
    this.posX = window.innerWidth * 0.78;
    this.posY = window.innerHeight * 0.32;
    this.pickNewTarget();
  }

  private pickNewTarget(): void {
    const maxX = Math.max(MARGIN, window.innerWidth - this.size - MARGIN);
    const maxY = Math.max(HEADER_SAFE, window.innerHeight - this.size - FOOTER_SAFE);
    this.targetX = MARGIN + Math.random() * (maxX - MARGIN);
    this.targetY = HEADER_SAFE + Math.random() * (maxY - HEADER_SAFE);
  }

  private clampPosition(): void {
    const maxX = Math.max(MARGIN, window.innerWidth - this.size - MARGIN);
    const maxY = Math.max(HEADER_SAFE, window.innerHeight - this.size - FOOTER_SAFE);
    this.posX = Math.min(this.posX, maxX);
    this.posY = Math.min(this.posY, maxY);
    this.targetX = Math.min(this.targetX, maxX);
    this.targetY = Math.min(this.targetY, maxY);
    this.applyPosition();
  }

  private applyPosition(): void {
    this.host.nativeElement.style.transform = `translate(${this.posX}px, ${this.posY}px)`;
  }

  onActivate(): void {
    this.flicker(Math.random() > 0.25 ? 'yes' : 'no');
  }

  private speakFlicker(sentiment: Sentiment, text: string): void {
    const kind: FlickerState = sentiment === 'no' ? 'no' : sentiment === 'yes' ? 'yes' : Math.random() > 0.5 ? 'yes' : 'no';
    this.applyFlickerVisual(kind);
    bitSound.speak(text, sentiment);
  }

  private flicker(kind: 'yes' | 'no'): void {
    this.applyFlickerVisual(kind);
    if (kind === 'yes') bitSound.playYesChirp();
    else bitSound.playNoBuzz();
  }

  private applyFlickerVisual(kind: 'yes' | 'no'): void {
    if (!this.geometries || !this.mesh || !this.material || !this.clock || this.reducedMotion) return;
    this.state = kind;
    this.stateUntil = this.clock.getElapsedTime() + 0.55;
    this.mesh.geometry = this.geometries[kind];
    this.material.color.set(kind === 'yes' ? 0xffd500 : 0xff3b3b);
    this.targetScale = kind === 'yes' ? 1.22 : 0.85;
  }

  private start(): void {
    if (this.running || this.reducedMotion) return;
    this.running = true;
    const animate = (): void => {
      if (!this.running || !this.scene || !this.camera || !this.renderer || !this.group || !this.mesh || !this.material || !this.geometries || !this.clock) return;
      const t = this.clock.getElapsedTime();

      this.group.position.y = Math.sin(t * 1.3) * 0.15;
      this.group.rotation.y += 0.006;
      this.group.rotation.x = Math.sin(t * 0.7) * 0.18;

      // Wander across the viewport.
      if (t > this.nextWander) {
        this.nextWander = t + 5 + Math.random() * 5;
        this.pickNewTarget();
      }
      this.posX += (this.targetX - this.posX) * 0.012;
      this.posY += (this.targetY - this.posY) * 0.012;
      this.applyPosition();

      if (this.state !== 'idle' && t > this.stateUntil) {
        this.state = 'idle';
        this.mesh.geometry = this.geometries.idle;
        this.material.color.set(0x00e5ff);
        this.targetScale = 1;
        bitSound.playIdleTick();
      } else if (this.state === 'idle' && t > this.nextIdleFlicker) {
        this.nextIdleFlicker = t + 9 + Math.random() * 7;
        this.flicker(Math.random() > 0.3 ? 'yes' : 'no');
      }

      this.currentScale += (this.targetScale - this.currentScale) * 0.18;
      this.mesh.scale.setScalar(this.currentScale);

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
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    if (this.onVisibilityChange) document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.geometries?.idle.dispose();
    this.geometries?.yes.dispose();
    this.geometries?.no.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
  }
}
