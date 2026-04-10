export const SCHEDULE_PALETTE_COUNT = 10;

function hashToIndex(input: string, size: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return size === 0 ? 0 : h % size;
}

export function getBaseScheduleColorIndex(seed: string): number {
  return hashToIndex(seed, SCHEDULE_PALETTE_COUNT);
}

