import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface GameState {
  gameId: string | null;
  roomCode: string | null;
  playerId: string | null;
  isHost: boolean;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FREE_ROUND' | 'SHOW_RESULTS' | 'COMPLETED';
  players: Player[];
  prompts: Prompt[];
  currentRound: Round | null;
  currentPrompt: Prompt | null;
  situations: SituationWithPlayer[];
  theme: string | null;
}

interface Player {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
}

interface Prompt {
  id: string;
  text: string;
  used: boolean;
}

interface Round {
  id: string;
  roundNumber: number;
  completed: boolean;
  isFreeRound: boolean;
}

interface SituationWithPlayer {
  id: string;
  content: string;
  number: number;
  position: number;
  playerId: string;
  player: Player;
}

type GameAction = 
  | { type: 'SET_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; updates: Partial<Player> } }
  | { type: 'SET_PROMPTS'; payload: Prompt[] }
  | { type: 'ADD_SITUATION'; payload: SituationWithPlayer }
  | { type: 'UPDATE_SITUATION_POSITION'; payload: { id: string; position: number } }
  | { type: 'SET_STATUS'; payload: GameState['status'] }
  | { type: 'SET_CURRENT_ROUND'; payload: { round: Round; prompt: Prompt } }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  gameId: null,
  roomCode: null,
  playerId: null,
  isHost: false,
  status: 'LOBBY',
  players: [],
  prompts: [],
  currentRound: null,
  currentPrompt: null,
  situations: [],
  theme: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, ...action.payload };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };
    case 'SET_PROMPTS':
      return { ...state, prompts: action.payload };
    case 'ADD_SITUATION':
      return { ...state, situations: [...state.situations, action.payload] };
    case 'UPDATE_SITUATION_POSITION':
      return {
        ...state,
        situations: state.situations.map(s =>
          s.id === action.payload.id ? { ...s, position: action.payload.position } : s
        )
      };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_CURRENT_ROUND':
      return { 
        ...state, 
        currentRound: action.payload.round,
        currentPrompt: action.payload.prompt,
        situations: [] // Reset situations for new round
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
