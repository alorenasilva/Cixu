import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player } from '../../models/game.models';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.css']
})
export class GameLobbyComponent implements OnInit, OnDestroy {
  gameState!: GameState;
  connected = false;
  theme = '';
  customPrompts = [''];
  isUpdating = false;
  isStarting = false;
  
  private subscriptions = new Subscription();

  constructor(
    private gameService: GameService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.gameService.gameState$.subscribe(state => {
        this.gameState = state;
        if (!state.roomCode) {
          this.router.navigate(['/']);
          return;
        }
        
        if (state.status === 'IN_PROGRESS') {
          this.router.navigate(['/game']);
        }
        
        // Connect to WebSocket
        this.socketService.connect(state.roomCode);
      })
    );

    this.subscriptions.add(
      this.socketService.connected$.subscribe(connected => {
        this.connected = connected;
      })
    );

    // Listen for game events
    this.subscriptions.add(
      this.socketService.on('gameStarted').subscribe(() => {
        this.gameService.updateGameState({ status: 'IN_PROGRESS' });
      })
    );

    this.subscriptions.add(
      this.socketService.on('playerJoined').subscribe((player: Player) => {
        const currentPlayers = this.gameState.players;
        this.gameService.updateGameState({
          players: [...currentPlayers, player]
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.socketService.disconnect();
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.gameState.roomCode || '');
    // Could add toast notification here
  }

  addCustomPrompt(): void {
    this.customPrompts.push('');
  }

  updateGameSetup(): void {
    if (!this.gameState.roomCode) return;

    this.isUpdating = true;
    const setupData = {
      theme: this.theme.trim() || undefined,
      customPrompts: this.customPrompts.filter(p => p.trim()).length > 0 
        ? this.customPrompts.filter(p => p.trim()) 
        : undefined
    };

    this.gameService.updateGameSetup(this.gameState.roomCode, setupData).subscribe({
      next: () => {
        this.isUpdating = false;
        // Could add success toast
      },
      error: (error) => {
        console.error('Failed to update setup:', error);
        this.isUpdating = false;
      }
    });
  }

  startGame(): void {
    if (!this.gameState.roomCode) return;

    this.isStarting = true;
    this.gameService.startGame(this.gameState.roomCode).subscribe({
      next: () => {
        // Socket event will handle navigation
      },
      error: (error) => {
        console.error('Failed to start game:', error);
        this.isStarting = false;
      }
    });
  }
}