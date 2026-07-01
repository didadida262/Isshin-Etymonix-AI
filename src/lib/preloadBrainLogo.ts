import brainLogoUrl from '../assets/brain.png';

let preloaded = false;

/** 预加载卡背 brain logo，避免首次进入轰炸页时才下载 */
export function preloadBrainLogo() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = brainLogoUrl;
  document.head.appendChild(link);

  const img = new Image();
  img.decoding = 'async';
  img.src = brainLogoUrl;
}
