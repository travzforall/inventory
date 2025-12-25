import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BuzzerService } from '../../core/services';
import { CONTROLLER_COLORS } from '../../core/models';

interface ButtonMapping {
  controllerId: number;
  button: 'red' | 'blue' | 'orange' | 'green' | 'yellow';
  bitMask: number;
  byteIndex: number;
}

interface MappingStep {
  controllerId: number;
  button: 'red' | 'blue' | 'orange' | 'green' | 'yellow';
  label: string;
  color: string;
}

@Component({
  selector: 'app-buzzer-mapping',
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
          <h1 class="text-xl font-bold">Button Mapping</h1>
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
            <span>Connect your PS Buzz controller first.</span>
            <a routerLink="/buzzer" class="btn btn-sm">Connect</a>
          </div>
        }

        <!-- Mapping Mode -->
        @if (buzzerService.isConnected() && !mappingComplete()) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center">
              <h2 class="card-title text-2xl mb-4">Press the Button</h2>

              <!-- Progress -->
              <div class="w-full max-w-md mb-6">
                <progress
                  class="progress progress-primary w-full"
                  [value]="currentStepIndex()"
                  [max]="mappingSteps.length"
                ></progress>
                <p class="text-sm text-base-content/60 mt-1">
                  Step {{ currentStepIndex() + 1 }} of {{ mappingSteps.length }}
                </p>
              </div>

              <!-- Current Button to Press -->
              @if (currentStep()) {
                <div class="py-8">
                  <div
                    class="w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold animate-pulse shadow-lg mx-auto"
                    [style.background-color]="currentStep()!.color"
                  >
                    @if (currentStep()!.button === 'red') {
                      <span class="text-4xl">🔔</span>
                    } @else {
                      {{ currentStep()!.button[0].toUpperCase() }}
                    }
                  </div>
                  <h3 class="text-xl font-bold mt-4" [style.color]="getControllerColor(currentStep()!.controllerId)">
                    Controller {{ currentStep()!.controllerId + 1 }}
                  </h3>
                  <p class="text-lg mt-2">
                    Press the <span class="font-bold uppercase" [style.color]="currentStep()!.color">{{ currentStep()!.button }}</span> button
                  </p>
                </div>
              }

              <!-- Raw Data Display -->
              <div class="bg-base-200 rounded-lg p-4 w-full max-w-md mt-4">
                <h4 class="font-bold mb-2">Raw HID Data:</h4>
                <code class="text-sm font-mono">{{ lastRawData() || 'Waiting for input...' }}</code>
              </div>

              <!-- Skip / Reset -->
              <div class="flex gap-4 mt-6">
                <button class="btn btn-ghost" (click)="skipButton()">
                  Skip This Button
                </button>
                <button class="btn btn-outline btn-error" (click)="resetMapping()">
                  Start Over
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Mapping Complete -->
        @if (mappingComplete()) {
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center">
              <div class="text-6xl mb-4">✅</div>
              <h2 class="card-title text-2xl">Mapping Complete!</h2>
              <p class="text-base-content/60">Your button mappings have been saved.</p>

              <div class="flex gap-4 mt-6">
                <button class="btn btn-primary" (click)="saveMapping()">
                  Save & Use Mapping
                </button>
                <button class="btn btn-outline" (click)="resetMapping()">
                  Redo Mapping
                </button>
              </div>
            </div>
          </div>

          <!-- Mapping Results -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Detected Mappings</h2>
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Controller</th>
                      <th>Button</th>
                      <th>Byte</th>
                      <th>Bit Mask</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (mapping of detectedMappings(); track mapping.controllerId + mapping.button) {
                      <tr>
                        <td>
                          <span class="badge" [style.background-color]="getControllerColor(mapping.controllerId)">
                            Controller {{ mapping.controllerId + 1 }}
                          </span>
                        </td>
                        <td class="capitalize">{{ mapping.button }}</td>
                        <td>{{ mapping.byteIndex }}</td>
                        <td><code>0x{{ mapping.bitMask.toString(16).padStart(2, '0') }}</code></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Live Data Monitor -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              Live HID Data
              <span class="badge badge-ghost">{{ dataPacketCount() }} packets</span>
            </h2>
            <div class="bg-base-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div class="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                @for (packet of recentPackets(); track $index) {
                  <div class="flex gap-4">
                    <span class="text-base-content/50">{{ packet.time }}</span>
                    <span>{{ packet.data }}</span>
                    @if (packet.changed) {
                      <span class="text-warning">← changed</span>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">How Mapping Works</h2>
            <ul class="list-disc list-inside space-y-2 text-base-content/80">
              <li>Each controller has <strong>5 buttons</strong>: 1 red buzzer + 4 colored buttons (blue, orange, green, yellow)</li>
              <li>With 4 controllers, there are <strong>20 buttons total</strong> to map</li>
              <li>Press each button when prompted to detect its position in the HID data</li>
              <li>The system will detect which byte and bit each button uses</li>
              <li>Once complete, the mapping is saved for future use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BuzzerMappingComponent implements OnInit, OnDestroy {
  buzzerService = inject(BuzzerService);

  // Mapping steps - 4 controllers x 5 buttons each
  mappingSteps: MappingStep[] = [];

  currentStepIndex = signal(0);
  mappingComplete = signal(false);
  detectedMappings = signal<ButtonMapping[]>([]);
  lastRawData = signal<string>('');
  lastRawBytes = signal<number[]>([]);
  baselineData = signal<number[]>([]);

  // For live data display
  dataPacketCount = signal(0);
  recentPackets = signal<Array<{ time: string; data: string; changed: boolean }>>([]);

  private rawDataHandler: ((data: Uint8Array) => void) | null = null;

  currentStep = computed(() => {
    const index = this.currentStepIndex();
    return index < this.mappingSteps.length ? this.mappingSteps[index] : null;
  });

  constructor() {
    // Build mapping steps for all 4 controllers
    const buttons: Array<{ name: 'red' | 'blue' | 'orange' | 'green' | 'yellow'; color: string }> = [
      { name: 'red', color: '#EF4444' },
      { name: 'blue', color: '#3B82F6' },
      { name: 'orange', color: '#F97316' },
      { name: 'green', color: '#22C55E' },
      { name: 'yellow', color: '#EAB308' },
    ];

    for (let controller = 0; controller < 4; controller++) {
      for (const btn of buttons) {
        this.mappingSteps.push({
          controllerId: controller,
          button: btn.name,
          label: `Controller ${controller + 1} - ${btn.name}`,
          color: btn.color,
        });
      }
    }
  }

  ngOnInit(): void {
    if (this.buzzerService.isConnected()) {
      this.startListening();
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  private startListening(): void {
    // Access the device directly and set up our own listener
    const device = (this.buzzerService as any).device();
    if (device) {
      this.rawDataHandler = (event: any) => this.handleRawData(event);
      device.addEventListener('inputreport', this.rawDataHandler);

      // Capture baseline (no buttons pressed)
      setTimeout(() => {
        if (this.lastRawBytes().length > 0) {
          this.baselineData.set([...this.lastRawBytes()]);
        }
      }, 500);
    }
  }

  private stopListening(): void {
    if (this.rawDataHandler) {
      const device = (this.buzzerService as any).device();
      if (device) {
        device.removeEventListener('inputreport', this.rawDataHandler);
      }
      this.rawDataHandler = null;
    }
  }

  private handleRawData(event: any): void {
    const data = new Uint8Array(event.data.buffer);
    const bytes = Array.from(data);
    const hexString = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');

    this.lastRawData.set(hexString);
    this.dataPacketCount.update(c => c + 1);

    // Check if data changed from last packet
    const lastBytes = this.lastRawBytes();
    const changed = lastBytes.length > 0 && bytes.some((b, i) => b !== lastBytes[i]);

    this.lastRawBytes.set(bytes);

    // Add to recent packets
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    this.recentPackets.update(packets => {
      const newPackets = [{ time, data: hexString, changed }, ...packets];
      return newPackets.slice(0, 20); // Keep last 20
    });

    // If we're in mapping mode and data changed, try to detect button press
    if (!this.mappingComplete() && changed) {
      this.detectButtonPress(bytes);
    }
  }

  private detectButtonPress(currentBytes: number[]): void {
    const baseline = this.baselineData();
    if (baseline.length === 0) {
      // No baseline yet, use current as baseline
      this.baselineData.set([...currentBytes]);
      return;
    }

    // Find which byte and bit changed
    for (let byteIndex = 0; byteIndex < currentBytes.length; byteIndex++) {
      const diff = currentBytes[byteIndex] ^ baseline[byteIndex];
      if (diff !== 0) {
        // Found a difference - check if it's a button press (bit went high)
        const pressedBits = currentBytes[byteIndex] & diff;
        if (pressedBits !== 0) {
          // A button was pressed
          const step = this.currentStep();
          if (step) {
            const mapping: ButtonMapping = {
              controllerId: step.controllerId,
              button: step.button,
              byteIndex: byteIndex,
              bitMask: pressedBits,
            };

            console.log('Detected mapping:', mapping);

            // Add to mappings
            this.detectedMappings.update(m => [...m, mapping]);

            // Move to next step
            this.advanceStep();
          }
          break;
        }
      }
    }
  }

  private advanceStep(): void {
    const nextIndex = this.currentStepIndex() + 1;
    if (nextIndex >= this.mappingSteps.length) {
      this.mappingComplete.set(true);
    } else {
      this.currentStepIndex.set(nextIndex);
      // Update baseline for next button
      setTimeout(() => {
        this.baselineData.set([...this.lastRawBytes()]);
      }, 200);
    }
  }

  skipButton(): void {
    this.advanceStep();
  }

  resetMapping(): void {
    this.currentStepIndex.set(0);
    this.mappingComplete.set(false);
    this.detectedMappings.set([]);
    this.baselineData.set([]);
  }

  saveMapping(): void {
    const mappings = this.detectedMappings();

    // Save to localStorage
    localStorage.setItem('psBuzzMapping', JSON.stringify(mappings));

    // Apply to service
    (this.buzzerService as any).applyCustomMapping?.(mappings);

    alert('Mapping saved! You can now use your buzzers.');
  }

  getControllerColor(controllerId: number): string {
    return CONTROLLER_COLORS[controllerId]?.color ?? '#888';
  }
}
