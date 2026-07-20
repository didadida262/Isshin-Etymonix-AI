import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: 'cyan' | 'violet' | 'emerald';
}

const COLORS = {
  cyan: { r: 34, g: 211, b: 238 },
  violet: { r: 139, g: 92, b: 246 },
  emerald: { r: 52, g: 211, b: 153 },
} as const;

const LINK_DIST = 150;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

function nodeCount(w: number, h: number): number {
  return Math.min(72, Math.max(28, Math.floor((w * h) / 22_000)));
}

function createNodes(w: number, h: number): Node[] {
  const hues: Node['hue'][] = ['cyan', 'violet', 'emerald'];
  return Array.from({ length: nodeCount(w, h) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    r: Math.random() * 1.4 + 0.5,
    hue: hues[Math.floor(Math.random() * hues.length)]!,
  }));
}

function wrap(n: Node, w: number, h: number): void {
  if (n.x < -20) n.x = w + 20;
  if (n.x > w + 20) n.x = -20;
  if (n.y < -20) n.y = h + 20;
  if (n.y > h + 20) n.y = -20;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  w: number,
  h: number,
  animate: boolean
): void {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > LINK_DIST_SQ) continue;

      const t = 1 - distSq / LINK_DIST_SQ;
      const c = COLORS[a.hue];
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${t * 0.16})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for (const n of nodes) {
    const c = COLORS[n.hue];
    const glowR = n.r * 5;
    const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
    glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${animate ? 0.55 : 0.4})`);
    glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${animate ? 0.9 : 0.7})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 轰炸页 Web3 暗色氛围：极光光晕 + 稀疏节点连线网络 */
export function BombardBackdrop() {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodesRef.current = createNodes(width, height);
      if (reduceMotion) {
        drawFrame(ctx, nodesRef.current, width, height, false);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduceMotion) {
      return () => ro.disconnect();
    }

    let running = true;
    const tick = () => {
      if (!running) return;
      if (!document.hidden) {
        const nodes = nodesRef.current;
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          wrap(n, width, height);
        }
        drawFrame(ctx, nodes, width, height, true);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* 深空底色 */}
      <div className="absolute inset-0 bg-[#03050a]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#05070e] to-[#020308]" />

      {/* 漂移极光光晕 */}
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--a absolute -left-[20%] -top-[25%] h-[70%] w-[70%] opacity-70'
            : 'bombard-aurora bombard-aurora--a bombard-aurora--drift-a absolute -left-[20%] -top-[25%] h-[70%] w-[70%]'
        }
      />
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--b absolute -right-[15%] top-[10%] h-[60%] w-[55%] opacity-60'
            : 'bombard-aurora bombard-aurora--b bombard-aurora--drift-b absolute -right-[15%] top-[10%] h-[60%] w-[55%]'
        }
      />
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--c absolute bottom-[-20%] left-[20%] h-[55%] w-[60%] opacity-50'
            : 'bombard-aurora bombard-aurora--c bombard-aurora--drift-c absolute bottom-[-20%] left-[20%] h-[55%] w-[60%]'
        }
      />

      {/* 斜向光束 */}
      {!reduceMotion && <div className="bombard-beam absolute inset-0" />}

      {/* 节点连线网络 */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />

      <div className="ambient-noise absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-0 shadow-[inset_0_100px_100px_-50px_rgba(0,0,0,0.55),inset_0_-80px_80px_-40px_rgba(0,0,0,0.45),inset_80px_0_90px_-50px_rgba(0,0,0,0.35),inset_-80px_0_90px_-50px_rgba(0,0,0,0.35)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  );
}
