
export interface ScoredItem {
  score: number;
}

/**
 * Calculates the rank for each item in a sorted list (descending by score).
 * Standard competition ranking (1, 1, 3, 4...).
 */
export function calculateRanks<T extends ScoredItem>(items: T[]): number[] {
  const ranks: number[] = [];
  let currentRank = 1;

  for (let i = 0; i < items.length; i++) {
    if (i > 0 && items[i].score < items[i - 1].score) {
      currentRank = i + 1;
    }
    ranks.push(currentRank);
  }

  return ranks;
}
