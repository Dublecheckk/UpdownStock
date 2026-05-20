import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PricePoint, Problem } from '../types';
import {
  formatChangeRate,
  formatPrice,
  formatShortDate,
  formatYAxis,
  getCategoryColor,
  getDirectionLabel,
} from '../utils/gameUtils';

interface Props {
  problem: Problem;
  revealed: boolean;
}

interface ChartCandle extends PricePoint {
  isAnswer?: boolean;
  isHiddenSlot?: boolean;
}

interface Size {
  width: number;
  height: number;
}

const HIDDEN_SLOT_DATE = '__NEXT_DAY__';

function useElementSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function getCandleColor(candle: PricePoint): string {
  if (candle.close > candle.open) return '#DC2626';
  if (candle.close < candle.open) return '#2563EB';
  return '#7C3AED';
}

function getAnswerText(problem: Problem): string {
  return `${formatChangeRate(problem.changeRate)} ${getDirectionLabel(problem.answerDirection)}`;
}

function getMovingAverage(candles: PricePoint[], period: number): Array<number | null> {
  return candles.map((_, index) => {
    if (index < period - 1) return null;
    const slice = candles.slice(index - period + 1, index + 1);
    return slice.reduce((sum, candle) => sum + candle.close, 0) / period;
  });
}

function getLinePath(
  values: Array<number | null>,
  getX: (index: number) => number,
  getY: (price: number) => number,
): string {
  return values
    .map((value, index) => {
      if (value === null) return '';
      return `${index === values.findIndex((item) => item !== null) ? 'M' : 'L'} ${getX(index)} ${getY(value)}`;
    })
    .filter(Boolean)
    .join(' ');
}

const StockChart: React.FC<Props> = ({ problem, revealed }) => {
  const { ref, size } = useElementSize();
  const candles = useMemo<ChartCandle[]>(() => {
    if (revealed) {
      return [...problem.history, { ...problem.answerCandle, isAnswer: true }];
    }

    return [
      ...problem.history,
      {
        date: HIDDEN_SLOT_DATE,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        isHiddenSlot: true,
      },
    ];
  }, [problem.answerCandle, problem.history, revealed]);

  const visibleCandles = revealed ? [...problem.history, problem.answerCandle] : problem.history;
  const prices = visibleCandles.flatMap((candle) => [candle.high, candle.low, candle.open, candle.close]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const pricePad = (maxPrice - minPrice) * 0.18 || maxPrice * 0.04;
  const yMin = minPrice - pricePad;
  const yMax = maxPrice + pricePad;

  const { width, height } = size;
  const margin = { top: 48, right: 92, bottom: 46, left: 28 };
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const plotHeight = Math.max(0, height - margin.top - margin.bottom);
  const volumeHeight = Math.max(54, plotHeight * 0.18);
  const volumeGap = 16;
  const priceHeight = Math.max(160, plotHeight - volumeHeight - volumeGap);
  const priceBottom = margin.top + priceHeight;
  const volumeBottom = margin.top + plotHeight;
  const step = candles.length > 0 ? plotWidth / candles.length : 0;
  const candleWidth = Math.min(24, Math.max(8, step * 0.5));
  const volumeWidth = Math.min(22, Math.max(6, step * 0.48));
  const answerColor = getCategoryColor(problem.answerCategory);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const maxVolume = Math.max(...visibleCandles.map((candle) => candle.volume ?? 0), 1);
  const ma5 = getMovingAverage(visibleCandles, 5);
  const ma10 = getMovingAverage(visibleCandles, 10);

  const getX = (index: number) => margin.left + step * index + step / 2;
  const getY = (price: number) => margin.top + ((yMax - price) / (yMax - yMin)) * priceHeight;
  const getVolumeY = (volume: number) => volumeBottom - (volume / maxVolume) * volumeHeight;
  const ma5Path = getLinePath(ma5, getX, getY);
  const ma10Path = getLinePath(ma10, getX, getY);
  const previousCloseY = getY(problem.previousClose);

  return (
    <div ref={ref} className="candlestick-chart" aria-label="주식 일봉 차트">
      {width > 0 && height > 0 && (
        <svg width={width} height={height} role="img">
          <rect x={0} y={0} width={width} height={height} rx={12} fill="#FFFFFF" />

          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  x2={width - margin.right}
                  y1={y}
                  y2={y}
                  stroke="#EEF2F7"
                  strokeWidth={1}
                />
                <text
                  x={width - margin.right + 12}
                  y={y + 4}
                  textAnchor="start"
                  className="chart-axis-label"
                >
                  {formatYAxis(tick)}
                </text>
              </g>
            );
          })}

          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={priceBottom}
            y2={priceBottom}
            stroke="#CBD5E1"
            strokeWidth={1.2}
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={volumeBottom}
            y2={volumeBottom}
            stroke="#CBD5E1"
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={previousCloseY}
            y2={previousCloseY}
            stroke="#F59E0B"
            strokeWidth={1.4}
            strokeDasharray="5 5"
            opacity={0.8}
          />
          <text
            x={width - margin.right + 12}
            y={previousCloseY + 4}
            textAnchor="start"
            className="chart-reference-label"
          >
            기준가
          </text>

          <g className="chart-legend">
            <text x={margin.left} y={24}>일봉</text>
            <circle cx={margin.left + 50} cy={20} r={4} fill="#F59E0B" />
            <text x={margin.left + 60} y={24}>MA5</text>
            <circle cx={margin.left + 112} cy={20} r={4} fill="#10B981" />
            <text x={margin.left + 122} y={24}>MA10</text>
            <text x={width - margin.right - 124} y={24}>거래량</text>
          </g>

          {ma5Path && (
            <path d={ma5Path} fill="none" stroke="#F59E0B" strokeWidth={2.2} strokeLinecap="round" />
          )}
          {ma10Path && (
            <path d={ma10Path} fill="none" stroke="#10B981" strokeWidth={2.2} strokeLinecap="round" />
          )}

          {candles.map((candle, index) => {
            const x = getX(index);

            if (candle.isHiddenSlot) {
              const slotX = x - step / 2 + 5;
              const slotWidth = Math.max(36, step - 10);
              return (
                <g key={candle.date}>
                  <rect
                    x={slotX}
                    y={margin.top + 8}
                    width={slotWidth}
                    height={priceHeight - 16}
                    rx={8}
                    fill="#F8FAFC"
                    stroke="#CBD5E1"
                    strokeWidth={2}
                    strokeDasharray="8 7"
                  />
                  <text
                    x={x}
                    y={margin.top + priceHeight / 2 - 12}
                    textAnchor="middle"
                    className="hidden-slot-question"
                  >
                    ?
                  </text>
                  <text
                    x={x}
                    y={margin.top + priceHeight / 2 + 28}
                    textAnchor="middle"
                    className="hidden-slot-label"
                  >
                    다음 날은?
                  </text>
                </g>
              );
            }

            const color = getCandleColor(candle);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);
            const bodyY = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(4, Math.abs(yClose - yOpen));
            const isAnswer = candle.isAnswer && revealed;
            const volume = candle.volume ?? 0;
            const volumeY = getVolumeY(volume);

            return (
              <g key={candle.date}>
                <rect
                  x={x - volumeWidth / 2}
                  y={volumeY}
                  width={volumeWidth}
                  height={Math.max(1, volumeBottom - volumeY)}
                  rx={2}
                  fill={isAnswer ? answerColor : color}
                  opacity={0.28}
                />
                {isAnswer && (
                  <circle
                    cx={x}
                    cy={(yHigh + yLow) / 2}
                    r={Math.max(18, candleWidth * 1.15)}
                    fill={answerColor}
                    opacity={0.12}
                  />
                )}
                <line
                  x1={x}
                  x2={x}
                  y1={yHigh}
                  y2={yLow}
                  stroke={isAnswer ? answerColor : color}
                  strokeWidth={isAnswer ? 3 : 2}
                  strokeLinecap="round"
                />
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyHeight}
                  rx={3}
                  fill={isAnswer ? answerColor : color}
                  opacity={isAnswer ? 1 : 0.88}
                />
                {index % 2 === 0 && (
                  <text
                    x={x}
                    y={volumeBottom + 26}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {formatShortDate(candle.date)}
                  </text>
                )}
              </g>
            );
          })}

          {revealed && (
            <g>
              <line
                x1={getX(problem.history.length) - step / 2}
                x2={getX(problem.history.length) - step / 2}
                y1={margin.top}
                y2={volumeBottom}
                stroke={answerColor}
                strokeWidth={1.5}
                strokeDasharray="6 6"
                opacity={0.75}
              />
              <rect
                x={Math.max(margin.left, getX(problem.history.length) - 76)}
                y={margin.top - 18}
                width={152}
                height={30}
                rx={6}
                fill={answerColor}
              />
              <text
                x={Math.max(margin.left, getX(problem.history.length))}
                y={margin.top + 2}
                textAnchor="middle"
                className="answer-chart-label"
              >
                {getAnswerText(problem)}
              </text>
            </g>
          )}

          <text x={margin.left} y={height - 10} className="chart-footnote">
            기준일 종가 {formatPrice(problem.previousClose)}
          </text>
        </svg>
      )}
    </div>
  );
};

export default StockChart;
