import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BuzzerService, QuizService } from '../../../core/services';
import { Quiz, CONTROLLER_COLORS } from '../../../core/models';

@Component({
  selector: 'app-quiz-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="navbar-start">
          <a routerLink="/buzzer" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
        <div class="navbar-center">
          <h1 class="text-xl font-bold">Quiz Game</h1>
        </div>
        <div class="navbar-end">
          <div class="badge" [class.badge-success]="buzzerService.isConnected()" [class.badge-error]="!buzzerService.isConnected()">
            {{ buzzerService.isConnected() ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </div>

      <div class="container mx-auto p-4 space-y-6">
        <!-- Controller Warning -->
        @if (!buzzerService.isConnected()) {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Connect your PS Buzz controller to play with buzzer buttons.</span>
            <a routerLink="/buzzer" class="btn btn-sm">Connect</a>
          </div>
        }

        <!-- Game Setup -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Game Setup</h2>

            <!-- Player Count -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Number of Players</span>
              </label>
              <div class="join">
                @for (num of [2, 3, 4]; track num) {
                  <button
                    class="btn join-item"
                    [class.btn-primary]="playerCount() === num"
                    (click)="setPlayerCount(num)"
                  >
                    {{ num }} Players
                  </button>
                }
              </div>
            </div>

            <!-- Player Names -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              @for (i of getPlayerIndices(); track i) {
                <div class="form-control">
                  <label class="label">
                    <span class="label-text flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full" [style.background-color]="getPlayerColor(i)"></span>
                      Player {{ i + 1 }}
                    </span>
                  </label>
                  <input
                    type="text"
                    [placeholder]="'Player ' + (i + 1)"
                    [value]="playerNames()[i]"
                    (input)="updatePlayerName(i, $event)"
                    class="input input-bordered input-sm"
                  />
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Quiz Selection -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Select a Quiz</h2>
              <a routerLink="/buzzer/quiz/create" class="btn btn-outline btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Quiz
              </a>
            </div>

            <!-- Built-in Quizzes -->
            <h3 class="font-semibold mt-4 text-base-content/70">Built-in Quizzes</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (quiz of builtInQuizzes; track quiz.id) {
                <div
                  class="card cursor-pointer transition-all"
                  [class.ring-2]="selectedQuiz()?.id === quiz.id"
                  [class.ring-primary]="selectedQuiz()?.id === quiz.id"
                  [class.bg-base-200]="selectedQuiz()?.id !== quiz.id"
                  [class.bg-primary]="selectedQuiz()?.id === quiz.id"
                  [class.text-primary-content]="selectedQuiz()?.id === quiz.id"
                  (click)="selectQuiz(quiz)"
                >
                  <div class="card-body p-4">
                    <h3 class="card-title text-lg">{{ quiz.title }}</h3>
                    <p class="text-sm opacity-70">{{ quiz.description }}</p>
                    <div class="badge badge-ghost">{{ quiz.questions.length }} questions</div>
                  </div>
                </div>
              }
            </div>

            <!-- Custom Quizzes -->
            @if (customQuizzes.length > 0) {
              <h3 class="font-semibold mt-6 text-base-content/70">Your Quizzes</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                @for (quiz of customQuizzes; track quiz.id) {
                  <div
                    class="card cursor-pointer transition-all"
                    [class.ring-2]="selectedQuiz()?.id === quiz.id"
                    [class.ring-primary]="selectedQuiz()?.id === quiz.id"
                    [class.bg-base-200]="selectedQuiz()?.id !== quiz.id"
                    [class.bg-primary]="selectedQuiz()?.id === quiz.id"
                    [class.text-primary-content]="selectedQuiz()?.id === quiz.id"
                    (click)="selectQuiz(quiz)"
                  >
                    <div class="card-body p-4">
                      <div class="flex justify-between items-start">
                        <h3 class="card-title text-lg">{{ quiz.title }}</h3>
                        <div class="dropdown dropdown-end" (click)="$event.stopPropagation()">
                          <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </label>
                          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-base-content">
                            <li><a [routerLink]="['/buzzer/quiz/edit', quiz.id]">Edit</a></li>
                            <li><a class="text-error" (click)="deleteQuiz(quiz.id)">Delete</a></li>
                          </ul>
                        </div>
                      </div>
                      <p class="text-sm opacity-70">{{ quiz.description }}</p>
                      <div class="badge badge-ghost">{{ quiz.questions.length }} questions</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Start Game -->
        <div class="flex justify-center">
          <button
            class="btn btn-primary btn-lg"
            [disabled]="!selectedQuiz()"
            (click)="startGame()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Quiz
          </button>
        </div>

        <!-- How to Play -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">How to Play</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-blue-500 mx-auto flex items-center justify-center text-white font-bold text-xl">A</div>
                <p class="mt-2 text-sm">Blue Button</p>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-orange-500 mx-auto flex items-center justify-center text-white font-bold text-xl">B</div>
                <p class="mt-2 text-sm">Orange Button</p>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-green-500 mx-auto flex items-center justify-center text-white font-bold text-xl">C</div>
                <p class="mt-2 text-sm">Green Button</p>
              </div>
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-yellow-500 mx-auto flex items-center justify-center text-white font-bold text-xl">D</div>
                <p class="mt-2 text-sm">Yellow Button</p>
              </div>
            </div>
            <p class="text-center text-base-content/70 mt-4">
              Press the colored button that matches your answer. Answer quickly for bonus points!
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class QuizLobbyComponent implements OnInit {
  private router = inject(Router);
  buzzerService = inject(BuzzerService);
  quizService = inject(QuizService);

  playerCount = signal(4);
  playerNames = signal<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  selectedQuiz = signal<Quiz | null>(null);

  builtInQuizzes: Quiz[] = [];
  customQuizzes: Quiz[] = [];

  ngOnInit(): void {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.builtInQuizzes = this.quizService.getBuiltInQuizzes();
    this.customQuizzes = this.quizService.getCustomQuizzes();

    // Auto-select first quiz
    if (this.builtInQuizzes.length > 0 && !this.selectedQuiz()) {
      this.selectedQuiz.set(this.builtInQuizzes[0]);
    }
  }

  setPlayerCount(count: number): void {
    this.playerCount.set(count);
  }

  getPlayerIndices(): number[] {
    return Array.from({ length: this.playerCount() }, (_, i) => i);
  }

  getPlayerColor(index: number): string {
    return CONTROLLER_COLORS[index]?.color ?? '#888';
  }

  updatePlayerName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.playerNames.update(names => {
      const updated = [...names];
      updated[index] = value || `Player ${index + 1}`;
      return updated;
    });
  }

  selectQuiz(quiz: Quiz): void {
    this.selectedQuiz.set(quiz);
  }

  deleteQuiz(id: string): void {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.quizService.deleteQuiz(id);
      this.loadQuizzes();
      if (this.selectedQuiz()?.id === id) {
        this.selectedQuiz.set(this.builtInQuizzes[0] ?? null);
      }
    }
  }

  startGame(): void {
    const quiz = this.selectedQuiz();
    if (!quiz) return;

    // Initialize game
    this.quizService.initGame(quiz, this.playerCount());

    // Set player names
    this.playerNames().forEach((name, i) => {
      if (i < this.playerCount()) {
        this.quizService.updatePlayerName(i, name);
      }
    });

    // Navigate to game
    this.router.navigate(['/buzzer/quiz/play']);
  }
}
