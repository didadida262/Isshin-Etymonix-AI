/** 判官面板底部贴边布局（与 ChatPanel 保持一致） */
export const DOCKED_MAX_WIDTH = 960;
export const DOCKED_EXPANDED_VH_RATIO = 0.3;
export const DOCKED_COLLAPSED_HEIGHT = 40;
/** 贴底时左右、下方的外边距 */
export const DOCKED_INSET = 12;

export function getDockedWidth(viewportWidth: number) {
  return Math.min(Math.max(0, viewportWidth - DOCKED_INSET * 2), DOCKED_MAX_WIDTH);
}

export function getDockedExpandedHeight(viewportHeight: number) {
  return Math.round(viewportHeight * DOCKED_EXPANDED_VH_RATIO);
}

/** 测量页面上已挂载的判官面板高度，无面板时用展开高度估算 */
export function measureJudgePanelHeight(viewportHeight: number): number {
  const el = document.getElementById('judge-chat-panel');
  if (el) return el.getBoundingClientRect().height;
  return getDockedExpandedHeight(viewportHeight);
}
