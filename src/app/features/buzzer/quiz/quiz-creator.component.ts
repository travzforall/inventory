import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuizService } from '../../../core/services';
import { Quiz, QuizQuestion, ANSWER_COLORS } from '../../../core/models';

@Component({
  selector: 'app-quiz-creator',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="navbar-start">
          <a routerLink="/buzzer/quiz" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
        <div class="navbar-center">
          <h1 class="text-xl font-bold">{{ isEditing() ? 'Edit Quiz' : 'Create Quiz' }}</h1>
        </div>
        <div class="navbar-end">
          <button class="btn btn-primary" (click)="saveQuiz()" [disabled]="!isValid()">
            Save Quiz
          </button>
        </div>
      </div>

      <div class="container mx-auto p-4 space-y-6">
        <!-- Quiz Details -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quiz Details</h2>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Quiz Title *</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Movie Trivia"
                [(ngModel)]="quizTitle"
                class="input input-bordered"
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                placeholder="e.g., Test your knowledge of classic movies!"
                [(ngModel)]="quizDescription"
                class="textarea textarea-bordered"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Questions ({{ questions().length }})</h2>
              <button class="btn btn-primary btn-sm" (click)="addQuestion()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Question
              </button>
            </div>

            @if (questions().length === 0) {
              <div class="text-center py-8 text-base-content/60">
                <p>No questions yet. Add your first question to get started!</p>
              </div>
            }

            <div class="space-y-6 mt-4">
              @for (question of questions(); track question.id; let i = $index) {
                <div class="card bg-base-200">
                  <div class="card-body">
                    <div class="flex justify-between items-start">
                      <h3 class="font-bold text-lg">Question {{ i + 1 }}</h3>
                      <div class="flex gap-2">
                        @if (i > 0) {
                          <button class="btn btn-ghost btn-xs btn-circle" (click)="moveQuestion(i, -1)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        }
                        @if (i < questions().length - 1) {
                          <button class="btn btn-ghost btn-xs btn-circle" (click)="moveQuestion(i, 1)">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        }
                        <button class="btn btn-ghost btn-xs btn-circle text-error" (click)="removeQuestion(i)">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Question Text -->
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Question *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your question..."
                        [(ngModel)]="question.text"
                        class="input input-bordered"
                      />
                    </div>

                    <!-- Answer Options -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      @for (opt of [0, 1, 2, 3]; track opt) {
                        <div class="form-control">
                          <label class="label">
                            <span class="label-text flex items-center gap-2">
                              <span
                                class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                [style.background-color]="getAnswerColor(opt).color"
                              >
                                {{ getAnswerColor(opt).label }}
                              </span>
                              Option {{ getAnswerColor(opt).label }} *
                            </span>
                            <span class="label-text-alt">
                              <label class="cursor-pointer flex items-center gap-1">
                                <input
                                  type="radio"
                                  [name]="'correct-' + question.id"
                                  [checked]="question.correctIndex === opt"
                                  (change)="setCorrectAnswer(i, opt)"
                                  class="radio radio-success radio-xs"
                                />
                                <span class="text-xs">Correct</span>
                              </label>
                            </span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter answer option..."
                            [(ngModel)]="question.options[opt]"
                            class="input input-bordered"
                            [class.input-success]="question.correctIndex === opt"
                          />
                        </div>
                      }
                    </div>

                    <!-- Time Limit -->
                    <div class="form-control mt-4">
                      <label class="label">
                        <span class="label-text">Time Limit (seconds)</span>
                      </label>
                      <div class="flex items-center gap-4">
                        <input
                          type="range"
                          min="10"
                          max="60"
                          [(ngModel)]="question.timeLimit"
                          class="range range-sm flex-1"
                        />
                        <span class="badge badge-lg">{{ question.timeLimit }}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (questions().length > 0) {
              <div class="flex justify-center mt-4">
                <button class="btn btn-outline" (click)="addQuestion()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Question
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Validation Summary -->
        @if (!isValid() && questions().length > 0) {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 class="font-bold">Please fix the following:</h3>
              <ul class="list-disc list-inside text-sm mt-1">
                @if (!quizTitle.trim()) {
                  <li>Quiz title is required</li>
                }
                @for (question of questions(); track question.id; let i = $index) {
                  @if (!question.text.trim()) {
                    <li>Question {{ i + 1 }} needs a question text</li>
                  }
                  @for (opt of [0, 1, 2, 3]; track opt) {
                    @if (!question.options[opt]?.trim()) {
                      <li>Question {{ i + 1 }} needs option {{ getAnswerColor(opt).label }}</li>
                    }
                  }
                }
              </ul>
            </div>
          </div>
        }

        <!-- Actions -->
        <div class="flex justify-between">
          <a routerLink="/buzzer/quiz" class="btn btn-ghost">Cancel</a>
          <button class="btn btn-primary" (click)="saveQuiz()" [disabled]="!isValid()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Save Quiz
          </button>
        </div>
      </div>
    </div>
  `,
})
export class QuizCreatorComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);

  quizId = '';
  quizTitle = '';
  quizDescription = '';
  questions = signal<QuizQuestion[]>([]);
  isEditing = signal(false);

  ngOnInit(): void {
    // Check if editing existing quiz
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const quiz = this.quizService.getQuizById(id);
      if (quiz && !quiz.isBuiltIn) {
        this.quizId = quiz.id;
        this.quizTitle = quiz.title;
        this.quizDescription = quiz.description;
        this.questions.set([...quiz.questions]);
        this.isEditing.set(true);
      } else {
        // Quiz not found or is built-in, redirect
        this.router.navigate(['/buzzer/quiz']);
      }
    } else {
      // New quiz - add initial question
      this.addQuestion();
    }
  }

  addQuestion(): void {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      timeLimit: 20,
    };
    this.questions.update(q => [...q, newQuestion]);
  }

  removeQuestion(index: number): void {
    if (this.questions().length > 1 || confirm('Remove the only question?')) {
      this.questions.update(q => q.filter((_, i) => i !== index));
    }
  }

  moveQuestion(index: number, direction: -1 | 1): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.questions().length) return;

    this.questions.update(q => {
      const arr = [...q];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  }

  setCorrectAnswer(questionIndex: number, answerIndex: number): void {
    this.questions.update(q => {
      const arr = [...q];
      arr[questionIndex] = { ...arr[questionIndex], correctIndex: answerIndex };
      return arr;
    });
  }

  getAnswerColor(index: number) {
    return ANSWER_COLORS[index] ?? ANSWER_COLORS[0];
  }

  isValid(): boolean {
    if (!this.quizTitle.trim()) return false;
    if (this.questions().length === 0) return false;

    for (const q of this.questions()) {
      if (!q.text.trim()) return false;
      for (const opt of q.options) {
        if (!opt?.trim()) return false;
      }
    }

    return true;
  }

  saveQuiz(): void {
    if (!this.isValid()) return;

    const quiz: Quiz = {
      id: this.quizId || crypto.randomUUID(),
      title: this.quizTitle.trim(),
      description: this.quizDescription.trim(),
      questions: this.questions(),
      isBuiltIn: false,
    };

    this.quizService.saveQuiz(quiz);
    this.router.navigate(['/buzzer/quiz']);
  }
}
