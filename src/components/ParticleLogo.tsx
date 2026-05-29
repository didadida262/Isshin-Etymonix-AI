import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import landMaskUrl from '../assets/earth-land-mask.png';
import { cn } from '../lib/cn';

interface ParticleLogoProps {
  /** 画布边长（px） */
  size?: number;
  className?: string;
}

interface GlobePoint {
  x: number;
  y: number;
  z: number;
}

const PARTICLE_RADIUS = 0.85;
const ROTATION_SPEED = 0.01;
const TILT_X = 0.28;
/** AI 常用亮绿色 */
const AI_GREEN = '57, 255, 120';

function buildLandPoints(
  imageData: ImageData,
  width: number,
  height: number,
  radius: number,
  step: number
): GlobePoint[] {
  const candidates: GlobePoint[] = [];
  const { data } = imageData;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i]! < 120) continue;

      const lonDeg = (x / width) * 360 - 180;
      const latDeg = 90 - (y / height) * 180;
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;

      candidates.push({
        x: radius * Math.cos(lat) * Math.sin(lon),
        y: radius * Math.sin(lat),
        z: radius * Math.cos(lat) * Math.cos(lon),
      });
    }
  }

  return thinByMinDistance(candidates, radius * 0.24);
}

/** 保证粒子在球面上彼此留出间距 */
function thinByMinDistance(points: GlobePoint[], minDist: number): GlobePoint[] {
  const kept: GlobePoint[] = [];
  const minDistSq = minDist * minDist;

  for (const p of points) {
    let tooClose = false;
    for (const q of kept) {
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const dz = p.z - q.z;
      if (dx * dx + dy * dy + dz * dz < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) kept.push(p);
  }

  return kept;
}

export function ParticleLogo({ size = 40, className }: ParticleLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const globeRadius = size * 0.4;

    let landPoints: GlobePoint[] = [];
    let angleY = 0;
    let raf = 0;
    let disposed = false;

    const img = new Image();
    img.src = landMaskUrl;

    const startAnimation = () => {
      const off = document.createElement('canvas');
      const w = img.naturalWidth || 256;
      const h = img.naturalHeight || 128;
      off.width = w;
      off.height = h;
      const octx = off.getContext('2d');
      if (!octx) return;

      octx.drawImage(img, 0, 0, w, h);
      const imageData = octx.getImageData(0, 0, w, h);
      const step = Math.max(6, Math.round(w / Math.max(size * 0.28, 14)));
      landPoints = buildLandPoints(imageData, w, h, globeRadius, step);

      const draw = () => {
        if (disposed) return;

        ctx.clearRect(0, 0, size, size);

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const cosX = Math.cos(TILT_X);
        const sinX = Math.sin(TILT_X);

        const projected: { sx: number; sy: number; z: number }[] = [];

        for (const p of landPoints) {
          const x1 = p.x * cosY + p.z * sinY;
          const z1 = -p.x * sinY + p.z * cosY;
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = p.y * sinX + z1 * cosX;

          projected.push({ sx: cx + x1, sy: cy + y2, z: z2 });
        }

        projected.sort((a, b) => a.z - b.z);

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, globeRadius * 1.15);
        glow.addColorStop(0, `rgba(${AI_GREEN}, 0.06)`);
        glow.addColorStop(0.6, `rgba(${AI_GREEN}, 0.02)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, size, size);

        for (const pt of projected) {
          const depth = (pt.z + globeRadius) / (2 * globeRadius);
          const alpha = 0.4 + depth * 0.55;

          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, PARTICLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${AI_GREEN}, ${alpha})`;
          ctx.fill();
        }

        angleY += ROTATION_SPEED;
        raf = requestAnimationFrame(draw);
      };

      raf = requestAnimationFrame(draw);
    };

    img.onload = () => {
      if (!disposed) startAnimation();
    };
    img.onerror = () => {
      if (!disposed) {
        landPoints = [];
        raf = requestAnimationFrame(() => {});
      }
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion, size]);

  if (reduceMotion) {
    return (
      <div
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full',
          'bg-[radial-gradient(circle,rgba(57,255,120,0.25)_0%,transparent_70%)]',
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span
          className="block rounded-full border border-[#39ff78]/40"
          style={{ width: size * 0.72, height: size * 0.72 }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none shrink-0', className)}
      aria-hidden
    />
  );
}
