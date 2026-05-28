const THINK_BLOCK = /<think(?:ing)?\s*>[\s\S]*?<\/think(?:ing)?\s*>/gi;
const THINK_OPEN_TAIL = /<think(?:ing)?\s*>[\s\S]*$/i;
const THINK_CLOSE = /<\/think(?:ing)?\s*>/gi;

/** 非流式：移除完整 think 块 */
export function stripThinkContent(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(THINK_BLOCK, '').replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

/** 流式：同时隐藏未闭合的 think 块，避免长时间无可见输出 */
export function getVisibleStreamingText(accumulated: string): string {
  if (!accumulated) return '';
  return accumulated
    .replace(THINK_BLOCK, '')
    .replace(THINK_OPEN_TAIL, '')
    .replace(THINK_CLOSE, '')
    .replace(/\n{3,}/g, '\n\n');
}
