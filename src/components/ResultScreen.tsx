import React from 'react';
import type { AnswerCategory, Direction, Problem, ResultType } from '../types';
import BrandLogo from './BrandLogo';
import StockChart from './StockChart';
import {
  formatDate,
  formatPrice,
  formatChangeRate,
  getCategoryColor,
  getCategoryLabel,
  getDirectionLabel,
  getResultHeadline,
  getResultPrize,
} from '../utils/gameUtils';

interface Props {
  problem: Problem;
  selectedCategory: AnswerCategory;
  selectedDirection: Direction;
  resultType: ResultType;
  onRestart: () => void;
}

const ResultScreen: React.FC<Props> = ({
  problem,
  selectedCategory,
  selectedDirection,
  resultType,
  onRestart,
}) => {
  const answerColor = getCategoryColor(problem.answerCategory);
  const resultHeadline = getResultHeadline(resultType);
  const resultPrize = getResultPrize(resultType);

  return (
    <div className="screen result-screen">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-left">
          <BrandLogo />
          <span className="top-title">오를까 내릴까</span>
        </div>
        <div className="top-right">
          <span className="stock-chip">{problem.stockName} · {formatDate(problem.baseDate)}</span>
        </div>
      </div>

      <div className="result-layout">
        {/* Left: chart */}
        <div className="result-chart-col">
          <div className="chart-card result-chart-card">
            <div className="stock-info-header">
              <div>
                <div className="stock-name">{problem.stockName}</div>
                <div className="stock-code">{problem.stockCode}</div>
              </div>
              <div className="base-date-block">
                <div className="base-date-label">기준일</div>
                <div className="base-date-value">{formatDate(problem.baseDate)}</div>
              </div>
            </div>
            <div className="chart-area result-chart-area">
              <StockChart problem={problem} revealed={true} />
            </div>
          </div>
        </div>

        {/* Right: result panel */}
        <div className="result-info-col">
          {/* Verdict */}
          <div className={`verdict-card verdict-${resultType.toLowerCase().replace('_', '-')}`}>
            <div className="verdict-text">{resultHeadline}</div>
            <div className={`prize-banner prize-${resultType.toLowerCase().replace('_', '-')}`}>
              {resultPrize}
            </div>
          </div>

          {/* Answer detail */}
          <div className="answer-detail-card">
            <div className="detail-row">
              <span className="detail-label">참가자 선택</span>
              <span className="detail-value" style={{ color: getCategoryColor(selectedCategory) }}>
                {getCategoryLabel(selectedCategory)} · {getDirectionLabel(selectedDirection)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">실제 정답</span>
              <span className="detail-value" style={{ color: answerColor, fontWeight: 800, fontSize: '1.25rem' }}>
                {getCategoryLabel(problem.answerCategory)} · {getDirectionLabel(problem.answerDirection)}
              </span>
            </div>
            <div className="detail-divider" />
            <div className="detail-row">
              <span className="detail-label">기준일 종가</span>
              <span className="detail-value">{formatPrice(problem.previousClose)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">다음 날 종가</span>
              <span className="detail-value" style={{ color: answerColor }}>
                {formatPrice(problem.answerClose)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">변동률</span>
              <span className="detail-value" style={{ color: answerColor, fontWeight: 700 }}>
                {formatChangeRate(problem.changeRate)}
              </span>
            </div>
            <div className="detail-divider" />
            <div className="detail-row">
              <span className="detail-label">결과</span>
              <span className="detail-value">{resultHeadline}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">지급 상품</span>
              <span className="detail-value prize-detail">{resultPrize}</span>
            </div>
          </div>

          <button className="btn-restart" onClick={onRestart}>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
