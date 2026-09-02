import type * as THREE from 'three';
import { bitSound } from '../../../../shared/utils/bit-sound';
import { GameCallbacks, GameEngine, ThreeModule } from '../bit-game.types';

const COLS = 42;
const ROWS = 24;
const TICK_START = 0.115;
const TICK_MIN = 0.065;
const WALL_HEIGHT = 1.05;
const WALL_THICK = 0.4;

interface Dir {
  dx: number;
  dy: number;
}
const UP: Dir = { dx: 0, dy: -1 };
const DOWN: Dir = { dx: 0, dy: 1 };
const LEFT: Dir = { dx: -1, dy: 0 };
const RIGHT: Dir = { dx: 1, dy: 0 };
const isOpposite = (a: Dir, b: Dir): boolean => a.dx === -b.dx && a.dy === -b.dy;
const key = (col: number, row: number): string => `${col},${row}`;
const inBounds = (col: number, row: number): boolean => col >= 0 && col < COLS && row >= 0 && row < ROWS;
const headingFromDir = (d: Dir): number => Math.atan2(d.dx, d.dy);
const lerpAngle = (a: number, b: number, t: number): number => {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
};

interface TronExplosion {
  group: THREE.Group;
  shardMeshes: THREE.Mesh[];
  velocities: THREE.Vector3[];
  angularVel: THREE.Vector3[];
  shardMaterial: THREE.MeshBasicMaterial;
  shardGeometry: THREE.BoxGeometry;
  ring: THREE.Mesh;
  ringMaterial: THREE.MeshBasicMaterial;
  pillar: THREE.Mesh;
  pillarMaterial: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
}

export class TronEngine implements GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  private wallGeoX: THREE.BoxGeometry;
  private wallGeoZ: THREE.BoxGeometry;
  private playerWallMat: THREE.MeshBasicMaterial;
  private bitWallMat: THREE.MeshBasicMaterial;
  private trailMeshes: THREE.Mesh[] = [];
  private explosions: TronExplosion[] = [];

  private occupied = new Map<string, 'player' | 'bit'>();

  private playerCol = 5;
  private playerRow = Math.floor(ROWS / 2);
  private playerDir: Dir = RIGHT;
  private queuedDir: Dir | null = null;
  private playerBike!: THREE.Group;
  private playerPrevWorld: THREE.Vector3;
  private playerNextWorld: THREE.Vector3;
  private playerPrevHeading = headingFromDir(RIGHT);
  private playerNextHeading = this.playerPrevHeading;
  private playerLine!: THREE.Line;
  private playerLinePoints: THREE.Vector3[] = [];

  private bitCol = COLS - 6;
  private bitRow = Math.floor(ROWS / 2);
  private bitDir: Dir = LEFT;
  private bitBike!: THREE.Group;
  private bitCoreMesh?: THREE.Mesh;
  private bitPrevWorld: THREE.Vector3;
  private bitNextWorld: THREE.Vector3;
  private bitPrevHeading = headingFromDir(LEFT);
  private bitNextHeading = this.bitPrevHeading;
  private bitLine!: THREE.Line;
  private bitLinePoints: THREE.Vector3[] = [];

  private tickInterval = TICK_START;
  private acc = 0;
  private ticks = 0;
  private ended = false;
  private running = false;
  private raf = 0;

  private onKeyDown = (e: KeyboardEvent): void => {
    let dir: Dir | null = null;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = UP;
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = DOWN;
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = LEFT;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = RIGHT;
    if (dir) {
      e.preventDefault();
      if (!isOpposite(dir, this.playerDir)) this.queuedDir = dir;
    }
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly T: ThreeModule,
    private readonly callbacks: GameCallbacks,
  ) {
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(52, 1, 0.1, 200);
    this.camera.position.set(0, ROWS * 0.85, ROWS * 0.92);
    this.camera.lookAt(0, 0, -ROWS * 0.08);
    this.renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.clock = new T.Clock();

    const floor = new T.Mesh(
      new T.PlaneGeometry(COLS, ROWS, COLS, ROWS),
      new T.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.12 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const border = new T.LineSegments(
      new T.EdgesGeometry(new T.PlaneGeometry(COLS, ROWS)),
      new T.LineBasicMaterial({ color: 0x00e5ff }),
    );
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.02;
    this.scene.add(border);

    // Continuous, gap-free wall segments (one box spans a full tick's travel).
    this.wallGeoX = new T.BoxGeometry(1.0, WALL_HEIGHT, WALL_THICK);
    this.wallGeoZ = new T.BoxGeometry(WALL_THICK, WALL_HEIGHT, 1.0);
    this.playerWallMat = new T.MeshBasicMaterial({ color: 0xffd500 });
    this.bitWallMat = new T.MeshBasicMaterial({ color: 0x00e5ff });

    this.playerBike = this.buildBike(0xffd500, false);
    this.bitBike = this.buildBike(0x00e5ff, true);
    this.scene.add(this.playerBike, this.bitBike);

    this.playerPrevWorld = this.gridToWorld(this.playerCol, this.playerRow);
    this.playerNextWorld = this.playerPrevWorld.clone();
    this.bitPrevWorld = this.gridToWorld(this.bitCol, this.bitRow);
    this.bitNextWorld = this.bitPrevWorld.clone();
    this.playerBike.position.copy(this.playerPrevWorld);
    this.bitBike.position.copy(this.bitPrevWorld);
    this.playerBike.rotation.y = this.playerPrevHeading;
    this.bitBike.rotation.y = this.bitPrevHeading;

    // Glowing "energy edge" line traced along the top of each trail — smooth and continuous.
    this.playerLinePoints = [this.gridToWorld(this.playerCol, this.playerRow, WALL_HEIGHT)];
    this.bitLinePoints = [this.gridToWorld(this.bitCol, this.bitRow, WALL_HEIGHT)];
    this.playerLine = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xfff6c9 }));
    this.bitLine = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xc9fbff }));
    this.rebuildLine(this.playerLinePoints, this.playerLine);
    this.rebuildLine(this.bitLinePoints, this.bitLine);
    this.scene.add(this.playerLine, this.bitLine);

    this.occupied.set(key(this.playerCol, this.playerRow), 'player');
    this.occupied.set(key(this.bitCol, this.bitRow), 'bit');

    this.resize(canvas.clientWidth || 400, canvas.clientHeight || 240);
    window.addEventListener('keydown', this.onKeyDown);
  }

  /** Builds a low-poly wireframe light-cycle: wheels, wedge chassis, tail fin and a rider marker. */
  private buildBike(color: number, isBit: boolean): THREE.Group {
    const T = this.T;
    const edges = (geo: THREE.BufferGeometry): THREE.LineSegments => {
      const edgeGeo = new T.EdgesGeometry(geo);
      geo.dispose();
      return new T.LineSegments(edgeGeo, new T.LineBasicMaterial({ color }));
    };

    const group = new T.Group();

    const frontWheel = edges(new T.TorusGeometry(0.26, 0.05, 6, 14));
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(0, 0.26, 0.58);
    group.add(frontWheel);

    const backWheel = edges(new T.TorusGeometry(0.26, 0.05, 6, 14));
    backWheel.rotation.y = Math.PI / 2;
    backWheel.position.set(0, 0.26, -0.58);
    group.add(backWheel);

    const chassis = edges(new T.ConeGeometry(0.24, 1.35, 3));
    chassis.rotation.x = Math.PI / 2;
    chassis.position.y = 0.32;
    group.add(chassis);

    const fin = edges(new T.BoxGeometry(0.06, 0.4, 0.5));
    fin.position.set(0, 0.55, -0.42);
    group.add(fin);

    if (isBit) {
      // Bit's signature wireframe core rides the bike — same shape as its mascot form.
      const core = new T.Mesh(new T.IcosahedronGeometry(0.22, 0), new T.MeshBasicMaterial({ color, wireframe: true }));
      core.position.set(0, 0.75, 0.05);
      group.add(core);
      this.bitCoreMesh = core;
    } else {
      const helmet = edges(new T.BoxGeometry(0.24, 0.22, 0.26));
      helmet.position.set(0, 0.72, 0.05);
      group.add(helmet);
    }

    const headlight = new T.Mesh(new T.SphereGeometry(0.06, 8, 8), new T.MeshBasicMaterial({ color: 0xffffff }));
    headlight.position.set(0, 0.32, 0.72);
    group.add(headlight);

    return group;
  }

  private rebuildLine(points: THREE.Vector3[], line: THREE.Line): void {
    const T = this.T;
    const positions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    line.geometry.dispose();
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    line.geometry = geo;
  }

  private gridToWorld(col: number, row: number, y = 0): THREE.Vector3 {
    const T = this.T;
    return new T.Vector3(col - COLS / 2 + 0.5, y, row - ROWS / 2 + 0.5);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  start(): void {
    this.running = true;
    const animate = (): void => {
      if (!this.running) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      if (!this.ended) this.step(dt);
      this.updateExplosions(dt);

      const frac = this.ended ? 1 : Math.min(1, this.acc / this.tickInterval);
      this.playerBike.position.lerpVectors(this.playerPrevWorld, this.playerNextWorld, frac);
      this.bitBike.position.lerpVectors(this.bitPrevWorld, this.bitNextWorld, frac);
      this.playerBike.rotation.y = lerpAngle(this.playerPrevHeading, this.playerNextHeading, frac);
      this.bitBike.rotation.y = lerpAngle(this.bitPrevHeading, this.bitNextHeading, frac);

      if (this.bitCoreMesh) {
        const t = this.clock.getElapsedTime();
        this.bitCoreMesh.rotation.y += dt * 1.4;
        this.bitCoreMesh.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      }

      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(animate);
    };
    this.clock.start();
    this.raf = requestAnimationFrame(animate);
  }

  private step(dt: number): void {
    this.acc += dt;
    while (this.acc >= this.tickInterval && !this.ended) {
      this.acc -= this.tickInterval;
      this.tick();
    }
  }

  private isBlocked(col: number, row: number, extra?: string): boolean {
    if (!inBounds(col, row)) return true;
    if (this.occupied.has(key(col, row))) return true;
    return extra === key(col, row);
  }

  private decideBitDir(): Dir {
    const candidates: Dir[] = [
      this.bitDir,
      { dx: this.bitDir.dy, dy: -this.bitDir.dx },
      { dx: -this.bitDir.dy, dy: this.bitDir.dx },
    ];
    let best = this.bitDir;
    let bestScore = -1;
    for (const d of candidates) {
      let col = this.bitCol + d.dx;
      let row = this.bitRow + d.dy;
      if (this.isBlocked(col, row, key(this.playerCol, this.playerRow))) continue;
      let openCount = 0;
      for (let step = 0; step < 6; step++) {
        if (this.isBlocked(col, row)) break;
        openCount++;
        col += d.dx;
        row += d.dy;
      }
      const score = openCount + (d === this.bitDir ? 0.5 : 0) + Math.random() * 0.4;
      if (score > bestScore) {
        bestScore = score;
        best = d;
      }
    }
    return best;
  }

  private tick(): void {
    this.ticks++;
    this.tickInterval = Math.max(TICK_MIN, TICK_START - this.ticks * 0.0007);

    if (this.queuedDir) {
      this.playerDir = this.queuedDir;
      this.queuedDir = null;
    }
    this.bitDir = this.decideBitDir();

    const nextPlayer = { col: this.playerCol + this.playerDir.dx, row: this.playerRow + this.playerDir.dy };
    const nextBit = { col: this.bitCol + this.bitDir.dx, row: this.bitRow + this.bitDir.dy };

    const playerHeadOn = nextPlayer.col === this.bitCol && nextPlayer.row === this.bitRow;
    const bitHeadOn = nextBit.col === this.playerCol && nextBit.row === this.playerRow;
    const sameCell = nextPlayer.col === nextBit.col && nextPlayer.row === nextBit.row;

    const playerCrash = this.isBlocked(nextPlayer.col, nextPlayer.row) || playerHeadOn || sameCell;
    const bitCrash = this.isBlocked(nextBit.col, nextBit.row) || bitHeadOn || sameCell;

    if (playerCrash || bitCrash) {
      this.ended = true;
      const winner = playerCrash && bitCrash ? 'draw' : playerCrash ? 'bit' : 'player';
      bitSound.playCrash();
      if (playerCrash) {
        this.playerBike.visible = false;
        this.spawnTronExplosion(this.gridToWorld(nextPlayer.col, nextPlayer.row, 0.5), 0xffd500);
      }
      if (bitCrash) {
        this.bitBike.visible = false;
        this.spawnTronExplosion(this.gridToWorld(nextBit.col, nextBit.row, 0.5), 0x00e5ff);
      }
      this.callbacks.onEnd({ winner, playerScore: this.occupiedCount('player'), bitScore: this.occupiedCount('bit') });
      return;
    }

    this.placeWallSegment(this.playerCol, this.playerRow, this.playerDir, 'player');
    this.placeWallSegment(this.bitCol, this.bitRow, this.bitDir, 'bit');
    this.occupied.set(key(this.playerCol, this.playerRow), 'player');
    this.occupied.set(key(this.bitCol, this.bitRow), 'bit');

    this.playerPrevWorld = this.playerNextWorld.clone();
    this.bitPrevWorld = this.bitNextWorld.clone();
    this.playerPrevHeading = this.playerNextHeading;
    this.bitPrevHeading = this.bitNextHeading;
    this.playerNextHeading = headingFromDir(this.playerDir);
    this.bitNextHeading = headingFromDir(this.bitDir);

    this.playerCol = nextPlayer.col;
    this.playerRow = nextPlayer.row;
    this.bitCol = nextBit.col;
    this.bitRow = nextBit.row;
    this.playerNextWorld = this.gridToWorld(this.playerCol, this.playerRow);
    this.bitNextWorld = this.gridToWorld(this.bitCol, this.bitRow);

    this.playerLinePoints.push(this.gridToWorld(this.playerCol, this.playerRow, WALL_HEIGHT));
    this.bitLinePoints.push(this.gridToWorld(this.bitCol, this.bitRow, WALL_HEIGHT));
    this.rebuildLine(this.playerLinePoints, this.playerLine);
    this.rebuildLine(this.bitLinePoints, this.bitLine);

    if (this.ticks % 3 === 0) {
      this.callbacks.onScore(this.occupiedCount('player'), this.occupiedCount('bit'));
    }
  }

  private occupiedCount(owner: 'player' | 'bit'): number {
    let n = 0;
    for (const v of this.occupied.values()) if (v === owner) n++;
    return n;
  }

  /** Places one continuous box spanning the full cell-to-cell travel, so walls never show seams. */
  private placeWallSegment(col: number, row: number, dir: Dir, owner: 'player' | 'bit'): void {
    const from = this.gridToWorld(col, row, WALL_HEIGHT / 2);
    const to = this.gridToWorld(col + dir.dx, row + dir.dy, WALL_HEIGHT / 2);
    const mid = from.clone().lerp(to, 0.5);
    const geo = dir.dx !== 0 ? this.wallGeoX : this.wallGeoZ;
    const mesh = new this.T.Mesh(geo, owner === 'player' ? this.playerWallMat : this.bitWallMat);
    mesh.position.copy(mid);
    this.scene.add(mesh);
    this.trailMeshes.push(mesh);
  }

  /** Tron-style "derez" burst: shockwave ring, a flash pillar and shattering light shards. */
  private spawnTronExplosion(pos: THREE.Vector3, color: number): void {
    const T = this.T;
    const group = new T.Group();
    group.position.copy(pos);
    this.scene.add(group);

    const shardGeometry = new T.BoxGeometry(0.14, 0.5, 0.04);
    const shardMaterial = new T.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const shardMeshes: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];
    const angularVel: THREE.Vector3[] = [];
    const shardCount = 18;
    for (let i = 0; i < shardCount; i++) {
      const mesh = new T.Mesh(shardGeometry, shardMaterial);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(mesh);
      shardMeshes.push(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 5;
      velocities.push(new T.Vector3(Math.cos(angle) * speed, 2 + Math.random() * 4, Math.sin(angle) * speed));
      angularVel.push(new T.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12));
    }

    const ringMaterial = new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(0.35, 0.55, 32), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    const pillarMaterial = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const pillarGeo = new T.CylinderGeometry(0.07, 0.07, 1, 8);
    pillarGeo.translate(0, 0.5, 0); // pivot at base, so it only grows upward from the crash point
    const pillar = new T.Mesh(pillarGeo, pillarMaterial);
    pillar.scale.y = 0.001;
    group.add(pillar);

    this.explosions.push({
      group,
      shardMeshes,
      velocities,
      angularVel,
      shardMaterial,
      shardGeometry,
      ring,
      ringMaterial,
      pillar,
      pillarMaterial,
      age: 0,
      maxAge: 0.9,
    });
  }

  private updateExplosions(dt: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.age += dt;
      const t = ex.age / ex.maxAge;
      if (t >= 1) {
        this.scene.remove(ex.group);
        ex.shardGeometry.dispose();
        ex.shardMaterial.dispose();
        ex.ring.geometry.dispose();
        ex.ringMaterial.dispose();
        ex.pillar.geometry.dispose();
        ex.pillarMaterial.dispose();
        this.explosions.splice(i, 1);
        continue;
      }

      for (let s = 0; s < ex.shardMeshes.length; s++) {
        const mesh = ex.shardMeshes[s];
        const vel = ex.velocities[s];
        vel.y -= dt * 9; // gravity
        mesh.position.addScaledVector(vel, dt);
        const av = ex.angularVel[s];
        mesh.rotation.x += av.x * dt;
        mesh.rotation.y += av.y * dt;
        mesh.rotation.z += av.z * dt;
      }
      ex.shardMaterial.opacity = Math.max(0, 1 - t * 1.2);

      const ringT = Math.min(1, ex.age / 0.55);
      ex.ring.scale.setScalar(1 + ringT * 11);
      ex.ringMaterial.opacity = (1 - ringT) * 0.9;

      const flashIn = Math.min(1, ex.age / 0.1);
      ex.pillar.scale.y = flashIn * 3.4;
      ex.pillarMaterial.opacity = Math.max(0, 1 - Math.max(0, ex.age - 0.08) / 0.35);
    }
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    this.wallGeoX.dispose();
    this.wallGeoZ.dispose();
    this.playerWallMat.dispose();
    this.bitWallMat.dispose();
    this.trailMeshes = [];
    this.explosions = [];
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
