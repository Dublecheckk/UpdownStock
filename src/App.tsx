import React, { useState, useCallback, useEffect } from 'react';
import type { AnswerCategory, Direction, GameState, Problem, ResultType } from './types';
import { mockProblems } from './data/problems';
import { loadLiveProblems } from './data/liveProblems';
import ReadyScreen from './components/ReadyScreen';
import RouletteScreen from './components/RouletteScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultScreen from './components/ResultScreen';
import { getDirectionForCategory, judgeResult } from './utils/gameUtils';
import './App.css';

const MAX_RECENT = 10;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('READY');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AnswerCategory | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [resultType, setResultType] = useState<ResultType | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');

  useEffect(() => {
    let isMounted = true;

    loadLiveProblems()
      .then((liveProblems) => {
        if (!isMounted) return;
        setProblems(liveProblems);
        setDataSource('live');
      })
      .catch(() => {
        if (!isMounted) return;
        setProblems(mockProblems);
        setDataSource('mock');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingProblems(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStart = useCallback(() => {
    if (isLoadingProblems) return;
    setGameState('ROULETTE');
  }, [isLoadingProblems]);

  const handleRouletteComplete = useCallback((problem: Problem) => {
    setCurrentProblem(problem);
    setRecentIds((prev) => [problem.id, ...prev].slice(0, MAX_RECENT));
    setGameState('QUESTION');
  }, []);

  const handleAnswer = useCallback(
    (category: AnswerCategory) => {
      if (!currentProblem) return;
      setSelectedCategory(category);
      setSelectedDirection(getDirectionForCategory(category));
      setResultType(judgeResult(category, currentProblem.answerCategory));
      setRevealed(true);
      setGameState('RESULT');
    },
    [currentProblem],
  );

  const handleRestart = useCallback(() => {
    setCurrentProblem(null);
    setSelectedCategory(null);
    setSelectedDirection(null);
    setResultType(null);
    setRevealed(false);
    setQuestionNumber((n) => n + 1);
    setGameState('READY');
  }, []);

  return (
    <div className="app">
      {gameState === 'READY' && (
        <ReadyScreen
          onStart={handleStart}
          isLoading={isLoadingProblems}
          problemCount={problems.length}
          dataSource={dataSource}
        />
      )}

      {gameState === 'ROULETTE' && (
        <RouletteScreen
          problems={problems}
          recentIds={recentIds}
          onComplete={handleRouletteComplete}
        />
      )}

      {gameState === 'QUESTION' && currentProblem && (
        <QuestionScreen
          problem={currentProblem}
          questionNumber={questionNumber}
          onAnswer={handleAnswer}
        />
      )}

      {gameState === 'RESULT' &&
        currentProblem &&
        selectedCategory &&
        selectedDirection &&
        resultType &&
        revealed && (
        <ResultScreen
          problem={currentProblem}
          selectedCategory={selectedCategory}
          selectedDirection={selectedDirection}
          resultType={resultType}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default App;
