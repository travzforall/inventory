import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BuzzerService } from '../../core/services';
import { CONTROLLER_COLORS } from '../../core/models';

@Component({
  selector: 'app-buzzer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-base-200">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
        <div class="navbar-start">
          <a routerLink="/dashboard" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
        <div class="navbar-center">
          <h1 class="text-xl font-bold">🎮 Game Buzzer</h1>
        </div>
        <div class="navbar-end">
          <div class="badge" [class.badge-success]="buzzerService.isConnected()" [class.badge-error]="!buzzerService.isConnected()">
            {{ buzzerService.isConnected() ? 'Connected' : 'Disconnected' }}
          </div>
        </div>
      </div>

      <div class="container mx-auto p-4 space-y-6">
        <!-- Connection Card -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              PS Buzz Controller
            </h2>

            @if (!buzzerService.isWebHIDSupported()) {
              <div class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>WebHID is not supported in this browser. Please use Chrome, Edge, or Opera.</span>
              </div>
            } @else if (buzzerService.isConnected()) {
              <div class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ buzzerService.deviceName() }} connected!</span>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-outline btn-error" (click)="disconnect()">
                  Disconnect
                </button>
                <a routerLink="/buzzer/mapping" class="btn btn-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Map Buttons
                </a>
              </div>
              @if (buzzerService.hasCustomMapping()) {
                <div class="badge badge-info mt-2">Custom mapping active</div>
              }
            } @else {
              <p class="text-base-content/70">Connect your PS Buzz wireless controllers to start playing.</p>
              <div class="card-actions justify-end">
                <button class="btn btn-primary" (click)="connect()">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect Controller
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Controller Status -->
        @if (buzzerService.isConnected()) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Controller Status</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (controller of controllers; track controller.id) {
                  <div class="card" [style.background-color]="controller.color + '20'" [style.border-color]="controller.color" style="border-width: 2px;">
                    <div class="card-body items-center text-center p-4">
                      <h3 class="font-bold" [style.color]="controller.color">{{ controller.name }}</h3>
                      <div class="flex flex-wrap gap-1 justify-center mt-2">
                        <div class="badge" [class.badge-error]="getButtonState(controller.id, 'red')" [class.badge-ghost]="!getButtonState(controller.id, 'red')">●</div>
                        <div class="badge" [class.bg-blue-500]="getButtonState(controller.id, 'blue')" [class.badge-ghost]="!getButtonState(controller.id, 'blue')">●</div>
                        <div class="badge" [class.bg-orange-500]="getButtonState(controller.id, 'orange')" [class.badge-ghost]="!getButtonState(controller.id, 'orange')">●</div>
                        <div class="badge" [class.bg-green-500]="getButtonState(controller.id, 'green')" [class.badge-ghost]="!getButtonState(controller.id, 'green')">●</div>
                        <div class="badge" [class.bg-yellow-500]="getButtonState(controller.id, 'yellow')" [class.badge-ghost]="!getButtonState(controller.id, 'yellow')">●</div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Game Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Quiz Game (Kahoot-style) -->
          <a routerLink="/buzzer/quiz" class="card bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div class="card-body">
              <div class="flex items-center gap-4">
                <div class="bg-white/20 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Quiz Game</h2>
                  <p class="opacity-80">Kahoot-style trivia - answer with colored buttons!</p>
                </div>
              </div>
            </div>
          </a>

          <!-- First to Buzz -->
          <a routerLink="/buzzer/game" [queryParams]="{mode: 'first-to-buzz'}" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div class="card-body">
              <div class="flex items-center gap-4">
                <div class="bg-primary/20 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">First to Buzz</h2>
                  <p class="text-base-content/60">Classic quiz show mode - first to press wins the round</p>
                </div>
              </div>
            </div>
          </a>

          <!-- Speed Round -->
          <a routerLink="/buzzer/game" [queryParams]="{mode: 'speed-round'}" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div class="card-body">
              <div class="flex items-center gap-4">
                <div class="bg-secondary/20 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Speed Round</h2>
                  <p class="text-base-content/60">Timed rounds - most buzzes in the time limit wins</p>
                </div>
              </div>
            </div>
          </a>

          <!-- Elimination -->
          <a routerLink="/buzzer/game" [queryParams]="{mode: 'elimination'}" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div class="card-body">
              <div class="flex items-center gap-4">
                <div class="bg-accent/20 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Elimination</h2>
                  <p class="text-base-content/60">Last player standing wins - wrong answers eliminate</p>
                </div>
              </div>
            </div>
          </a>

          <!-- Free Play -->
          <a routerLink="/buzzer/freeplay" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div class="card-body">
              <div class="flex items-center gap-4">
                <div class="bg-info/20 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="card-title">Free Play</h2>
                  <p class="text-base-content/60">Test controllers and play without rules</p>
                </div>
              </div>
            </div>
          </a>
        </div>

        <!-- Recent Events -->
        @if (buzzerService.events().length > 0) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Recent Buzzes</h2>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Button</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (event of buzzerService.events().slice(0, 10); track event.timestamp) {
                      <tr>
                        <td>
                          <span class="badge" [style.background-color]="getControllerColor(event.controllerId)">
                            {{ getControllerName(event.controllerId) }}
                          </span>
                        </td>
                        <td class="capitalize">{{ event.button }}</td>
                        <td>{{ formatTime(event.timestamp) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class BuzzerDashboardComponent implements OnInit, OnDestroy {
  buzzerService = inject(BuzzerService);
  controllers = CONTROLLER_COLORS;

  ngOnInit(): void {
    // Try to reconnect if previously paired
  }

  ngOnDestroy(): void {
    // Keep connection alive for game components
  }

  async connect(): Promise<void> {
    try {
      await this.buzzerService.connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.buzzerService.disconnect();
  }

  getButtonState(controllerId: number, button: string): boolean {
    const states = this.buzzerService.allButtonStates();
    const state = states[controllerId];
    if (!state) return false;
    return state[`${button}Button` as keyof typeof state] as boolean;
  }

  getControllerColor(controllerId: number): string {
    return CONTROLLER_COLORS[controllerId]?.color ?? '#888';
  }

  getControllerName(controllerId: number): string {
    return CONTROLLER_COLORS[controllerId]?.name ?? `Player ${controllerId + 1}`;
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}
