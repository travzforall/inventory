/**
 * PlayStation Buzz Controller Game Buzzer Models
 *
 * Supports PS Buzz wireless buzzers (4 controllers)
 * Each controller has 1 big red button + 4 colored buttons (blue, orange, green, yellow)
 */

export interface BuzzerController {
  id: number; // 0-3 for 4 controllers
  name: string;
  color: string; // For UI display
  isConnected: boolean;
}

export interface BuzzerButtonState {
  controllerId: number;
  redButton: boolean;
  blueButton: boolean;
  orangeButton: boolean;
  greenButton: boolean;
  yellowButton: boolean;
}

export interface BuzzerEvent {
  controllerId: number;
  button: 'red' | 'blue' | 'orange' | 'green' | 'yellow';
  timestamp: number;
  playerName?: string;
}

export interface BuzzerPlayer {
  controllerId: number;
  name: string;
  color: string;
  score: number;
  isActive: boolean;
}

export interface BuzzerGameState {
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
  players: BuzzerPlayer[];
  winner: BuzzerPlayer | null;
  mode: 'first-to-buzz' | 'speed-round' | 'elimination';
}

export interface BuzzerGameConfig {
  numberOfPlayers: number;
  roundsToWin: number;
  gameMode: 'first-to-buzz' | 'speed-round' | 'elimination';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lightFeedback: boolean;
}

// PS Buzz USB HID identifiers
export const PS_BUZZ_VENDOR_ID = 0x054c; // Sony
export const PS_BUZZ_PRODUCT_ID = 0x1000; // Buzz controller

// Controller colors for UI
export const CONTROLLER_COLORS = [
  { id: 0, name: 'Player 1', color: '#3B82F6', bgClass: 'bg-blue-500' },
  { id: 1, name: 'Player 2', color: '#F97316', bgClass: 'bg-orange-500' },
  { id: 2, name: 'Player 3', color: '#22C55E', bgClass: 'bg-green-500' },
  { id: 3, name: 'Player 4', color: '#EAB308', bgClass: 'bg-yellow-500' },
];

// Button mapping for PS Buzz (based on HID report format)
export const BUTTON_MAPPING = {
  red: 0,
  yellow: 1,
  green: 2,
  orange: 3,
  blue: 4,
} as const;
