import type * as THREE from 'three';
import { bitSound } from '../../../../shared/utils/bit-sound';
import { GameCallbacks, GameEngine, ThreeModule } from '../bit-game.types';

const HALF_HEIGHT = 30;
const ROWS = 4;
const COLS = 7;
const SPACING_X = 7.5;
const SPACING_Y = 5.5;
const INVADER_SIZE = 2.6;
const PLAYER_Y = -HALF_HEIGHT + 5;
const PLAYER_LIVES = 3;
const FIRE_COOLDOWN = 0.28;

interface Invader {
  mesh: THREE.Mesh;
  gx: number;
  gy: number;
  alive: boolean;
}

interface Bullet {
  mesh: THREE.Mesh;
  vy: number;
  fromPlayer: boolean;
}

interface Explosion {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  velocities: Float32Array;
  ring: THREE.Mesh;
  ringMaterial: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
  baseSize: number;
  ringScale: number;
}

export class InvadersEngine implements GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock: THREE.Clock;

  private halfWidth = 50;
  private playerShip!: THREE.Group;
  private engineFlame!: THREE.Mesh;
  private bitShip!: THREE.Group;
  private bitCore!: THREE.Mesh;
  private playerX = 0;

  private invaders: Invader[] = [];
  private bullets: Bullet[] = [];
  private explosions: Explosion[] = [];
  private fleetDir = 1;
  private fleetOffsetX = 0;
  private fleetOffsetY = 0;
  private fleetSpeed = 8;

  private lives = PLAYER_LIVES;
  private destroyed = 0;
  private ended = false;
  private running = false;
  private raf = 0;
  private lastFireAt = -10;
  private nextBitFireAt = 1;

  private pointerX: number | null = null;
  private keys = { left: false, right: false, fire: false };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerX = nx * this.halfWidth;
  };
  private onPointerDown = (): void => this.tryFire();
  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.tryFire();
    }
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly T: ThreeModule,
    private readonly callbacks: GameCallbacks,
  ) {
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-50, 50, HALF_HEIGHT, -HALF_HEIGHT, 0.1, 10);
    this.camera.position.z = 5;
    this.renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.clock = new T.Clock();

    this.bitShip = new T.Group();
    const bitHull = new T.Mesh(
      new T.OctahedronGeometry(3, 0),
      new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true }),
    );
    this.bitShip.add(bitHull);
    this.bitCore = new T.Mesh(
      new T.IcosahedronGeometry(1, 0),
      new T.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.75 }),
    );
    this.bitShip.add(this.bitCore);
    const bitRing = new T.Mesh(
      new T.TorusGeometry(2.1, 0.08, 8, 24),
      new T.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 }),
    );
    bitRing.rotation.x = Math.PI / 2;
    this.bitShip.add(bitRing);
    this.bitShip.position.set(0, HALF_HEIGHT - 4, 0);
    this.scene.add(this.bitShip);

    const invaderGeo = new T.IcosahedronGeometry(INVADER_SIZE / 2, 0);
    const invaderMat = new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
    const startX = -((COLS - 1) * SPACING_X) / 2;
    const startY = HALF_HEIGHT - 12;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const mesh = new T.Mesh(invaderGeo, invaderMat);
        const gx = startX + c * SPACING_X;
        const gy = startY - r * SPACING_Y;
        mesh.position.set(gx, gy, 0);
        this.scene.add(mesh);
        this.invaders.push({ mesh, gx, gy, alive: true });
      }
    }

    this.playerShip = new T.Group();

    // Arrowhead outline (nose -> right wing -> tail notch -> left wing), pure wireframe.
    const arrowPoints = new Float32Array([
      0, 1.8, 0, // nose
      1.5, -1.2, 0, // right wing tip
      0, -0.45, 0, // tail notch
      -1.5, -1.2, 0, // left wing tip
    ]);
    const arrowGeo = new T.BufferGeometry();
    arrowGeo.setAttribute('position', new T.BufferAttribute(arrowPoints, 3));
    const arrowLine = new T.LineLoop(arrowGeo, new T.LineBasicMaterial({ color: 0xffd500 }));
    this.playerShip.add(arrowLine);

    this.engineFlame = new T.Mesh(
      new T.ConeGeometry(0.3, 0.8, 6),
      new T.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0.85, wireframe: true }),
    );
    this.engineFlame.rotation.x = Math.PI;
    this.engineFlame.position.y = -1.55;
    this.playerShip.add(this.engineFlame);

    this.playerShip.position.set(0, PLAYER_Y, 0);
    this.scene.add(this.playerShip);

    this.resize(canvas.clientWidth || 400, canvas.clientHeight || 240);

    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  resize(width: number, height: number): void {
    const aspect = width / Math.max(height, 1);
    this.halfWidth = HALF_HEIGHT * aspect;
    this.camera.left = -this.halfWidth;
    this.camera.right = this.halfWidth;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  start(): void {
    this.running = true;
    const animate = (): void => {
      if (!this.running) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      if (!this.ended) this.step(dt);
      else this.updateExplosions(dt);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(animate);
    };
    this.clock.start();
    this.raf = requestAnimationFrame(animate);
  }

  private tryFire(): void {
    const t = this.clock.getElapsedTime();
    if (t - this.lastFireAt < FIRE_COOLDOWN || this.ended) return;
    this.lastFireAt = t;
    const mesh = new this.T.Mesh(
      new this.T.PlaneGeometry(0.5, 2),
      new this.T.MeshBasicMaterial({ color: 0xffd500 }),
    );
    mesh.position.set(this.playerX, PLAYER_Y + 3, 0);
    this.scene.add(mesh);
    this.bullets.push({ mesh, vy: 55, fromPlayer: true });
    bitSound.playHit();
  }

  private fireBitBullet(): void {
    const alive = this.invaders.filter((i) => i.alive);
    if (!alive.length) return;
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    const mesh = new this.T.Mesh(
      new this.T.PlaneGeometry(0.5, 2),
      new this.T.MeshBasicMaterial({ color: 0x00e5ff }),
    );
    mesh.position.set(shooter.mesh.position.x, shooter.mesh.position.y - 2, 0);
    this.scene.add(mesh);
    this.bullets.push({ mesh, vy: -30, fromPlayer: false });
  }

  private step(dt: number): void {
    const t = this.clock.getElapsedTime();

    // Player ship.
    if (this.pointerX !== null) {
      this.playerX += (this.pointerX - this.playerX) * Math.min(1, dt * 14);
    } else {
      const speed = 40 * dt;
      if (this.keys.left) this.playerX -= speed;
      if (this.keys.right) this.playerX += speed;
    }
    this.playerX = Math.max(-this.halfWidth + 3, Math.min(this.halfWidth - 3, this.playerX));
    this.playerShip.position.x = this.playerX;
    this.engineFlame.scale.setScalar(0.8 + Math.sin(t * 22) * 0.2 + Math.random() * 0.08);

    // Fleet movement.
    const aliveCount = this.invaders.filter((i) => i.alive).length;
    const totalCount = ROWS * COLS;
    this.fleetSpeed = 8 + (totalCount - aliveCount) * 0.9;
    this.fleetOffsetX += this.fleetDir * this.fleetSpeed * dt;
    const edge = this.halfWidth - 6;
    if (Math.abs(this.fleetOffsetX) > edge) {
      this.fleetDir *= -1;
      this.fleetOffsetX = Math.sign(this.fleetOffsetX) * edge;
      this.fleetOffsetY -= 2.2;
    }
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      inv.mesh.position.x = inv.gx + this.fleetOffsetX;
      inv.mesh.position.y = inv.gy + this.fleetOffsetY;
      inv.mesh.rotation.y += dt * 1.5;
      if (inv.mesh.position.y <= PLAYER_Y + 2) {
        this.spawnExplosion(this.playerX, PLAYER_Y, 0xffd500, 30, 30, 1.4, 0.8);
        this.finish('bit');
        return;
      }
    }

    // Bit fires periodically, faster as the fleet thins out.
    if (t > this.nextBitFireAt && aliveCount > 0) {
      this.nextBitFireAt = t + Math.max(0.5, 1.8 - (totalCount - aliveCount) * 0.05) + Math.random() * 0.6;
      this.fireBitBullet();
    }
    this.bitShip.rotation.y += dt * 0.4;
    this.bitShip.position.y = HALF_HEIGHT - 4 + Math.sin(t * 1.4) * 0.6;
    this.bitCore.rotation.y -= dt * 0.9;
    this.bitCore.scale.setScalar(1 + Math.sin(t * 3) * 0.08);

    // Bullets.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.mesh.position.y += b.vy * dt;

      if (b.fromPlayer) {
        let hit = false;
        for (const inv of this.invaders) {
          if (!inv.alive) continue;
          if (
            Math.abs(b.mesh.position.x - inv.mesh.position.x) < INVADER_SIZE / 2 + 0.4 &&
            Math.abs(b.mesh.position.y - inv.mesh.position.y) < INVADER_SIZE / 2 + 0.4
          ) {
            inv.alive = false;
            inv.mesh.visible = false;
            this.destroyed++;
            hit = true;
            bitSound.playScore();
            this.spawnExplosion(inv.mesh.position.x, inv.mesh.position.y, 0x00e5ff, 16, 24, 0.9, 0.45);
            this.callbacks.onScore(this.destroyed, PLAYER_LIVES - this.lives);
            break;
          }
        }
        if (hit || b.mesh.position.y > HALF_HEIGHT + 2) {
          this.removeBullet(i);
          if (this.destroyed >= ROWS * COLS) {
            this.spawnExplosion(this.bitShip.position.x, this.bitShip.position.y, 0x00e5ff, 34, 28, 1.3, 0.75);
            this.finish('player');
            return;
          }
        }
      } else {
        if (
          Math.abs(b.mesh.position.x - this.playerX) < 2.2 &&
          Math.abs(b.mesh.position.y - PLAYER_Y) < 2.4
        ) {
          this.lives--;
          bitSound.playHit();
          this.spawnExplosion(this.playerX, PLAYER_Y, 0xff5a1f, 20, 26, 1.1, 0.55);
          this.callbacks.onScore(this.destroyed, PLAYER_LIVES - this.lives);
          this.removeBullet(i);
          if (this.lives <= 0) {
            this.spawnExplosion(this.playerX, PLAYER_Y, 0xffd500, 30, 30, 1.4, 0.8);
            this.finish('bit');
            return;
          }
        } else if (b.mesh.position.y < -HALF_HEIGHT - 2) {
          this.removeBullet(i);
        }
      }
    }

    this.updateExplosions(dt);
  }

  private updateExplosions(dt: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.age += dt;
      const et = ex.age / ex.maxAge;
      if (et >= 1) {
        this.scene.remove(ex.points);
        this.scene.remove(ex.ring);
        ex.geometry.dispose();
        ex.material.dispose();
        ex.ring.geometry.dispose();
        ex.ringMaterial.dispose();
        this.explosions.splice(i, 1);
        continue;
      }
      const pos = ex.geometry.attributes['position'] as THREE.BufferAttribute;
      for (let p = 0; p < pos.count; p++) {
        pos.setX(p, pos.getX(p) + ex.velocities[p * 3] * dt);
        pos.setY(p, pos.getY(p) + ex.velocities[p * 3 + 1] * dt);
      }
      pos.needsUpdate = true;
      ex.material.opacity = 1 - et;
      ex.material.size = ex.baseSize * (1 - et * 0.35);

      const ringT = Math.min(1, et / 0.6);
      ex.ring.scale.setScalar(0.3 + ringT * ex.ringScale);
      ex.ringMaterial.opacity = (1 - ringT) * 0.85;
    }
  }

  private spawnExplosion(
    x: number,
    y: number,
    color: number,
    count: number,
    speed: number,
    size: number,
    maxAge: number,
  ): void {
    const T = this.T;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const mag = speed * (0.4 + Math.random() * 0.8);
      velocities[i * 3] = Math.cos(angle) * mag;
      velocities[i * 3 + 1] = Math.sin(angle) * mag;
      velocities[i * 3 + 2] = 0;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    const material = new T.PointsMaterial({ color, size, sizeAttenuation: false, transparent: true, opacity: 1 });
    const points = new T.Points(geometry, material);
    this.scene.add(points);

    const ringMaterial = new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(0.6, 0.85, 24), ringMaterial);
    ring.position.set(x, y, 0.01);
    this.scene.add(ring);

    this.explosions.push({
      points,
      geometry,
      material,
      velocities,
      ring,
      ringMaterial,
      age: 0,
      maxAge,
      baseSize: size,
      ringScale: size * 3,
    });
  }

  private removeBullet(i: number): void {
    const b = this.bullets[i];
    this.scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    (b.mesh.material as THREE.Material).dispose();
    this.bullets.splice(i, 1);
  }

  private finish(winner: 'player' | 'bit'): void {
    this.ended = true;
    this.callbacks.onEnd({ winner, playerScore: this.destroyed, bitScore: PLAYER_LIVES - this.lives });
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
  }
}
