const THINK_BLOCK = /<think(?:ing)?\s*>[\s\S]*?<\/think(?:ing)?\s*>/gi;

export function stripThinkContent(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(THINK_BLOCK, '').replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}
