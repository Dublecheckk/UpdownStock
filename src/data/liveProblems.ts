import type { AnswerCategory, PricePoint, Problem } from '../types';
import { getCategoryFromChangeRate, getDirectionForCategory } from '../utils/gameUtils';

interface StockConfig {
  name: string;
  code: string;
}

interface ProblemCandidate {
  problem: Omit<Problem, 'id'>;
  score: number;
}

const STOCKS: StockConfig[] = [
  { name: '삼성전자', code: '005930' },
  { name: 'SK하이닉스', code: '000660' },
  { name: 'NAVER', code: '035420' },
  { name: '카카오', code: '035720' },
  { name: '현대차', code: '005380' },
  { name: '기아', code: '000270' },
  { name: 'LG에너지솔루션', code: '373220' },
  { name: '삼성SDI', code: '006400' },
  { name: 'LG화학', code: '051910' },
  { name: '포스코홀딩스', code: '005490' },
  { name: '셀트리온', code: '068270' },
  { name: 'KB금융', code: '105560' },
  { name: '신한지주', code: '055550' },
  { name: '현대모비스', code: '012330' },
  { name: 'LG전자', code: '066570' },
  { name: '삼성바이오로직스', code: '207940' },
  { name: '하나금융지주', code: '086790' },
  { name: 'SK이노베이션', code: '096770' },
  { name: '에코프로비엠', code: '247540' },
  { name: '삼성물산', code: '028260' },
  { name: '삼성전기', code: '009150' },
  { name: '삼성생명', code: '032830' },
  { name: '삼성화재', code: '000810' },
  { name: '한화에어로스페이스', code: '012450' },
  { name: '한화솔루션', code: '009830' },
  { name: '두산에너빌리티', code: '034020' },
  { name: 'HD현대중공업', code: '329180' },
  { name: 'HD한국조선해양', code: '009540' },
  { name: 'HMM', code: '011200' },
  { name: '대한항공', code: '003490' },
  { name: '아모레퍼시픽', code: '090430' },
  { name: 'KT&G', code: '033780' },
  { name: 'KT', code: '030200' },
  { name: 'SK텔레콤', code: '017670' },
  { name: 'LG유플러스', code: '032640' },
  { name: '엔씨소프트', code: '036570' },
  { name: '크래프톤', code: '259960' },
  { name: '넷마블', code: '251270' },
  { name: '알테오젠', code: '196170' },
  { name: 'HLB', code: '028300' },
];

const HISTORY_LENGTH = 20;
const MIN_LIVE_PROBLEMS = 20;
const MAX_LIVE_PROBLEMS = 100;
const CANDLES_PER_STOCK = 260;
const CATEGORIES: AnswerCategory[] = [
  'UP',
  'FLAT',
  'DOWN',
];

function toDateString(rawDate: string): string {
  return `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
}

function parseNaverChartXml(xml: string): PricePoint[] {
  const candles: PricePoint[] = [];
  const itemRegex = /<item\s+data="([^"]+)"\s*\/>/g;
  let match = itemRegex.exec(xml);

  while (match) {
    const [rawDate, open, high, low, close, volume] = match[1].split('|');
    const candle: PricePoint = {
      date: toDateString(rawDate),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };

    if (
      candle.date &&
      Number.isFinite(candle.open) &&
      Number.isFinite(candle.high) &&
      Number.isFinite(candle.low) &&
      Number.isFinite(candle.close)
    ) {
      candles.push(candle);
    }

    match = itemRegex.exec(xml);
  }

  return candles;
}

async function fetchDailyCandles(stockCode: string): Promise<PricePoint[]> {
  const params = new URLSearchParams({
    symbol: stockCode,
    timeframe: 'day',
    count: String(CANDLES_PER_STOCK),
    requestType: '0',
  });
  const response = await fetch(`/chart-api/naver/sise.nhn?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch daily candles for ${stockCode}`);
  }

  const xml = await response.text();
  const candles = parseNaverChartXml(xml);

  if (candles.length < HISTORY_LENGTH + 2) {
    throw new Error(`Not enough daily candles for ${stockCode}`);
  }

  // The newest candle can be an in-session candle, so only use completed earlier candles.
  return candles.slice(0, -1);
}

function countDirectionChanges(history: PricePoint[]): number {
  let changes = 0;
  let previousSign = 0;

  for (let index = 1; index < history.length; index += 1) {
    const diff = history[index].close - history[index - 1].close;
    const sign = diff === 0 ? 0 : diff > 0 ? 1 : -1;
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) changes += 1;
    if (sign !== 0) previousSign = sign;
  }

  return changes;
}

function getWindowScore(history: PricePoint[], changeRate: number): number {
  const startClose = history[0].close;
  const endClose = history[history.length - 1].close;
  const historyMove = Math.abs(((endClose - startClose) / startClose) * 100);
  const directionChanges = countDirectionChanges(history);
  const nearFlat = Math.abs(changeRate) < 0.08 ? 2 : 0;
  const notTooTrending = historyMove < 6 ? 2 : historyMove < 10 ? 1 : -3;

  return directionChanges * 2 + nearFlat + notTooTrending;
}

function buildCandidates(stock: StockConfig, candles: PricePoint[]): ProblemCandidate[] {
  const candidates: ProblemCandidate[] = [];

  for (let answerIndex = HISTORY_LENGTH; answerIndex < candles.length; answerIndex += 1) {
    const history = candles.slice(answerIndex - HISTORY_LENGTH, answerIndex);
    const answerCandle = candles[answerIndex];
    const previousClose = history[history.length - 1].close;
    const answerClose = answerCandle.close;
    const changeRate = Math.round(((answerClose - previousClose) / previousClose) * 10000) / 100;
    const answerCategory = getCategoryFromChangeRate(changeRate);
    const answerDirection = getDirectionForCategory(answerCategory);
    const score = getWindowScore(history, changeRate);

    if (Math.abs(changeRate) > 7 || score < 2) continue;

    candidates.push({
      problem: {
        stockName: stock.name,
        stockCode: stock.code,
        baseDate: history[history.length - 1].date,
        history,
        answerDate: answerCandle.date,
        answerCandle,
        previousClose,
        answerClose,
        changeRate,
        answerCategory,
        answerDirection,
      },
      score,
    });
  }

  return candidates;
}

function selectBalancedProblems(candidates: ProblemCandidate[]): Problem[] {
  const byCategory = new Map<AnswerCategory, ProblemCandidate[]>();

  for (const category of CATEGORIES) {
    byCategory.set(category, []);
  }

  for (const candidate of candidates) {
    byCategory.get(candidate.problem.answerCategory)?.push(candidate);
  }

  for (const category of CATEGORIES) {
    byCategory.get(category)?.sort((a, b) => b.score - a.score);
  }

  const selected: ProblemCandidate[] = [];

  while (selected.length < MAX_LIVE_PROBLEMS) {
    const before = selected.length;
    for (const category of CATEGORIES) {
      const next = byCategory.get(category)?.shift();
      if (next) selected.push(next);
      if (selected.length >= MAX_LIVE_PROBLEMS) break;
    }
    if (selected.length === before) break;
  }

  return selected.map((candidate, index) => ({
    id: index + 1,
    ...candidate.problem,
  }));
}

export async function loadLiveProblems(): Promise<Problem[]> {
  const responses = await Promise.allSettled(
    STOCKS.map(async (stock) => {
      const candles = await fetchDailyCandles(stock.code);
      return buildCandidates(stock, candles);
    }),
  );

  const candidates = responses.flatMap((response) =>
    response.status === 'fulfilled' ? response.value : [],
  );
  const problems = selectBalancedProblems(candidates);

  if (problems.length < MIN_LIVE_PROBLEMS) {
    throw new Error('Not enough live daily chart problems');
  }

  return problems;
}
