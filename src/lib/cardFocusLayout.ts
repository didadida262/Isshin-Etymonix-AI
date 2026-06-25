import { DOCKED_INSET, measureJudgePanelHeight } from './chatDockLayout';

export const CARD_SCROLL_SETTLE_MS = 520;
export const CARD_CENTER_MOVE_MS = 580;
export const CARD_FOCUS_MIN_SCALE = 1;
export const CARD_FOCUS_MAX_SCALE = 1.5;

export type CardFocusTransform = { x: number; y: number; scale: number };

export function cardRefKey(rootIdx: number, wordIdx: number) {
  return `${rootIdx}-${wordIdx}`;
}

function getFocusSafeArea() {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const header = document.querySelector('header');
  const safeTop = header?.getBoundingClientRect().bottom ?? 72;
  const chatEl = document.getElementById('judge-chat-panel');
  const safeBottom = chatEl
    ? chatEl.getBoundingClientRect().top
    : vh - measureJudgePanelHeight(vh) - DOCKED_INSET;
  return { vw, safeTop, safeBottom };
}

/** 居中位移 + 按可视区域计算的放大比例 */
export function computeCardFocusTransform(cardEl: HTMLElement): CardFocusTransform {
  const rect = cardEl.getBoundingClientRect();
  const { vw, safeTop, safeBottom } = getFocusSafeArea();
  const availW = vw - 32;
  const availH = Math.max(120, safeBottom - safeTop - 20);
  const targetX = vw / 2;
  const targetY = (safeTop + safeBottom) / 2;
  const maxW = Math.min(availW * 0.78, 420);
  const maxH = Math.min(availH * 0.72, maxW * (3 / 2));
  const scaleW = maxW / rect.width;
  const scaleH = maxH / rect.height;
  const scale = Math.max(
    CARD_FOCUS_MIN_SCALE,
    Math.min(scaleW, scaleH, CARD_FOCUS_MAX_SCALE)
  );
  return {
    x: targetX - (rect.left + rect.width / 2),
    y: targetY - (rect.top + rect.height / 2),
    scale,
  };
}
