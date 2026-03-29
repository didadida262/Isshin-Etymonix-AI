import articleCategories from './article-categories.json';

export type ArticleCategoryDef = {
  id: string;
  label: string;
};

export const ARTICLE_CATEGORIES = articleCategories as ArticleCategoryDef[];

export function getCategoryLabel(categoryId: string): string {
  return (
    ARTICLE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId
  );
}

export function getCategorySortIndex(categoryId: string): number {
  const i = ARTICLE_CATEGORIES.findIndex((c) => c.id === categoryId);
  return i === -1 ? 999 : i;
}
