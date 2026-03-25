
export interface ScoredItem {
  score: number;
}

/**
 * Calculates the rank for each item in a sorted list (descending by score).
 * Dense ranking (1, 1, 2, 3...) - users with same score get same rank, 
 * and the next rank is the next consecutive number.
 */
export function calculateRanks<T extends ScoredItem>(items: T[]): number[] {
  const ranks: number[] = [];
  let currentRank = 0;
  let lastScore = -1;

  for (let i = 0; i < items.length; i++) {
    if (items[i].score !== lastScore) {
      currentRank++;
      lastScore = items[i].score;
    }
    ranks.push(currentRank);
  }

  return ranks;
}
