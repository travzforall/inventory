import { Injectable, signal, computed } from '@angular/core';
import {
  Quiz,
  QuizQuestion,
  QuizPlayerScore,
  QuizAnswer,
  QuizGameState,
  QuizPhase,
  calculateQuizScore,
  ANSWER_COLORS,
} from '../models/quiz.model';
import { CONTROLLER_COLORS } from '../models/buzzer.model';

// Sample quizzes
const BUILT_IN_QUIZZES: Quiz[] = [
  {
    id: 'general-knowledge',
    title: 'General Knowledge',
    description: 'Test your knowledge with these fun trivia questions!',
    isBuiltIn: true,
    questions: [
      { id: 'gk1', text: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1, timeLimit: 20 },
      { id: 'gk2', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctIndex: 2, timeLimit: 20 },
      { id: 'gk3', text: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3, timeLimit: 20 },
      { id: 'gk4', text: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2, timeLimit: 20 },
      { id: 'gk5', text: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, timeLimit: 20 },
      { id: 'gk6', text: 'Which country has the most people?', options: ['USA', 'India', 'China', 'Russia'], correctIndex: 2, timeLimit: 20 },
      { id: 'gk7', text: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, timeLimit: 20 },
      { id: 'gk8', text: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctIndex: 1, timeLimit: 20 },
      { id: 'gk9', text: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, timeLimit: 20 },
      { id: 'gk10', text: 'Which element has the atomic number 1?', options: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'], correctIndex: 1, timeLimit: 20 },
    ],
  },
  {
    id: 'movies-tv',
    title: 'Movies & TV',
    description: 'How well do you know your movies and TV shows?',
    isBuiltIn: true,
    questions: [
      { id: 'mt1', text: 'Who directed the movie Titanic?', options: ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Martin Scorsese'], correctIndex: 1, timeLimit: 20 },
      { id: 'mt2', text: 'What is the name of the coffee shop in Friends?', options: ['Central Park', 'Central Perk', 'Coffee Central', 'The Coffee House'], correctIndex: 1, timeLimit: 20 },
      { id: 'mt3', text: 'Which movie features the quote "I\'ll be back"?', options: ['Robocop', 'Die Hard', 'The Terminator', 'Predator'], correctIndex: 2, timeLimit: 20 },
      { id: 'mt4', text: 'How many Harry Potter movies are there?', options: ['6', '7', '8', '9'], correctIndex: 2, timeLimit: 20 },
      { id: 'mt5', text: 'Who plays Iron Man in the MCU?', options: ['Chris Evans', 'Chris Hemsworth', 'Robert Downey Jr.', 'Mark Ruffalo'], correctIndex: 2, timeLimit: 20 },
      { id: 'mt6', text: 'What TV show features a chemistry teacher making drugs?', options: ['Ozark', 'Breaking Bad', 'Narcos', 'The Wire'], correctIndex: 1, timeLimit: 20 },
      { id: 'mt7', text: 'What year was the first Star Wars movie released?', options: ['1975', '1977', '1979', '1981'], correctIndex: 1, timeLimit: 20 },
      { id: 'mt8', text: 'Who played The Joker in The Dark Knight?', options: ['Jack Nicholson', 'Jared Leto', 'Heath Ledger', 'Joaquin Phoenix'], correctIndex: 2, timeLimit: 20 },
      { id: 'mt9', text: 'What animated movie features a clownfish named Nemo?', options: ['Shark Tale', 'Finding Nemo', 'The Little Mermaid', 'Moana'], correctIndex: 1, timeLimit: 20 },
      { id: 'mt10', text: 'Which TV show is set in Hawkins, Indiana?', options: ['The X-Files', 'Stranger Things', 'Supernatural', 'Twin Peaks'], correctIndex: 1, timeLimit: 20 },
    ],
  },
  {
    id: 'science',
    title: 'Science & Nature',
    description: 'Explore the wonders of science and nature!',
    isBuiltIn: true,
    questions: [
      { id: 'sc1', text: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctIndex: 2, timeLimit: 20 },
      { id: 'sc2', text: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], correctIndex: 1, timeLimit: 20 },
      { id: 'sc3', text: 'What is the largest mammal in the world?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], correctIndex: 1, timeLimit: 20 },
      { id: 'sc4', text: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, timeLimit: 20 },
      { id: 'sc5', text: 'What is the speed of light (approx)?', options: ['300 km/s', '3,000 km/s', '30,000 km/s', '300,000 km/s'], correctIndex: 3, timeLimit: 20 },
      { id: 'sc6', text: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctIndex: 1, timeLimit: 20 },
      { id: 'sc7', text: 'What is the chemical formula for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctIndex: 0, timeLimit: 20 },
      { id: 'sc8', text: 'Which organ pumps blood through the body?', options: ['Lungs', 'Brain', 'Heart', 'Liver'], correctIndex: 2, timeLimit: 20 },
      { id: 'sc9', text: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], correctIndex: 1, timeLimit: 20 },
      { id: 'sc10', text: 'How long does it take Earth to orbit the Sun?', options: ['30 days', '180 days', '365 days', '400 days'], correctIndex: 2, timeLimit: 20 },
    ],
  },
];

const STORAGE_KEY = 'quiz_custom_quizzes';

@Injectable({ providedIn: 'root' })
export class QuizService {
  // Game state
  private gameState = signal<QuizGameState>({
    quiz: null,
    phase: 'lobby',
    currentQuestionIndex: 0,
    playerScores: [],
    currentAnswers: [],
    questionStartTime: 0,
    timeRemaining: 0,
  });

  readonly state = this.gameState.asReadonly();

  readonly currentQuestion = computed(() => {
    const state = this.gameState();
    if (!state.quiz) return null;
    return state.quiz.questions[state.currentQuestionIndex] ?? null;
  });

  readonly isLastQuestion = computed(() => {
    const state = this.gameState();
    if (!state.quiz) return true;
    return state.currentQuestionIndex >= state.quiz.questions.length - 1;
  });

  readonly sortedScores = computed(() => {
    return [...this.gameState().playerScores].sort((a, b) => b.score - a.score);
  });

  // ============ Quiz Management ============

  /**
   * Get all built-in quizzes
   */
  getBuiltInQuizzes(): Quiz[] {
    return BUILT_IN_QUIZZES;
  }

  /**
   * Get custom quizzes from localStorage
   */
  getCustomQuizzes(): Quiz[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Quiz[];
      }
    } catch (e) {
      console.warn('Failed to load custom quizzes:', e);
    }
    return [];
  }

  /**
   * Get all quizzes (built-in + custom)
   */
  getAllQuizzes(): Quiz[] {
    return [...this.getBuiltInQuizzes(), ...this.getCustomQuizzes()];
  }

  /**
   * Get a quiz by ID
   */
  getQuizById(id: string): Quiz | undefined {
    return this.getAllQuizzes().find(q => q.id === id);
  }

  /**
   * Save a custom quiz
   */
  saveQuiz(quiz: Quiz): void {
    const customQuizzes = this.getCustomQuizzes();
    const existingIndex = customQuizzes.findIndex(q => q.id === quiz.id);

    if (existingIndex >= 0) {
      customQuizzes[existingIndex] = quiz;
    } else {
      customQuizzes.push({ ...quiz, isBuiltIn: false });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuizzes));
  }

  /**
   * Delete a custom quiz
   */
  deleteQuiz(id: string): void {
    const customQuizzes = this.getCustomQuizzes().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customQuizzes));
  }

  // ============ Game Flow ============

  /**
   * Initialize a new game
   */
  initGame(quiz: Quiz, playerCount: number): void {
    const playerScores: QuizPlayerScore[] = [];

    for (let i = 0; i < playerCount; i++) {
      playerScores.push({
        controllerId: i,
        name: CONTROLLER_COLORS[i]?.name ?? `Player ${i + 1}`,
        color: CONTROLLER_COLORS[i]?.color ?? '#888',
        score: 0,
        streak: 0,
        correctCount: 0,
      });
    }

    this.gameState.set({
      quiz,
      phase: 'lobby',
      currentQuestionIndex: 0,
      playerScores,
      currentAnswers: [],
      questionStartTime: 0,
      timeRemaining: 0,
    });
  }

  /**
   * Update player name
   */
  updatePlayerName(controllerId: number, name: string): void {
    this.gameState.update(state => ({
      ...state,
      playerScores: state.playerScores.map(p =>
        p.controllerId === controllerId ? { ...p, name } : p
      ),
    }));
  }

  /**
   * Set game phase
   */
  setPhase(phase: QuizPhase): void {
    this.gameState.update(state => ({ ...state, phase }));
  }

  /**
   * Start the question (show question, then enable answering)
   */
  startQuestion(): void {
    const question = this.currentQuestion();
    if (!question) return;

    this.gameState.update(state => ({
      ...state,
      phase: 'get-ready',
      currentAnswers: [],
      timeRemaining: question.timeLimit,
    }));
  }

  /**
   * Begin the answering phase
   */
  startAnswering(): void {
    this.gameState.update(state => ({
      ...state,
      phase: 'answering',
      questionStartTime: Date.now(),
    }));
  }

  /**
   * Record a player's answer
   */
  recordAnswer(controllerId: number, answerIndex: number): boolean {
    const state = this.gameState();

    // Check if player already answered
    if (state.currentAnswers.some(a => a.controllerId === controllerId)) {
      return false;
    }

    // Check if valid answer index
    if (answerIndex < 0 || answerIndex > 3) {
      return false;
    }

    const timeMs = Date.now() - state.questionStartTime;
    const question = this.currentQuestion();
    const isCorrect = question ? answerIndex === question.correctIndex : false;

    const answer: QuizAnswer = {
      controllerId,
      answerIndex,
      timeMs,
      isCorrect,
    };

    this.gameState.update(s => ({
      ...s,
      currentAnswers: [...s.currentAnswers, answer],
    }));

    return true;
  }

  /**
   * Check if all players have answered
   */
  allPlayersAnswered(): boolean {
    const state = this.gameState();
    return state.currentAnswers.length >= state.playerScores.length;
  }

  /**
   * Update time remaining
   */
  updateTimeRemaining(time: number): void {
    this.gameState.update(state => ({ ...state, timeRemaining: time }));
  }

  /**
   * End the current question and calculate scores
   */
  endQuestion(): void {
    const state = this.gameState();
    const question = this.currentQuestion();
    if (!question) return;

    const timeLimitMs = question.timeLimit * 1000;

    // Calculate scores for each player
    const updatedScores = state.playerScores.map(player => {
      const answer = state.currentAnswers.find(a => a.controllerId === player.controllerId);

      if (!answer) {
        // No answer - reset streak
        return { ...player, streak: 0 };
      }

      if (answer.isCorrect) {
        // Correct answer - add points
        const points = calculateQuizScore(answer.timeMs, timeLimitMs, player.streak);
        return {
          ...player,
          score: player.score + points,
          streak: player.streak + 1,
          correctCount: player.correctCount + 1,
        };
      } else {
        // Wrong answer - reset streak
        return { ...player, streak: 0 };
      }
    });

    this.gameState.update(s => ({
      ...s,
      phase: 'results',
      playerScores: updatedScores,
    }));
  }

  /**
   * Move to next question or finish game
   */
  nextQuestion(): void {
    const state = this.gameState();

    if (this.isLastQuestion()) {
      this.gameState.update(s => ({ ...s, phase: 'finished' }));
    } else {
      this.gameState.update(s => ({
        ...s,
        currentQuestionIndex: s.currentQuestionIndex + 1,
        currentAnswers: [],
        phase: 'get-ready',
      }));
    }
  }

  /**
   * Show leaderboard
   */
  showLeaderboard(): void {
    this.setPhase('leaderboard');
  }

  /**
   * Get the winner (highest score)
   */
  getWinner(): QuizPlayerScore | null {
    const sorted = this.sortedScores();
    return sorted.length > 0 ? sorted[0] : null;
  }

  /**
   * Reset the game
   */
  resetGame(): void {
    this.gameState.update(state => ({
      ...state,
      phase: 'lobby',
      currentQuestionIndex: 0,
      currentAnswers: [],
      playerScores: state.playerScores.map(p => ({
        ...p,
        score: 0,
        streak: 0,
        correctCount: 0,
      })),
    }));
  }

  /**
   * Get answer color info
   */
  getAnswerColor(index: number) {
    return ANSWER_COLORS[index] ?? ANSWER_COLORS[0];
  }
}
