import type { RootUnit } from '../types/rootUnit';

const TOTAL = 30;

export const ROOT_UNITS: RootUnit[] = Array.from({ length: TOTAL }, (_, i) => {
  const id = i + 1;
  return {
    id,
    label: `Unit ${id}`,
    locked: id !== 1,
  };
});