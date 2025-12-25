import { Injectable, signal, computed } from '@angular/core';
import {
  BuzzerButtonState,
  BuzzerEvent,
  BuzzerPlayer,
  BuzzerGameState,
  BuzzerGameConfig,
  PS_BUZZ_VENDOR_ID,
  PS_BUZZ_PRODUCT_ID,
  CONTROLLER_COLORS,
} from '../models/buzzer.model';

// Custom button mapping interface
export interface ButtonMapping {
  controllerId: number;
  button: 'red' | 'blue' | 'orange' | 'green' | 'yellow';
  bitMask: number;
  byteIndex: number;
}

@Injectable({ providedIn: 'root' })
export class BuzzerService {
  // Connection state
  private device = signal<HIDDevice | null>(null);
  readonly isConnected = computed(() => this.device() !== null);
  readonly deviceName = computed(() => this.device()?.productName ?? 'Not connected');

  // Custom button mappings
  private customMappings = signal<ButtonMapping[]>([]);
  readonly hasCustomMapping = computed(() => this.customMappings().length > 0);

  // Button states for all 4 controllers
  private buttonStates = signal<BuzzerButtonState[]>([
    { controllerId: 0, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
    { controllerId: 1, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
    { controllerId: 2, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
    { controllerId: 3, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
  ]);
  readonly allButtonStates = this.buttonStates.asReadonly();

  // Event stream for button presses
  private eventHistory = signal<BuzzerEvent[]>([]);
  readonly events = this.eventHistory.asReadonly();

  // Game state
  private gameState = signal<BuzzerGameState>({
    isRunning: false,
    isPaused: false,
    currentRound: 0,
    totalRounds: 5,
    players: [],
    winner: null,
    mode: 'first-to-buzz',
  });
  readonly game = this.gameState.asReadonly();

  // Callbacks for button events
  private onBuzzCallback: ((event: BuzzerEvent) => void) | null = null;

  constructor() {
    // Load saved mappings from localStorage
    this.loadSavedMappings();

    // Check for WebHID support
    if (!('hid' in navigator)) {
      console.warn('WebHID is not supported in this browser');
    }
  }

  /**
   * Check if WebHID is supported
   */
  isWebHIDSupported(): boolean {
    return 'hid' in navigator;
  }

  /**
   * Request access to PS Buzz controller
   * Must be called from a user gesture (click handler)
   */
  async connect(): Promise<boolean> {
    if (!this.isWebHIDSupported()) {
      throw new Error('WebHID is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      // Request device with PS Buzz vendor/product IDs
      const devices = await (navigator as any).hid.requestDevice({
        filters: [
          { vendorId: PS_BUZZ_VENDOR_ID, productId: PS_BUZZ_PRODUCT_ID },
          // Also try generic Sony filter in case of different product ID
          { vendorId: PS_BUZZ_VENDOR_ID },
        ],
      });

      if (devices.length === 0) {
        console.log('No device selected');
        return false;
      }

      const device = devices[0];

      // Open the device
      if (!device.opened) {
        await device.open();
      }

      // Set up input report handler
      device.addEventListener('inputreport', (event: any) => this.handleInputReport(event));

      this.device.set(device);
      console.log('PS Buzz connected:', device.productName);

      return true;
    } catch (error) {
      console.error('Failed to connect to PS Buzz:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the controller
   */
  async disconnect(): Promise<void> {
    const device = this.device();
    if (device) {
      await device.close();
      this.device.set(null);
      this.resetButtonStates();
    }
  }

  /**
   * Handle input reports from the PS Buzz controller
   * Uses custom mappings if available, otherwise falls back to default parsing
   */
  private handleInputReport(event: any): void {
    const data = new Uint8Array(event.data.buffer);

    // Debug: log raw data to console
    if (this.debugMode) {
      console.log('HID Report:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));
    }

    // Use custom mappings if available
    if (this.hasCustomMapping()) {
      this.parseWithCustomMapping(data);
    } else {
      this.parseWithDefaultMapping(data);
    }
  }

  /**
   * Parse button states using custom mappings
   */
  private parseWithCustomMapping(data: Uint8Array): void {
    const mappings = this.customMappings();
    const newStates: BuzzerButtonState[] = [
      { controllerId: 0, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 1, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 2, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 3, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
    ];

    for (const mapping of mappings) {
      if (mapping.byteIndex < data.length) {
        const isPressed = (data[mapping.byteIndex] & mapping.bitMask) !== 0;
        const buttonKey = `${mapping.button}Button` as keyof BuzzerButtonState;
        (newStates[mapping.controllerId] as any)[buttonKey] = isPressed;
      }
    }

    // Detect button presses and update state
    for (let i = 0; i < 4; i++) {
      const oldState = this.buttonStates()[i];
      this.detectButtonPress(oldState, newStates[i]);
    }

    this.buttonStates.set(newStates);
  }

  /**
   * Parse button states using default PS Buzz mapping
   */
  private parseWithDefaultMapping(data: Uint8Array): void {
    const newStates: BuzzerButtonState[] = [];

    // Default: Extract 20 bits of button data (5 bits per controller x 4 controllers)
    const startByte = data.length >= 5 ? 2 : 0;

    let buttonBits = 0;
    for (let i = 0; i < Math.min(3, data.length - startByte); i++) {
      buttonBits |= (data[startByte + i] << (i * 8));
    }

    for (let i = 0; i < 4; i++) {
      const controllerBits = (buttonBits >> (i * 5)) & 0x1F;

      const state: BuzzerButtonState = {
        controllerId: i,
        redButton: (controllerBits & 0x01) !== 0,
        yellowButton: (controllerBits & 0x02) !== 0,
        greenButton: (controllerBits & 0x04) !== 0,
        orangeButton: (controllerBits & 0x08) !== 0,
        blueButton: (controllerBits & 0x10) !== 0,
      };

      newStates.push(state);

      const oldState = this.buttonStates()[i];
      this.detectButtonPress(oldState, state);
    }

    this.buttonStates.set(newStates);
  }

  // Debug mode flag - set to true to log raw HID data
  private debugMode = true;

  /**
   * Toggle debug mode for HID data logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log('Buzzer debug mode:', enabled ? 'ON' : 'OFF');
  }

  /**
   * Load saved button mappings from localStorage
   */
  private loadSavedMappings(): void {
    try {
      const saved = localStorage.getItem('psBuzzMapping');
      if (saved) {
        const mappings = JSON.parse(saved) as ButtonMapping[];
        this.customMappings.set(mappings);
        console.log('Loaded saved button mappings:', mappings.length, 'buttons mapped');
      }
    } catch (e) {
      console.warn('Failed to load saved mappings:', e);
    }
  }

  /**
   * Apply custom button mappings
   */
  applyCustomMapping(mappings: ButtonMapping[]): void {
    this.customMappings.set(mappings);
    localStorage.setItem('psBuzzMapping', JSON.stringify(mappings));
    console.log('Applied custom button mappings:', mappings.length, 'buttons');
  }

  /**
   * Clear custom mappings and use default
   */
  clearCustomMapping(): void {
    this.customMappings.set([]);
    localStorage.removeItem('psBuzzMapping');
    console.log('Cleared custom mappings, using default');
  }

  /**
   * Get current mappings
   */
  getMappings(): ButtonMapping[] {
    return this.customMappings();
  }

  /**
   * Detect new button presses and emit events
   */
  private detectButtonPress(oldState: BuzzerButtonState, newState: BuzzerButtonState): void {
    const buttons: Array<'red' | 'blue' | 'orange' | 'green' | 'yellow'> = ['red', 'blue', 'orange', 'green', 'yellow'];

    for (const button of buttons) {
      const oldValue = oldState[`${button}Button` as keyof BuzzerButtonState];
      const newValue = newState[`${button}Button` as keyof BuzzerButtonState];

      // New press detected
      if (!oldValue && newValue) {
        const event: BuzzerEvent = {
          controllerId: newState.controllerId,
          button,
          timestamp: Date.now(),
        };

        // Add to history
        this.eventHistory.update(events => [event, ...events.slice(0, 99)]);

        // Call registered callback
        if (this.onBuzzCallback) {
          this.onBuzzCallback(event);
        }

        // Play sound feedback
        this.playBuzzSound(newState.controllerId);
      }
    }
  }

  /**
   * Set the light state for controllers (if supported)
   * PS Buzz controllers have LEDs that can be controlled
   */
  async setLights(controllerLights: boolean[]): Promise<void> {
    const device = this.device();
    if (!device) return;

    try {
      // PS Buzz light control output report
      // Byte 0: Report ID (0x00)
      // Byte 1: Light state bitmap (bit 0-3 = controllers 1-4)
      let lightByte = 0;
      controllerLights.forEach((on, i) => {
        if (on) lightByte |= (1 << i);
      });

      const report = new Uint8Array([0x00, lightByte, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      await device.sendReport(0, report);
    } catch (error) {
      console.error('Failed to set lights:', error);
    }
  }

  /**
   * Flash a specific controller's light
   */
  async flashLight(controllerId: number, duration: number = 500): Promise<void> {
    const lights = [false, false, false, false];
    lights[controllerId] = true;
    await this.setLights(lights);

    setTimeout(() => {
      this.setLights([false, false, false, false]);
    }, duration);
  }

  /**
   * Flash the winning controller
   */
  async flashWinner(controllerId: number, times: number = 5): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.flashLight(controllerId, 200);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Register a callback for buzz events
   */
  onBuzz(callback: (event: BuzzerEvent) => void): void {
    this.onBuzzCallback = callback;
  }

  /**
   * Clear the buzz callback
   */
  clearBuzzCallback(): void {
    this.onBuzzCallback = null;
  }

  /**
   * Reset button states
   */
  private resetButtonStates(): void {
    this.buttonStates.set([
      { controllerId: 0, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 1, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 2, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
      { controllerId: 3, redButton: false, blueButton: false, orangeButton: false, greenButton: false, yellowButton: false },
    ]);
  }

  /**
   * Play a buzz sound effect
   */
  private playBuzzSound(controllerId: number): void {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Different frequency for each controller
      const frequencies = [440, 523, 659, 784]; // A4, C5, E5, G5
      oscillator.frequency.value = frequencies[controllerId];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play buzz sound:', error);
    }
  }

  // ============ Game Management ============

  /**
   * Initialize a new game
   */
  initGame(config: BuzzerGameConfig): void {
    const players: BuzzerPlayer[] = [];

    for (let i = 0; i < config.numberOfPlayers; i++) {
      players.push({
        controllerId: i,
        name: CONTROLLER_COLORS[i].name,
        color: CONTROLLER_COLORS[i].color,
        score: 0,
        isActive: true,
      });
    }

    this.gameState.set({
      isRunning: false,
      isPaused: false,
      currentRound: 0,
      totalRounds: config.roundsToWin,
      players,
      winner: null,
      mode: config.gameMode,
    });

    // Clear event history for new game
    this.eventHistory.set([]);
  }

  /**
   * Start or resume the game
   */
  startGame(): void {
    this.gameState.update(state => ({
      ...state,
      isRunning: true,
      isPaused: false,
    }));
  }

  /**
   * Pause the game
   */
  pauseGame(): void {
    this.gameState.update(state => ({
      ...state,
      isPaused: true,
    }));
  }

  /**
   * Award a point to a player
   */
  awardPoint(controllerId: number): void {
    this.gameState.update(state => {
      const players = state.players.map(p =>
        p.controllerId === controllerId
          ? { ...p, score: p.score + 1 }
          : p
      );

      // Check for winner
      const winner = players.find(p => p.score >= state.totalRounds) ?? null;

      return {
        ...state,
        players,
        winner,
        currentRound: state.currentRound + 1,
        isRunning: winner === null,
      };
    });
  }

  /**
   * Deduct a point from a player
   */
  deductPoint(controllerId: number): void {
    this.gameState.update(state => ({
      ...state,
      players: state.players.map(p =>
        p.controllerId === controllerId
          ? { ...p, score: Math.max(0, p.score - 1) }
          : p
      ),
    }));
  }

  /**
   * Eliminate a player (for elimination mode)
   */
  eliminatePlayer(controllerId: number): void {
    this.gameState.update(state => {
      const players = state.players.map(p =>
        p.controllerId === controllerId
          ? { ...p, isActive: false }
          : p
      );

      const activePlayers = players.filter(p => p.isActive);
      const winner = activePlayers.length === 1 ? activePlayers[0] : null;

      return {
        ...state,
        players,
        winner,
        isRunning: winner === null,
      };
    });
  }

  /**
   * Reset the game
   */
  resetGame(): void {
    this.gameState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: false,
      currentRound: 0,
      winner: null,
      players: state.players.map(p => ({
        ...p,
        score: 0,
        isActive: true,
      })),
    }));
    this.eventHistory.set([]);
  }

  /**
   * Update player name
   */
  updatePlayerName(controllerId: number, name: string): void {
    this.gameState.update(state => ({
      ...state,
      players: state.players.map(p =>
        p.controllerId === controllerId
          ? { ...p, name }
          : p
      ),
    }));
  }

  /**
   * Get controller color info
   */
  getControllerColor(controllerId: number) {
    return CONTROLLER_COLORS[controllerId] ?? CONTROLLER_COLORS[0];
  }
}
