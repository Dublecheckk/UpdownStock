import React, { useEffect, useRef, useState } from 'react';
import type { Problem } from '../types';
import BrandLogo from './BrandLogo';
import { formatDate, selectRandomProblem } from '../utils/gameUtils';

interface Props {
  problems: Problem[];
  recentIds: number[];
  onComplete: (problem: Problem) => void;
}

const RouletteScreen: React.FC<Props> = ({ problems, recentIds, onComplete }) => {
  const [selectedProblem] = useState(() => selectRandomProblem(problems, recentIds));
  const [{ reelItems, selectedIndex }] = useState(() => {
    const randomProblem = () => problems[Math.floor(Math.random() * problems.length)];
    const leadItems = Array.from({ length: 28 }, randomProblem);
    const tailItems = Array.from({ length: 6 }, randomProblem);
    return {
      reelItems: [...leadItems, selectedProblem, ...tailItems],
      selectedIndex: leadItems.length,
    };
  });
  const [isStopping, setIsStopping] = useState(false);
  const [phase, setPhase] = useState<'spinning' | 'done'>('spinning');
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const itemHeight = 96;
  const finalOffset = -(selectedIndex - 1) * itemHeight;

  useEffect(() => {
    timersRef.current = [
      setTimeout(() => setIsStopping(true), 120),
      setTimeout(() => setPhase('done'), 2500),
      setTimeout(() => onComplete(selectedProblem), 3200),
    ];

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, [onComplete, selectedProblem]);

  return (
    <div className="screen roulette-screen">
      <div className="roulette-header">
        <BrandLogo variant="light" />
        <span className="roulette-title-text">오를까 내릴까</span>
      </div>

      <div className="roulette-content">
        <p className="roulette-label">
          {phase === 'done' ? '종목 선택 완료' : '종목 선택 중'}
        </p>

        <div className={`roulette-cylinder ${phase === 'done' ? 'roulette-done' : ''}`}>
          <div className="roulette-selection-line" />
          <div
            className="roulette-reel"
            style={{
              transform: `translateY(${isStopping ? finalOffset : 0}px)`,
            }}
          >
            {reelItems.map((problem, index) => (
              <div
                className={`roulette-item ${
                  phase === 'done' && index === selectedIndex ? 'selected' : ''
                }`}
                key={`${problem.id}-${index}`}
              >
                <span className="roulette-stock">{problem.stockName}</span>
                <span className="roulette-date">{formatDate(problem.baseDate)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteScreen;
