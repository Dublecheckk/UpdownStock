import type { AnswerCategory, Problem, PricePoint } from '../types';
import { getCategoryFromChangeRate, getDirectionForCategory } from '../utils/gameUtils';

// Deterministic LCG pseudo-random (so mock data is consistent on reload)
function createLCG(seed: number) {
  let s = Math.abs(seed) % 2147483647 || 1;
  return {
    next(): number {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    },
  };
}

function getTradingDays(startStr: string, count: number): string[] {
  const days: string[] = [];
  const cur = new Date(startStr + 'T00:00:00');
  while (days.length < count) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getNextTradingDay(dateStr: string): string {
  const cur = new Date(dateStr + 'T00:00:00');
  cur.setDate(cur.getDate() + 1);
  while (cur.getDay() === 0 || cur.getDay() === 6) cur.setDate(cur.getDate() + 1);
  return cur.toISOString().split('T')[0];
}

interface StockConfig {
  name: string;
  code: string;
  basePrice: number;
  volatility: number;
}

const STOCKS: StockConfig[] = [
  { name: '삼성전자',       code: '005930', basePrice: 72000,  volatility: 0.015 },
  { name: 'SK하이닉스',     code: '000660', basePrice: 155000, volatility: 0.022 },
  { name: 'NAVER',          code: '035420', basePrice: 185000, volatility: 0.018 },
  { name: '카카오',          code: '035720', basePrice: 44000,  volatility: 0.024 },
  { name: '현대차',          code: '005380', basePrice: 245000, volatility: 0.016 },
  { name: '기아',            code: '000270', basePrice: 98000,  volatility: 0.018 },
  { name: 'LG에너지솔루션',  code: '373220', basePrice: 370000, volatility: 0.021 },
  { name: '삼성SDI',         code: '006400', basePrice: 420000, volatility: 0.022 },
  { name: 'LG화학',          code: '051910', basePrice: 520000, volatility: 0.019 },
  { name: '포스코홀딩스',    code: '005490', basePrice: 380000, volatility: 0.017 },
  { name: '셀트리온',        code: '068270', basePrice: 190000, volatility: 0.021 },
  { name: 'KB금융',          code: '105560', basePrice: 66000,  volatility: 0.015 },
  { name: '신한지주',        code: '055550', basePrice: 44000,  volatility: 0.014 },
  { name: '현대모비스',      code: '012330', basePrice: 270000, volatility: 0.016 },
  { name: 'LG전자',          code: '066570', basePrice: 108000, volatility: 0.018 },
  { name: '삼성바이오로직스', code: '207940', basePrice: 825000, volatility: 0.018 },
  { name: '하나금융지주',    code: '086790', basePrice: 52000,  volatility: 0.015 },
  { name: 'SK이노베이션',    code: '096770', basePrice: 150000, volatility: 0.021 },
  { name: '에코프로비엠',    code: '247540', basePrice: 200000, volatility: 0.032 },
  { name: '삼성물산',        code: '028260', basePrice: 115000, volatility: 0.015 },
  { name: '삼성전기',        code: '009150', basePrice: 145000, volatility: 0.020 },
  { name: '삼성생명',        code: '032830', basePrice: 92000,  volatility: 0.014 },
  { name: '삼성화재',        code: '000810', basePrice: 300000, volatility: 0.014 },
  { name: '한화에어로스페이스', code: '012450', basePrice: 190000, volatility: 0.026 },
  { name: '한화솔루션',      code: '009830', basePrice: 32000,  volatility: 0.024 },
  { name: '두산에너빌리티',  code: '034020', basePrice: 18000,  volatility: 0.027 },
  { name: 'HD현대중공업',    code: '329180', basePrice: 125000, volatility: 0.023 },
  { name: 'HD한국조선해양',  code: '009540', basePrice: 125000, volatility: 0.021 },
  { name: 'HMM',             code: '011200', basePrice: 18000,  volatility: 0.025 },
  { name: '대한항공',        code: '003490', basePrice: 23000,  volatility: 0.018 },
  { name: '아모레퍼시픽',    code: '090430', basePrice: 145000, volatility: 0.021 },
  { name: 'KT&G',            code: '033780', basePrice: 90000,  volatility: 0.012 },
  { name: 'KT',              code: '030200', basePrice: 38000,  volatility: 0.012 },
  { name: 'SK텔레콤',        code: '017670', basePrice: 52000,  volatility: 0.012 },
  { name: 'LG유플러스',      code: '032640', basePrice: 10500,  volatility: 0.013 },
  { name: '엔씨소프트',      code: '036570', basePrice: 220000, volatility: 0.025 },
  { name: '크래프톤',        code: '259960', basePrice: 240000, volatility: 0.024 },
  { name: '넷마블',          code: '251270', basePrice: 60000,  volatility: 0.026 },
  { name: '알테오젠',        code: '196170', basePrice: 95000,  volatility: 0.035 },
  { name: 'HLB',             code: '028300', basePrice: 75000,  volatility: 0.036 },
];

// 5 periods × 40 stocks = 200 fallback problems
const PERIODS: string[] = [
  '2023-02-06',
  '2023-06-05',
  '2023-10-02',
  '2024-01-08',
  '2024-05-06',
];

const TARGET_CATEGORIES: AnswerCategory[] = [
  'UP',
  'FLAT',
  'DOWN',
];

function getPriceStep(price: number): number {
  if (price >= 100000) return 500;
  if (price >= 10000) return 100;
  return 50;
}

function roundPrice(price: number): number {
  const step = getPriceStep(price);
  return Math.max(step, Math.round(price / step) * step);
}

function getTargetRate(category: AnswerCategory, rng: ReturnType<typeof createLCG>, id: number): number {
  const nearEdge = id % 4 === 0;

  switch (category) {
    case 'UP':
      return nearEdge ? 0.04 + rng.next() * 0.18 : 0.25 + rng.next() * 1.4;
    case 'FLAT': {
      const sign = rng.next() > 0.5 ? 1 : -1;
      return sign * rng.next() * 0.018;
    }
    case 'DOWN':
      return nearEdge ? -0.04 - rng.next() * 0.18 : -0.25 - rng.next() * 1.4;
  }
}

function getFallbackRate(category: AnswerCategory): number {
  switch (category) {
    case 'UP':
      return 0.8;
    case 'FLAT':
      return 0;
    case 'DOWN':
      return -0.8;
  }
}

function createAnswerClose(
  previousClose: number,
  targetCategory: AnswerCategory,
  rng: ReturnType<typeof createLCG>,
  id: number,
): number {
  const rates = [
    getTargetRate(targetCategory, rng, id),
    getTargetRate(targetCategory, rng, id + 11),
    getFallbackRate(targetCategory),
  ];

  for (const rate of rates) {
    const answerClose = roundPrice(previousClose * (1 + rate / 100));
    const changeRate = Math.round(((answerClose - previousClose) / previousClose) * 10000) / 100;
    if (getCategoryFromChangeRate(changeRate) === targetCategory) return answerClose;
  }

  return roundPrice(previousClose);
}

function generateProblem(id: number, stock: StockConfig, startDate: string): Problem {
  const rng = createLCG(id * 997 + 42);

  const allDays = getTradingDays(startDate, 21);
  const historyDays = allDays.slice(0, 20);
  const baseDate = historyDays[historyDays.length - 1];
  const answerDate = getNextTradingDay(baseDate);

  // Generate a choppy, mean-reverting walk so the final direction is not too obvious.
  const anchor = stock.basePrice * (0.9 + rng.next() * 0.2);
  let price = anchor * (0.98 + rng.next() * 0.04);
  const history: PricePoint[] = [];

  for (const [index, date] of historyDays.entries()) {
    const open = roundPrice(price * (1 + (rng.next() - 0.5) * stock.volatility * 0.45));
    const meanReversion = ((anchor - price) / price) * 0.32;
    const noise = (rng.next() - 0.5) * stock.volatility * 1.7;
    const wave = Math.sin((index + (id % 5)) * 1.35) * stock.volatility * 0.22;
    const rawChange = meanReversion + noise + wave;
    const cappedChange = Math.max(-stock.volatility, Math.min(stock.volatility, rawChange));
    price = roundPrice(price * (1 + cappedChange));
    const close = price;
    const high = roundPrice(Math.max(open, close) * (1 + rng.next() * stock.volatility * 0.45));
    const low = roundPrice(Math.min(open, close) * (1 - rng.next() * stock.volatility * 0.45));
    const volume = Math.round(800000 + rng.next() * 4200000);
    history.push({ date, open, high, low, close, volume });
  }

  const previousClose = history[history.length - 1].close;
  const targetCategory = TARGET_CATEGORIES[(id - 1) % TARGET_CATEGORIES.length];
  const answerClose = createAnswerClose(previousClose, targetCategory, rng, id);
  const changeRate = Math.round(((answerClose - previousClose) / previousClose) * 10000) / 100;
  const answerCategory = getCategoryFromChangeRate(changeRate);
  const answerDirection = getDirectionForCategory(answerCategory);
  const answerOpen = roundPrice(previousClose * (1 + (rng.next() - 0.5) * stock.volatility * 0.5));
  const answerCandle: PricePoint = {
    date: answerDate,
    open: answerOpen,
    high: roundPrice(Math.max(answerOpen, answerClose) * (1 + rng.next() * stock.volatility * 0.5)),
    low: roundPrice(Math.min(answerOpen, answerClose) * (1 - rng.next() * stock.volatility * 0.5)),
    close: answerClose,
    volume: Math.round(900000 + rng.next() * 5200000),
  };

  return {
    id,
    stockName: stock.name,
    stockCode: stock.code,
    baseDate,
    history,
    answerDate,
    answerCandle,
    previousClose,
    answerClose,
    changeRate,
    answerCategory,
    answerDirection,
  };
}

function generateMockProblems(): Problem[] {
  const problems: Problem[] = [];
  let id = 1;
  for (const period of PERIODS) {
    for (const stock of STOCKS) {
      problems.push(generateProblem(id++, stock, period));
    }
  }
  return problems;
}

export const mockProblems: Problem[] = generateMockProblems();

export default mockProblems;
