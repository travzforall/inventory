import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BuzzerService } from '../../core/services';
import { CONTROLLER_COLORS } from '../../core/models';

@Component({
  selector: 'app-buzzer-freeplay',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          <h1 class="text-xl font-bold">🎮 Free Play</h1>
        </div>
        <div class="navbar-end">
          <button class="btn btn-ghost btn-circle" (click)="clearHistory()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div class="container mx-auto p-4 space-y-6">
        <!-- Not Connected Warning -->
        @if (!buzzerService.isConnected()) {
          <div class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No controller connected.</span>
            <a routerLink="/buzzer" class="btn btn-sm">Connect</a>
          </div>
        }

        <!-- Instructions -->
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Press any button on your controllers to test them. All button presses will be displayed below.</span>
        </div>

        <!-- Live Controller Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (controller of controllers; track controller.id) {
            <div
              class="card transition-all duration-150"
              [style.background-color]="controller.color + (isControllerActive(controller.id) ? '40' : '15')"
              [style.border-color]="controller.color"
              [style.border-width]="isControllerActive(controller.id) ? '4px' : '2px'"
              [style.transform]="isControllerActive(controller.id) ? 'scale(1.02)' : 'scale(1)'"
            >
              <div class="card-body items-center text-center">
                <h3 class="text-xl font-bold" [style.color]="controller.color">{{ controller.name }}</h3>

                <!-- Big Red Button -->
                <div
                  class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-100"
                  [class.bg-red-500]="getButtonState(controller.id, 'red')"
                  [class.bg-red-200]="!getButtonState(controller.id, 'red')"
                  [class.scale-110]="getButtonState(controller.id, 'red')"
                  [class.shadow-lg]="getButtonState(controller.id, 'red')"
                  [class.text-white]="getButtonState(controller.id, 'red')"
                >
                  🔔
                </div>

                <!-- Color Buttons -->
                <div class="flex gap-2 mt-4">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-100"
                    [class.bg-blue-500]="getButtonState(controller.id, 'blue')"
                    [class.bg-blue-200]="!getButtonState(controller.id, 'blue')"
                    [class.scale-110]="getButtonState(controller.id, 'blue')"
                  >
                    @if (getButtonState(controller.id, 'blue')) {
                      <span class="text-white font-bold">B</span>
                    }
                  </div>
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-100"
                    [class.bg-orange-500]="getButtonState(controller.id, 'orange')"
                    [class.bg-orange-200]="!getButtonState(controller.id, 'orange')"
                    [class.scale-110]="getButtonState(controller.id, 'orange')"
                  >
                    @if (getButtonState(controller.id, 'orange')) {
                      <span class="text-white font-bold">O</span>
                    }
                  </div>
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-100"
                    [class.bg-green-500]="getButtonState(controller.id, 'green')"
                    [class.bg-green-200]="!getButtonState(controller.id, 'green')"
                    [class.scale-110]="getButtonState(controller.id, 'green')"
                  >
                    @if (getButtonState(controller.id, 'green')) {
                      <span class="text-white font-bold">G</span>
                    }
                  </div>
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-100"
                    [class.bg-yellow-500]="getButtonState(controller.id, 'yellow')"
                    [class.bg-yellow-200]="!getButtonState(controller.id, 'yellow')"
                    [class.scale-110]="getButtonState(controller.id, 'yellow')"
                  >
                    @if (getButtonState(controller.id, 'yellow')) {
                      <span class="text-white font-bold">Y</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Light Controls -->
        @if (buzzerService.isConnected()) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">LED Controls</h2>
              <p class="text-base-content/60">Control the indicator lights on each controller</p>
              <div class="flex flex-wrap gap-4 mt-4">
                @for (controller of controllers; track controller.id) {
                  <button
                    class="btn"
                    [style.background-color]="controller.color"
                    [style.color]="'white'"
                    (click)="flashLight(controller.id)"
                  >
                    Flash {{ controller.name }}
                  </button>
                }
                <button class="btn btn-outline" (click)="flashAll()">
                  Flash All
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Event Log -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Button Press Log</h2>
              <span class="badge badge-ghost">{{ buzzerService.events().length }} events</span>
            </div>

            @if (buzzerService.events().length === 0) {
              <div class="text-center py-8 text-base-content/50">
                <div class="text-4xl mb-2">🎮</div>
                <p>No button presses yet. Press any button to see it logged here.</p>
              </div>
            } @else {
              <div class="overflow-y-auto max-h-80">
                <div class="space-y-2">
                  @for (event of buzzerService.events(); track event.timestamp) {
                    <div
                      class="flex items-center gap-4 p-3 rounded-lg"
                      [style.background-color]="getControllerColor(event.controllerId) + '15'"
                    >
                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        [style.background-color]="getControllerColor(event.controllerId)"
                      >
                        {{ event.controllerId + 1 }}
                      </div>
                      <div class="flex-1">
                        <div class="font-bold">{{ getControllerName(event.controllerId) }}</div>
                        <div class="text-sm text-base-content/60">
                          Pressed <span class="capitalize font-medium">{{ event.button }}</span> button
                        </div>
                      </div>
                      <div class="text-sm text-base-content/50">
                        {{ formatTime(event.timestamp) }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Keyboard Simulation (for testing without hardware) -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              Keyboard Simulation
              <span class="badge badge-secondary">For Testing</span>
            </h2>
            <p class="text-base-content/60 mb-4">
              Don't have your controller connected? Use these buttons to simulate buzzer presses.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (controller of controllers; track controller.id) {
                <button
                  class="btn btn-lg"
                  [style.background-color]="controller.color"
                  [style.color]="'white'"
                  (click)="simulateBuzz(controller.id)"
                >
                  🔔 Buzz {{ controller.id + 1 }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BuzzerFreeplayComponent implements OnDestroy {
  buzzerService = inject(BuzzerService);
  controllers = CONTROLLER_COLORS;

  ngOnDestroy(): void {
    this.buzzerService.clearBuzzCallback();
  }

  getButtonState(controllerId: number, button: string): boolean {
    const states = this.buzzerService.allButtonStates();
    const state = states[controllerId];
    if (!state) return false;
    return state[`${button}Button` as keyof typeof state] as boolean;
  }

  isControllerActive(controllerId: number): boolean {
    const state = this.buzzerService.allButtonStates()[controllerId];
    if (!state) return false;
    return state.redButton || state.blueButton || state.orangeButton || state.greenButton || state.yellowButton;
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

  async flashLight(controllerId: number): Promise<void> {
    await this.buzzerService.flashLight(controllerId, 500);
  }

  async flashAll(): Promise<void> {
    await this.buzzerService.setLights([true, true, true, true]);
    setTimeout(() => {
      this.buzzerService.setLights([false, false, false, false]);
    }, 500);
  }

  clearHistory(): void {
    // Clear would need to be added to service, for now just log
    console.log('Clear history');
  }

  simulateBuzz(controllerId: number): void {
    // Simulate a buzz event for testing without hardware
    const event = {
      controllerId,
      button: 'red' as const,
      timestamp: Date.now(),
    };

    // Manually add to event history via the service
    // This is a testing helper - in real use, events come from the hardware
    this.buzzerService['eventHistory'].update(events => [event, ...events.slice(0, 99)]);
    this.buzzerService['playBuzzSound'](controllerId);
  }
}
