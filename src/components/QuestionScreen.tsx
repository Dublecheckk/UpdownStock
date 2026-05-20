import React from 'react';
import type { AnswerCategory, Problem } from '../types';
import BrandLogo from './BrandLogo';
import StockChart from './StockChart';
import { ANSWER_OPTIONS, formatDate, formatPrice } from '../utils/gameUtils';

interface Props {
  problem: Problem;
  questionNumber: number;
  onAnswer: (category: AnswerCategory) => void;
}

const QuestionScreen: React.FC<Props> = ({ problem, questionNumber, onAnswer }) => {
  return (
    <div className="screen question-screen">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-left">
          <BrandLogo />
          <span className="top-title">오를까 내릴까</span>
        </div>
        <div className="top-right">
          <span className="round-badge">문제 #{questionNumber}</span>
        </div>
      </div>

      {/* Main chart card */}
      <div className="chart-card">
        {/* Stock info header inside card */}
        <div className="stock-info-header">
          <div>
            <div className="stock-name">{problem.stockName}</div>
            <div className="stock-code">{problem.stockCode}</div>
          </div>
          <div className="base-date-block">
            <div className="base-date-label">기준일</div>
            <div className="base-date-value">{formatDate(problem.baseDate)}</div>
            <div className="prev-close">기준일 종가 <strong>{formatPrice(problem.previousClose)}</strong></div>
          </div>
        </div>

        <div className="chart-area">
          <StockChart problem={problem} revealed={false} />
        </div>
      </div>

      {/* Answer buttons */}
      <div className="answer-section">
        <p className="answer-prompt">다음 날 움직임은?</p>
        <div className="answer-buttons">
          {ANSWER_OPTIONS.map((option) => (
            <button
              key={option.category}
              className={`btn-answer btn-${option.className}`}
              onClick={() => onAnswer(option.category)}
            >
              <span className="btn-label">{option.label}</span>
              <span className="btn-range">{option.rangeLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
