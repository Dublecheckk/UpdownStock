import React from 'react';
import BrandLogo from './BrandLogo';

interface Props {
  onStart: () => void;
  isLoading: boolean;
  problemCount: number;
  dataSource: 'live' | 'mock';
}

const ReadyScreen: React.FC<Props> = ({ onStart, isLoading, problemCount, dataSource }) => {
  const dataLabel = dataSource === 'live' ? '실제 일봉' : '예비 데이터';

  return (
    <div className="screen ready-screen">
      <div className="ready-content">
        <div className="brand">
          <BrandLogo size="hero" />
        </div>

        <h1 className="ready-title">
          오를까 내릴까
        </h1>

        <p className="ready-desc">
          과거 차트를 보고 다음 날 주가 움직임을 맞혀보세요.<br />
          <strong>상승, 보합, 하락 중 하나를 맞히면 키캡 지급</strong>
        </p>

        <div className="ready-prize-info">
          <div className="prize-item correct">
            <span>정답 → <strong>키캡 지급</strong></span>
          </div>
          <div className="prize-item wrong">
            <span>참여 보상 → <strong>과자 1개 지급</strong></span>
          </div>
        </div>

        <button className="btn-start" onClick={onStart} disabled={isLoading}>
          {isLoading ? '차트 준비 중' : '게임 시작'}
        </button>

        <p className="ready-hint">{dataLabel} {problemCount}문제 준비됨</p>
      </div>
    </div>
  );
};

export default ReadyScreen;
