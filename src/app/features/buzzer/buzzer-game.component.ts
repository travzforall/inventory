import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BuzzerService } from '../../core/services';
import { BuzzerEvent, BuzzerGameConfig, CONTROLLER_COLORS } from '../../core/models';

@Component({
  selector: 'app-buzzer-game',
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
          <h1 class="text-xl font-bold">{{ getModeTitle() }}</h1>
        </div>
        <div class="navbar-end">
          <div class="badge" [class.badge-success]="buzzerService.isConnected()" [class.badge-error]="!buzzerService.isConnected()">
            {{ buzzerService.isConnected() ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </div>

      <div class="container mx-auto p-4 space-y-6">
        <!-- Not Connected Warning -->
        @if (!buzzerService.isConnected()) {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No controller connected. Go back to connect your PS Buzz.</span>
            <a routerLink="/buzzer" class="btn btn-sm">Connect</a>
          </div>
        }

        <!-- Setup Phase -->
        @if (!gameStarted()) {
          <div class="card bg-base-100 shadow-xl max-w-md mx-auto">
            <div class="card-body">
              <h2 class="card-title">Game Setup</h2>

              <!-- Number of Players -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Number of Players</span>
                </label>
                <div class="join">
                  @for (num of [2, 3, 4]; track num) {
                    <button
                      class="btn join-item"
                      [class.btn-primary]="config().numberOfPlayers === num"
                      (click)="setPlayerCount(num)"
                    >
                      {{ num }}
                    </button>
                  }
                </div>
              </div>

              <!-- Rounds to Win -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Rounds to Win</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  [value]="config().roundsToWin"
                  (input)="setRoundsToWin($event)"
                  class="range range-primary"
                />
                <div class="text-center font-bold text-lg mt-2">{{ config().roundsToWin }}</div>
              </div>

              <!-- Player Names -->
              <div class="divider">Player Names</div>
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
                    class="input input-bordered"
                  />
                </div>
              }

              <!-- Sound Toggle -->
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Sound Effects</span>
                  <input
                    type="checkbox"
                    [checked]="config().soundEnabled"
                    (change)="toggleSound()"
                    class="toggle toggle-primary"
                  />
                </label>
              </div>

              <div class="card-actions justify-center mt-4">
                <button class="btn btn-primary btn-lg" (click)="startGame()" [disabled]="!buzzerService.isConnected()">
                  Start Game
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Game In Progress -->
        @if (gameStarted() && !buzzerService.game().winner) {
          <!-- Waiting for Buzz -->
          @if (waitingForBuzz()) {
            <div class="text-center py-12">
              <div class="text-6xl mb-4 animate-pulse">🔔</div>
              <h2 class="text-3xl font-bold mb-2">Waiting for Buzz!</h2>
              <p class="text-base-content/60">First player to press their buzzer wins the round</p>
            </div>
          }

          <!-- Someone Buzzed -->
          @if (currentBuzz()) {
            <div class="text-center py-8">
              <div class="text-6xl mb-4">🎉</div>
              <h2 class="text-4xl font-bold mb-2" [style.color]="getPlayerColor(currentBuzz()!.controllerId)">
                {{ getPlayerName(currentBuzz()!.controllerId) }}
              </h2>
              <p class="text-xl">buzzed first!</p>

              <div class="flex justify-center gap-4 mt-8">
                <button class="btn btn-success btn-lg" (click)="awardPoint()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Correct
                </button>
                <button class="btn btn-error btn-lg" (click)="wrongAnswer()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Wrong
                </button>
              </div>
            </div>
          }

          <!-- Scoreboard -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">
                Scoreboard
                <span class="text-sm text-base-content/60 ml-auto">
                  First to {{ buzzerService.game().totalRounds }}
                </span>
              </h2>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (player of buzzerService.game().players; track player.controllerId) {
                  <div
                    class="card text-center p-4"
                    [style.background-color]="player.color + '20'"
                    [style.border-color]="player.color"
                    [class.opacity-50]="!player.isActive"
                    style="border-width: 3px;"
                  >
                    <h3 class="font-bold text-lg" [style.color]="player.color">{{ player.name }}</h3>
                    <div class="text-5xl font-bold my-2">{{ player.score }}</div>
                    @if (!player.isActive) {
                      <span class="badge badge-error">Eliminated</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Game Controls -->
          <div class="flex justify-center gap-4">
            @if (buzzerService.game().isPaused) {
              <button class="btn btn-primary" (click)="resumeGame()">
                Resume
              </button>
            } @else {
              <button class="btn btn-warning" (click)="pauseGame()">
                Pause
              </button>
            }
            <button class="btn btn-outline" (click)="resetGame()">
              Reset Game
            </button>
          </div>
        }

        <!-- Winner Screen -->
        @if (buzzerService.game().winner) {
          <div class="text-center py-12">
            <div class="text-8xl mb-4">🏆</div>
            <h2 class="text-4xl font-bold mb-2">Winner!</h2>
            <div
              class="text-5xl font-bold py-4"
              [style.color]="buzzerService.game().winner!.color"
            >
              {{ buzzerService.game().winner!.name }}
            </div>
            <p class="text-xl text-base-content/60">with {{ buzzerService.game().winner!.score }} points</p>

            <!-- Final Scores -->
            <div class="card bg-base-100 shadow-xl max-w-md mx-auto mt-8">
              <div class="card-body">
                <h3 class="card-title justify-center">Final Scores</h3>
                @for (player of getSortedPlayers(); track player.controllerId) {
                  <div class="flex items-center justify-between py-2 border-b border-base-300 last:border-0">
                    <div class="flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full" [style.background-color]="player.color"></span>
                      <span>{{ player.name }}</span>
                    </div>
                    <span class="font-bold text-xl">{{ player.score }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-center gap-4 mt-8">
              <button class="btn btn-primary btn-lg" (click)="playAgain()">
                Play Again
              </button>
              <a routerLink="/buzzer" class="btn btn-outline btn-lg">
                Back to Menu
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BuzzerGameComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  buzzerService = inject(BuzzerService);

  gameStarted = signal(false);
  waitingForBuzz = signal(false);
  currentBuzz = signal<BuzzerEvent | null>(null);
  playerNames = signal<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);

  config = signal<BuzzerGameConfig>({
    numberOfPlayers: 4,
    roundsToWin: 5,
    gameMode: 'first-to-buzz',
    soundEnabled: true,
    vibrationEnabled: true,
    lightFeedback: true,
  });

  ngOnInit(): void {
    // Get game mode from route
    this.route.queryParams.subscribe(params => {
      const mode = params['mode'];
      if (mode && ['first-to-buzz', 'speed-round', 'elimination'].includes(mode)) {
        this.config.update(c => ({ ...c, gameMode: mode }));
      }
    });
  }

  ngOnDestroy(): void {
    this.buzzerService.clearBuzzCallback();
  }

  getModeTitle(): string {
    const modes: Record<string, string> = {
      'first-to-buzz': 'First to Buzz',
      'speed-round': 'Speed Round',
      'elimination': 'Elimination',
    };
    return modes[this.config().gameMode] || 'Game';
  }

  setPlayerCount(count: number): void {
    this.config.update(c => ({ ...c, numberOfPlayers: count }));
  }

  setRoundsToWin(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.config.update(c => ({ ...c, roundsToWin: value }));
  }

  getPlayerIndices(): number[] {
    return Array.from({ length: this.config().numberOfPlayers }, (_, i) => i);
  }

  updatePlayerName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.playerNames.update(names => {
      const updated = [...names];
      updated[index] = value || `Player ${index + 1}`;
      return updated;
    });
  }

  toggleSound(): void {
    this.config.update(c => ({ ...c, soundEnabled: !c.soundEnabled }));
  }

  getPlayerColor(controllerId: number): string {
    return CONTROLLER_COLORS[controllerId]?.color ?? '#888';
  }

  getPlayerName(controllerId: number): string {
    return this.playerNames()[controllerId] || `Player ${controllerId + 1}`;
  }

  startGame(): void {
    // Initialize game with config
    this.buzzerService.initGame(this.config());

    // Set player names
    this.playerNames().forEach((name, i) => {
      if (i < this.config().numberOfPlayers) {
        this.buzzerService.updatePlayerName(i, name);
      }
    });

    // Register buzz callback
    this.buzzerService.onBuzz((event) => this.handleBuzz(event));

    this.buzzerService.startGame();
    this.gameStarted.set(true);
    this.waitingForBuzz.set(true);
  }

  handleBuzz(event: BuzzerEvent): void {
    // Only accept buzzes when waiting
    if (!this.waitingForBuzz()) return;

    // Only accept red button (main buzzer)
    if (event.button !== 'red') return;

    // Only accept from active players
    const game = this.buzzerService.game();
    const player = game.players.find(p => p.controllerId === event.controllerId);
    if (!player || !player.isActive) return;

    this.currentBuzz.set(event);
    this.waitingForBuzz.set(false);

    // Flash the winner's light
    this.buzzerService.flashLight(event.controllerId);
  }

  awardPoint(): void {
    const buzz = this.currentBuzz();
    if (buzz) {
      this.buzzerService.awardPoint(buzz.controllerId);

      // Check for winner
      const game = this.buzzerService.game();
      if (game.winner) {
        this.buzzerService.flashWinner(game.winner.controllerId);
      } else {
        this.nextRound();
      }
    }
  }

  wrongAnswer(): void {
    const buzz = this.currentBuzz();
    if (buzz) {
      if (this.config().gameMode === 'elimination') {
        this.buzzerService.eliminatePlayer(buzz.controllerId);
      } else {
        // In other modes, just continue to next round
      }
      this.nextRound();
    }
  }

  nextRound(): void {
    this.currentBuzz.set(null);
    this.waitingForBuzz.set(true);
  }

  pauseGame(): void {
    this.buzzerService.pauseGame();
  }

  resumeGame(): void {
    this.buzzerService.startGame();
  }

  resetGame(): void {
    this.buzzerService.resetGame();
    this.currentBuzz.set(null);
    this.waitingForBuzz.set(true);
  }

  playAgain(): void {
    this.buzzerService.resetGame();
    this.buzzerService.startGame();
    this.waitingForBuzz.set(true);
  }

  getSortedPlayers() {
    return [...this.buzzerService.game().players].sort((a, b) => b.score - a.score);
  }
}
