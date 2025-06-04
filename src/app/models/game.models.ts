export interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

export interface Prompt {
  id: string;
  text: string;
  used: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  completed: boolean;
  isFreeRound: boolean;
}

export interface Situation {
  id: string;
  content: string;
  number: number;
  position: number;
  playerId: string;
  roundId: string;
}

export interface SituationWithPlayer extends Situation {
  player: Player;
}

export interface Game {
  id: string;
  roomCode: string;
  status: GameStatus;
  createdAt: string;
  hostId: string;
  theme: string | null;
  currentRoundId: string | null;
}

export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FREE_ROUND' | 'SHOW_RESULTS' | 'COMPLETED';

export interface GameState {
  gameId: string | null;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  status: GameStatus;
  players: Player[];
  prompts: Prompt[];
  currentRound: Round | null;
  currentPrompt: Prompt | null;
  situations: SituationWithPlayer[];
  theme: string | null;
}

export interface CreateGameRequest {
  hostName: string;
}

export interface JoinGameRequest {
  playerName: string;
}

export interface GameSetupRequest {
  theme?: string;
  customPrompts?: string[];
}

export interface CreateSituationRequest {
  content: string;
  position: number;
  playerId: string;
}

export interface UpdatePositionRequest {
  position: number;
  roomCode: string;
}

export interface ResultsData {
  playerOrder: SituationWithPlayer[];
  actualOrder: SituationWithPlayer[];
  accuracy: number;
}