import { DOCKED_INSET, measureJudgePanelHeight } from './chatDockLayout';

export const CARD_SCROLL_SETTLE_MS = 520;
export const CARD_CENTER_MOVE_MS = 580;
export const CARD_FOCUS_MIN_SCALE = 1;
export const CARD_FOCUS_MAX_SCALE = 1.5;
const FOCUS_EDGE_PADDING = 16;

export type CardFocusTransform = { x: number; y: number; scale: number };

export function cardRefKey(rootIdx: number, wordIdx: number) {
  return `${rootIdx}-${wordIdx}`;
}

function getFocusSafeArea() {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const header = document.querySelector('header');
  const safeTop = (header?.getBoundingClientRect().bottom ?? 72) + 8;
  const chatEl = document.getElementById('judge-chat-panel');
  const safeBottom = chatEl
    ? chatEl.getBoundingClientRect().top - 8
    : vh - measureJudgePanelHeight(vh) - DOCKED_INSET - 8;
  return { vw, vh, safeTop, safeBottom };
}

/** 居中位移 + 按可视区域计算的放大比例（避开顶栏与判官面板） */
export function computeCardFocusTransform(cardEl: HTMLElement): CardFocusTransform {
  const rect = cardEl.getBoundingClientRect();
  const { vw, safeTop, safeBottom } = getFocusSafeArea();
  const pad = FOCUS_EDGE_PADDING;
  const availW = Math.max(120, vw - pad * 2);
  const availH = Math.max(120, safeBottom - safeTop - pad * 2);

  const maxW = Math.min(availW * 0.78, 420);
  const maxH = Math.min(availH * 0.72, maxW * (3 / 2));
  const scaleW = maxW / rect.width;
  const scaleH = maxH / rect.height;
  const scale = Math.max(
    CARD_FOCUS_MIN_SCALE,
    Math.min(scaleW, scaleH, CARD_FOCUS_MAX_SCALE)
  );

  const scaledW = rect.width * scale;
  const scaledH = rect.height * scale;

  const minCenterX = pad + scaledW / 2;
  const maxCenterX = vw - pad - scaledW / 2;
  const minCenterY = safeTop + pad + scaledH / 2;
  const maxCenterY = safeBottom - pad - scaledH / 2;

  const targetX =
    minCenterX <= maxCenterX ? (minCenterX + maxCenterX) / 2 : vw / 2;
  const targetY =
    minCenterY <= maxCenterY
      ? (minCenterY + maxCenterY) / 2
      : Math.min(Math.max((safeTop + safeBottom) / 2, minCenterY), maxCenterY);

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return {
    x: targetX - centerX,
    y: targetY - centerY,
    scale,
  };
}
