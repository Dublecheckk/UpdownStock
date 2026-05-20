export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type AnswerCategory = 'UP' | 'FLAT' | 'DOWN';
export type Direction = 'UP' | 'DOWN' | 'FLAT';
export type ResultType = 'EXACT' | 'WRONG';

export interface Problem {
  id: number;
  stockName: string;
  stockCode: string;
  baseDate: string;
  history: PricePoint[];
  answerDate: string;
  answerCandle: PricePoint;
  previousClose: number;
  answerClose: number;
  changeRate: number;
  answerCategory: AnswerCategory;
  answerDirection: Direction;
}

export type GameState = 'READY' | 'ROULETTE' | 'QUESTION' | 'RESULT';
