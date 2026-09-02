import type * as THREE from 'three';
import { bitSound } from '../../../../shared/utils/bit-sound';
import { GameCallbacks, GameEngine, ThreeModule } from '../bit-game.types';

const WIN_SCORE = 5;
const HALF_HEIGHT = 30;
const PADDLE_HALF_H = 5;
const PADDLE_W = 1.6;
const BALL_R = 1.1;
const WALL_MARGIN = 3;

export class PongEngine implements GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private clock: THREE.Clock;

  private playerMesh!: THREE.Mesh;
  private bitMesh!: THREE.Mesh;
  private ballMesh!: THREE.Mesh;

  private halfWidth = 50;
  private playerY = 0;
  private bitY = 0;
  private ballPos = { x: 0, y: 0 };
  private ballVel = { x: 30, y: 12 };
  private ballSpeed = 32;

  private playerScore = 0;
  private bitScore = 0;
  private ended = false;
  private running = false;
  private raf = 0;

  private pointerY: number | null = null;
  private keys = { up: false, down: false };
  private bitError = 0;
  private nextBitErrorAt = 0;

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    this.pointerY = -ny * HALF_HEIGHT;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
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

    const centerLine = new T.Group();
    const dashMat = new T.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.25 });
    for (let y = -HALF_HEIGHT + 2; y < HALF_HEIGHT; y += 4) {
      const dash = new T.Mesh(new T.PlaneGeometry(0.4, 2), dashMat);
      dash.position.set(0, y, -0.1);
      centerLine.add(dash);
    }
    this.scene.add(centerLine);

    const paddleGeo = new T.BoxGeometry(PADDLE_W, PADDLE_HALF_H * 2, 1);
    this.bitMesh = new T.Mesh(paddleGeo, new T.MeshBasicMaterial({ color: 0x00e5ff }));
    this.playerMesh = new T.Mesh(paddleGeo, new T.MeshBasicMaterial({ color: 0xffd500 }));
    this.scene.add(this.bitMesh, this.playerMesh);

    this.ballMesh = new T.Mesh(new T.SphereGeometry(BALL_R, 16, 16), new T.MeshBasicMaterial({ color: 0xffffff }));
    this.scene.add(this.ballMesh);

    this.resetBall(Math.random() > 0.5 ? 1 : -1);
    this.resize(canvas.clientWidth || 400, canvas.clientHeight || 240);

    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private resetBall(dir: 1 | -1): void {
    this.ballPos = { x: 0, y: (Math.random() - 0.5) * HALF_HEIGHT };
    this.ballSpeed = 32;
    const angle = (Math.random() - 0.5) * 0.6;
    this.ballVel = { x: Math.cos(angle) * this.ballSpeed * dir, y: Math.sin(angle) * this.ballSpeed };
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
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(animate);
    };
    this.clock.start();
    this.raf = requestAnimationFrame(animate);
  }

  private step(dt: number): void {
    const paddleX = this.halfWidth - WALL_MARGIN;

    // Player paddle.
    if (this.pointerY !== null) {
      this.playerY += (this.pointerY - this.playerY) * Math.min(1, dt * 14);
    } else {
      const speed = 46 * dt;
      if (this.keys.up) this.playerY += speed;
      if (this.keys.down) this.playerY -= speed;
    }
    this.playerY = Math.max(-HALF_HEIGHT + PADDLE_HALF_H, Math.min(HALF_HEIGHT - PADDLE_HALF_H, this.playerY));

    // Bit AI paddle: tracks the ball with bounded speed and periodic aim error.
    const t = this.clock.getElapsedTime();
    if (t > this.nextBitErrorAt) {
      this.nextBitErrorAt = t + 0.5 + Math.random() * 0.5;
      this.bitError = (Math.random() - 0.5) * 9;
    }
    const target = this.ballPos.y + this.bitError;
    const bitMaxSpeed = 30 * dt;
    const diff = target - this.bitY;
    this.bitY += Math.max(-bitMaxSpeed, Math.min(bitMaxSpeed, diff));
    this.bitY = Math.max(-HALF_HEIGHT + PADDLE_HALF_H, Math.min(HALF_HEIGHT - PADDLE_HALF_H, this.bitY));

    this.bitMesh.position.set(-paddleX, this.bitY, 0);
    this.playerMesh.position.set(paddleX, this.playerY, 0);

    // Ball movement.
    this.ballPos.x += this.ballVel.x * dt;
    this.ballPos.y += this.ballVel.y * dt;

    if (this.ballPos.y > HALF_HEIGHT - BALL_R || this.ballPos.y < -HALF_HEIGHT + BALL_R) {
      this.ballVel.y *= -1;
      this.ballPos.y = Math.max(-HALF_HEIGHT + BALL_R, Math.min(HALF_HEIGHT - BALL_R, this.ballPos.y));
      bitSound.playHit();
    }

    const hitsPaddle = (px: number, py: number): boolean =>
      Math.abs(this.ballPos.x - px) < PADDLE_W / 2 + BALL_R && Math.abs(this.ballPos.y - py) < PADDLE_HALF_H + BALL_R;

    if (this.ballVel.x < 0 && hitsPaddle(-paddleX, this.bitY)) {
      this.bounceOffPaddle(-paddleX, this.bitY, 1);
    } else if (this.ballVel.x > 0 && hitsPaddle(paddleX, this.playerY)) {
      this.bounceOffPaddle(paddleX, this.playerY, -1);
    }

    if (this.ballPos.x < -this.halfWidth - BALL_R * 2) {
      this.playerScore++;
      this.afterPoint(-1);
    } else if (this.ballPos.x > this.halfWidth + BALL_R * 2) {
      this.bitScore++;
      this.afterPoint(1);
    }

    this.ballMesh.position.set(this.ballPos.x, this.ballPos.y, 0);
  }

  private bounceOffPaddle(px: number, py: number, dir: 1 | -1): void {
    this.ballSpeed = Math.min(this.ballSpeed + 2.5, 60);
    const rel = (this.ballPos.y - py) / PADDLE_HALF_H;
    const angle = rel * 0.9;
    this.ballVel.x = Math.cos(angle) * this.ballSpeed * dir;
    this.ballVel.y = Math.sin(angle) * this.ballSpeed + rel * 4;
    this.ballPos.x = px + dir * (PADDLE_W / 2 + BALL_R + 0.05);
    bitSound.playHit();
  }

  private afterPoint(dir: 1 | -1): void {
    bitSound.playScore();
    this.callbacks.onScore(this.playerScore, this.bitScore);
    if (this.playerScore >= WIN_SCORE || this.bitScore >= WIN_SCORE) {
      this.ended = true;
      const winner = this.playerScore > this.bitScore ? 'player' : 'bit';
      this.callbacks.onEnd({ winner, playerScore: this.playerScore, bitScore: this.bitScore });
      return;
    }
    this.resetBall(dir);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
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
