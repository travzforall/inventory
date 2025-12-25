/**
 * Quiz Game Models
 * Kahoot-style multiplayer quiz using PS Buzz controllers
 */

export interface QuizQuestion {
  id: string;
  text: string;
  options: [string, string, string, string]; // Exactly 4 options
  correctIndex: number; // 0-3
  timeLimit: number; // seconds (default 20)
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  isBuiltIn: boolean; // true for sample quizzes, false for custom
}

export interface QuizPlayerScore {
  controllerId: number;
  name: string;
  color: string;
  score: number;
  streak: number; // consecutive correct answers
  correctCount: number;
}

export interface QuizAnswer {
  controllerId: number;
  answerIndex: number; // 0-3, or -1 if no answer
  timeMs: number; // time taken to answer in milliseconds
  isCorrect: boolean;
}

export type QuizPhase = 'lobby' | 'get-ready' | 'question' | 'answering' | 'results' | 'leaderboard' | 'finished';

export interface QuizGameState {
  quiz: Quiz | null;
  phase: QuizPhase;
  currentQuestionIndex: number;
  playerScores: QuizPlayerScore[];
  currentAnswers: QuizAnswer[];
  questionStartTime: number; // timestamp when answering started
  timeRemaining: number; // seconds remaining
}

// Button to answer mapping
export const ANSWER_BUTTONS: Record<string, number> = {
  blue: 0,   // A
  orange: 1, // B
  green: 2,  // C
  yellow: 3, // D
};

// Answer colors matching controller buttons
export const ANSWER_COLORS = [
  { index: 0, label: 'A', color: '#3B82F6', bgClass: 'bg-blue-500', name: 'Blue' },
  { index: 1, label: 'B', color: '#F97316', bgClass: 'bg-orange-500', name: 'Orange' },
  { index: 2, label: 'C', color: '#22C55E', bgClass: 'bg-green-500', name: 'Green' },
  { index: 3, label: 'D', color: '#EAB308', bgClass: 'bg-yellow-500', name: 'Yellow' },
];

// Scoring constants (Kahoot-style)
export const QUIZ_SCORING = {
  BASE_POINTS: 1000,
  TIME_BONUS_MAX: 500,
  STREAK_BONUS: 100,
  MAX_STREAK_BONUS: 500,
};

/**
 * Calculate score for a correct answer based on response time
 */
export function calculateQuizScore(timeMs: number, timeLimitMs: number, streak: number): number {
  if (timeMs < 0) return 0; // No answer

  const timeRatio = Math.max(0, (timeLimitMs - timeMs) / timeLimitMs);
  const timeBonus = Math.round(QUIZ_SCORING.TIME_BONUS_MAX * timeRatio);
  const streakBonus = Math.min(streak * QUIZ_SCORING.STREAK_BONUS, QUIZ_SCORING.MAX_STREAK_BONUS);

  return QUIZ_SCORING.BASE_POINTS + timeBonus + streakBonus;
}
