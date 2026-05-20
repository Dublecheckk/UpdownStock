import type { AnswerCategory, Direction, Problem, ResultType } from '../types';

export const ANSWER_OPTIONS: Array<{
  category: AnswerCategory;
  label: string;
  rangeLabel: string;
  direction: Direction;
  className: string;
}> = [
  { category: 'UP', label: '상승', rangeLabel: '+0.02% 초과', direction: 'UP', className: 'up' },
  { category: 'FLAT', label: '보합', rangeLabel: '-0.02% ~ +0.02%', direction: 'FLAT', className: 'flat' },
  { category: 'DOWN', label: '하락', rangeLabel: '-0.02% 미만', direction: 'DOWN', className: 'down' },
];

const CATEGORY_LABELS: Record<AnswerCategory, string> = {
  UP: '상승 +0.02% 초과',
  FLAT: '보합 -0.02% ~ +0.02%',
  DOWN: '하락 -0.02% 미만',
};

const CATEGORY_DIRECTIONS: Record<AnswerCategory, Direction> = {
  UP: 'UP',
  FLAT: 'FLAT',
  DOWN: 'DOWN',
};

const DIRECTION_LABELS: Record<Direction, string> = {
  UP: '상승',
  DOWN: '하락',
  FLAT: '보합',
};

const RESULT_HEADLINES: Record<ResultType, string> = {
  EXACT: '정답입니다',
  WRONG: '아쉽습니다',
};

const RESULT_PRIZES: Record<ResultType, string> = {
  EXACT: '키캡 지급',
  WRONG: '과자 1개 지급',
};

export function selectRandomProblem(problems: Problem[], recentIds: number[] = []): Problem {
  const available = problems.filter((p) => !recentIds.includes(p.id));
  const pool = available.length > 0 ? available : problems;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getCategoryFromChangeRate(changeRate: number): AnswerCategory {
  if (changeRate > 0.02) return 'UP';
  if (changeRate < -0.02) return 'DOWN';
  return 'FLAT';
}

export function getDirectionForCategory(category: AnswerCategory): Direction {
  return CATEGORY_DIRECTIONS[category];
}

export function getCategoryLabel(category: AnswerCategory): string {
  return CATEGORY_LABELS[category];
}

export function getDirectionLabel(direction: Direction): string {
  return DIRECTION_LABELS[direction];
}

export function getCategoryColor(category: AnswerCategory): string {
  switch (category) {
    case 'UP':
      return '#DC2626';
    case 'FLAT':
      return '#7C3AED';
    case 'DOWN':
      return '#1D4ED8';
  }
}

export function judgeResult(
  selectedCategory: AnswerCategory,
  answerCategory: AnswerCategory,
): ResultType {
  if (selectedCategory === answerCategory) return 'EXACT';
  return 'WRONG';
}

export function getResultHeadline(resultType: ResultType): string {
  return RESULT_HEADLINES[resultType];
}

export function getResultPrize(resultType: ResultType): string {
  return RESULT_PRIZES[resultType];
}

export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatYAxis(price: number): string {
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)}천만`;
  if (price >= 1000000) return `${(price / 10000).toFixed(0)}만`;
  if (price >= 10000) return `${(price / 10000).toFixed(1)}만`;
  return price.toLocaleString();
}

export function formatChangeRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(2)}%`;
}
