import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState, Player, Game, CreateGameRequest, JoinGameRequest, GameSetupRequest, CreateSituationRequest, UpdatePositionRequest, ResultsData } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly baseUrl = '/api';
  
  private gameStateSubject = new BehaviorSubject<GameState>({
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
    theme: null
  });

  public gameState$ = this.gameStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentGameState(): GameState {
    return this.gameStateSubject.value;
  }

  updateGameState(updates: Partial<GameState>): void {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...currentState, ...updates });
  }

  createGame(request: CreateGameRequest): Observable<{ game: Game; host: Player }> {
    return this.http.post<{ game: Game; host: Player }>(`${this.baseUrl}/games`, request);
  }

  joinGame(roomCode: string, request: JoinGameRequest): Observable<{ game: Game; player: Player }> {
    return this.http.post<{ game: Game; player: Player }>(`${this.baseUrl}/games/${roomCode}/join`, request);
  }

  getGameState(roomCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/games/${roomCode}`);
  }

  updateGameSetup(roomCode: string, request: GameSetupRequest): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/games/${roomCode}/setup`, request);
  }

  startGame(roomCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${roomCode}/start`, {});
  }

  createSituation(roomCode: string, request: CreateSituationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${roomCode}/situations`, request);
  }

  updateSituationPosition(situationId: string, request: UpdatePositionRequest): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/situations/${situationId}/position`, request);
  }

  startFreeRound(roomCode: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/games/${roomCode}/free-round`, {});
  }

  showResults(roomCode: string): Observable<ResultsData> {
    return this.http.post<ResultsData>(`${this.baseUrl}/games/${roomCode}/results`, {});
  }

  startNextRound(roomCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/games/${roomCode}/next-round`, {});
  }

  resetGameState(): void {
    this.gameStateSubject.next({
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
      theme: null
    });
  }
}