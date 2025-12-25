import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BuzzerService, QuizService } from '../../../core/services';
import { BuzzerEvent, ANSWER_BUTTONS, ANSWER_COLORS, CONTROLLER_COLORS } from '../../../core/models';

@Component({
  selector: 'app-quiz-game',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <!-- Get Ready Phase -->
      @if (quizService.state().phase === 'get-ready') {
        <div class="flex flex-col items-center justify-center min-h-screen p-4">
          <div class="text-center">
            <p class="text-2xl mb-4 opacity-70">Question {{ quizService.state().currentQuestionIndex + 1 }} of {{ quizService.state().quiz?.questions?.length }}</p>
            <h1 class="text-6xl font-bold mb-8 animate-pulse">Get Ready!</h1>
            <div class="text-9xl">{{ countdownValue() }}</div>
          </div>
        </div>
      }

      <!-- Question/Answering Phase -->
      @if (quizService.state().phase === 'answering') {
        <div class="flex flex-col min-h-screen">
          <!-- Header -->
          <div class="bg-black/30 p-4">
            <div class="container mx-auto flex justify-between items-center">
              <span class="text-lg">Question {{ quizService.state().currentQuestionIndex + 1 }} / {{ quizService.state().quiz?.questions?.length }}</span>
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-3xl font-bold tabular-nums" [class.text-red-400]="quizService.state().timeRemaining <= 5">
                  {{ quizService.state().timeRemaining }}
                </span>
              </div>
            </div>
            <!-- Timer Bar -->
            <div class="w-full bg-white/20 h-2 mt-2 rounded-full overflow-hidden">
              <div
                class="h-full bg-white transition-all duration-1000 ease-linear"
                [style.width.%]="(quizService.state().timeRemaining / (quizService.currentQuestion()?.timeLimit || 20)) * 100"
              ></div>
            </div>
          </div>

          <!-- Question -->
          <div class="flex-1 flex flex-col items-center justify-center p-8">
            <h1 class="text-4xl md:text-5xl font-bold text-center mb-12 max-w-4xl">
              {{ quizService.currentQuestion()?.text }}
            </h1>

            <!-- Answer Options -->
            <div class="grid grid-cols-2 gap-4 w-full max-w-4xl">
              @for (option of quizService.currentQuestion()?.options; track $index; let i = $index) {
                <div
                  class="p-6 rounded-xl text-xl font-semibold flex items-center gap-4 transition-transform hover:scale-102"
                  [style.background-color]="getAnswerColor(i).color"
                >
                  <span class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {{ getAnswerColor(i).label }}
                  </span>
                  <span class="flex-1">{{ option }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Player Status -->
          <div class="bg-black/30 p-4">
            <div class="container mx-auto flex justify-center gap-4">
              @for (player of quizService.state().playerScores; track player.controllerId) {
                <div class="flex items-center gap-2 px-4 py-2 rounded-full" [style.background-color]="player.color + '40'">
                  <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" [style.background-color]="player.color">
                    {{ player.name[0] }}
                  </span>
                  <span>{{ player.name }}</span>
                  @if (hasPlayerAnswered(player.controllerId)) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  } @else {
                    <span class="loading loading-dots loading-xs"></span>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Results Phase -->
      @if (quizService.state().phase === 'results') {
        <div class="flex flex-col min-h-screen">
          <!-- Header -->
          <div class="bg-black/30 p-4">
            <div class="container mx-auto text-center">
              <h2 class="text-2xl font-bold">Results</h2>
            </div>
          </div>

          <!-- Question & Correct Answer -->
          <div class="flex-1 flex flex-col items-center justify-center p-8">
            <h1 class="text-3xl font-bold text-center mb-8 max-w-4xl opacity-70">
              {{ quizService.currentQuestion()?.text }}
            </h1>

            <!-- Show all answers with correct highlighted -->
            <div class="grid grid-cols-2 gap-4 w-full max-w-4xl mb-8">
              @for (option of quizService.currentQuestion()?.options; track $index; let i = $index) {
                <div
                  class="p-6 rounded-xl text-xl font-semibold flex items-center gap-4 transition-all"
                  [class.ring-4]="i === quizService.currentQuestion()?.correctIndex"
                  [class.ring-white]="i === quizService.currentQuestion()?.correctIndex"
                  [class.scale-105]="i === quizService.currentQuestion()?.correctIndex"
                  [class.opacity-50]="i !== quizService.currentQuestion()?.correctIndex"
                  [style.background-color]="getAnswerColor(i).color"
                >
                  <span class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    @if (i === quizService.currentQuestion()?.correctIndex) {
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    } @else {
                      {{ getAnswerColor(i).label }}
                    }
                  </span>
                  <span class="flex-1">{{ option }}</span>
                </div>
              }
            </div>

            <!-- Player Results -->
            <div class="flex flex-wrap justify-center gap-4">
              @for (player of quizService.state().playerScores; track player.controllerId) {
                @let answer = getPlayerAnswer(player.controllerId);
                <div
                  class="px-6 py-4 rounded-xl flex items-center gap-3"
                  [class.bg-green-500/30]="answer?.isCorrect"
                  [class.bg-red-500/30]="answer && !answer.isCorrect"
                  [class.bg-gray-500/30]="!answer"
                >
                  <span class="w-10 h-10 rounded-full flex items-center justify-center font-bold" [style.background-color]="player.color">
                    {{ player.name[0] }}
                  </span>
                  <div>
                    <div class="font-semibold">{{ player.name }}</div>
                    <div class="text-sm opacity-70">
                      @if (answer?.isCorrect) {
                        +{{ getPointsEarned(player.controllerId) }} points
                      } @else if (answer) {
                        Wrong answer
                      } @else {
                        No answer
                      }
                    </div>
                  </div>
                  @if (answer?.isCorrect) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  } @else if (answer) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Continue Button -->
          <div class="bg-black/30 p-4">
            <div class="container mx-auto flex justify-center">
              <button class="btn btn-primary btn-lg" (click)="continueGame()">
                @if (quizService.isLastQuestion()) {
                  See Final Results
                } @else {
                  Next Question
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Leaderboard Phase -->
      @if (quizService.state().phase === 'leaderboard') {
        <div class="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 class="text-4xl font-bold mb-8">Leaderboard</h1>

          <div class="w-full max-w-md space-y-4">
            @for (player of quizService.sortedScores(); track player.controllerId; let i = $index) {
              <div
                class="flex items-center gap-4 p-4 rounded-xl transition-all"
                [class.bg-yellow-500/30]="i === 0"
                [class.scale-105]="i === 0"
                [class.bg-white/10]="i !== 0"
              >
                <span class="text-3xl font-bold w-10">{{ i + 1 }}</span>
                <span class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold" [style.background-color]="player.color">
                  {{ player.name[0] }}
                </span>
                <div class="flex-1">
                  <div class="font-semibold text-lg">{{ player.name }}</div>
                  <div class="text-sm opacity-70">{{ player.correctCount }} correct</div>
                </div>
                <span class="text-2xl font-bold">{{ player.score }}</span>
              </div>
            }
          </div>

          <button class="btn btn-primary btn-lg mt-8" (click)="continueFromLeaderboard()">
            Continue
          </button>
        </div>
      }

      <!-- Finished Phase -->
      @if (quizService.state().phase === 'finished') {
        <div class="flex flex-col items-center justify-center min-h-screen p-8">
          <div class="text-8xl mb-4">🏆</div>
          <h1 class="text-5xl font-bold mb-2">Game Over!</h1>

          @if (quizService.getWinner(); as winner) {
            <div class="text-center mt-8">
              <div class="text-2xl opacity-70 mb-2">Winner</div>
              <div
                class="text-6xl font-bold px-8 py-4 rounded-xl"
                [style.background-color]="winner.color + '40'"
                [style.color]="winner.color"
              >
                {{ winner.name }}
              </div>
              <div class="text-3xl mt-4">{{ winner.score }} points</div>
            </div>
          }

          <div class="w-full max-w-md mt-12 space-y-3">
            <h2 class="text-xl font-semibold text-center mb-4">Final Standings</h2>
            @for (player of quizService.sortedScores(); track player.controllerId; let i = $index) {
              <div class="flex items-center gap-4 p-3 rounded-lg bg-white/10">
                <span class="text-xl font-bold w-8">{{ i + 1 }}</span>
                <span class="w-10 h-10 rounded-full flex items-center justify-center font-bold" [style.background-color]="player.color">
                  {{ player.name[0] }}
                </span>
                <span class="flex-1 font-medium">{{ player.name }}</span>
                <span class="font-bold">{{ player.score }}</span>
              </div>
            }
          </div>

          <div class="flex gap-4 mt-12">
            <button class="btn btn-primary btn-lg" (click)="playAgain()">
              Play Again
            </button>
            <a routerLink="/buzzer/quiz" class="btn btn-outline btn-lg">
              Back to Lobby
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class QuizGameComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  buzzerService = inject(BuzzerService);
  quizService = inject(QuizService);

  countdownValue = signal(3);
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private previousScores: Map<number, number> = new Map();

  ngOnInit(): void {
    // Check if we have a quiz selected
    if (!this.quizService.state().quiz) {
      this.router.navigate(['/buzzer/quiz']);
      return;
    }

    // Register buzz handler
    this.buzzerService.onBuzz((event) => this.handleBuzz(event));

    // Save initial scores for calculating points earned
    this.saveCurrentScores();

    // Start the game
    this.startQuestion();
  }

  ngOnDestroy(): void {
    this.buzzerService.clearBuzzCallback();
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private saveCurrentScores(): void {
    this.previousScores.clear();
    for (const player of this.quizService.state().playerScores) {
      this.previousScores.set(player.controllerId, player.score);
    }
  }

  startQuestion(): void {
    this.saveCurrentScores();
    this.quizService.startQuestion();

    // Countdown before showing answers
    this.countdownValue.set(3);
    this.countdownInterval = setInterval(() => {
      const val = this.countdownValue();
      if (val <= 1) {
        this.clearTimers();
        this.startAnswering();
      } else {
        this.countdownValue.set(val - 1);
      }
    }, 1000);
  }

  startAnswering(): void {
    this.quizService.startAnswering();

    const question = this.quizService.currentQuestion();
    if (!question) return;

    // Start the answer timer
    this.quizService.updateTimeRemaining(question.timeLimit);

    this.timerInterval = setInterval(() => {
      const remaining = this.quizService.state().timeRemaining;
      if (remaining <= 1 || this.quizService.allPlayersAnswered()) {
        this.clearTimers();
        this.endQuestion();
      } else {
        this.quizService.updateTimeRemaining(remaining - 1);
      }
    }, 1000);
  }

  handleBuzz(event: BuzzerEvent): void {
    // Only handle during answering phase
    if (this.quizService.state().phase !== 'answering') return;

    // Map button to answer index
    const answerIndex = ANSWER_BUTTONS[event.button];
    if (answerIndex === undefined) return; // Red button or invalid

    // Record the answer
    const recorded = this.quizService.recordAnswer(event.controllerId, answerIndex);

    if (recorded) {
      // Flash the player's light
      this.buzzerService.flashLight(event.controllerId, 200);

      // Check if all players have answered
      if (this.quizService.allPlayersAnswered()) {
        this.clearTimers();
        setTimeout(() => this.endQuestion(), 500);
      }
    }
  }

  endQuestion(): void {
    this.quizService.endQuestion();
  }

  continueGame(): void {
    const state = this.quizService.state();

    // Show leaderboard every 3 questions (except at the end)
    if (!this.quizService.isLastQuestion() && (state.currentQuestionIndex + 1) % 3 === 0) {
      this.quizService.showLeaderboard();
    } else {
      this.goToNextQuestion();
    }
  }

  continueFromLeaderboard(): void {
    this.goToNextQuestion();
  }

  goToNextQuestion(): void {
    this.quizService.nextQuestion();

    if (this.quizService.state().phase !== 'finished') {
      this.startQuestion();
    } else {
      // Flash winner's light
      const winner = this.quizService.getWinner();
      if (winner) {
        this.buzzerService.flashWinner(winner.controllerId);
      }
    }
  }

  playAgain(): void {
    this.quizService.resetGame();
    this.startQuestion();
  }

  hasPlayerAnswered(controllerId: number): boolean {
    return this.quizService.state().currentAnswers.some(a => a.controllerId === controllerId);
  }

  getPlayerAnswer(controllerId: number) {
    return this.quizService.state().currentAnswers.find(a => a.controllerId === controllerId);
  }

  getPointsEarned(controllerId: number): number {
    const player = this.quizService.state().playerScores.find(p => p.controllerId === controllerId);
    const previousScore = this.previousScores.get(controllerId) ?? 0;
    return player ? player.score - previousScore : 0;
  }

  getAnswerColor(index: number) {
    return ANSWER_COLORS[index] ?? ANSWER_COLORS[0];
  }
}
