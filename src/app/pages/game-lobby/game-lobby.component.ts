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
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Game Lobby</h1>
            <div class="flex items-center space-x-4">
              <div class="bg-slate-800 px-4 py-2 rounded-lg">
                <span class="text-slate-400 text-sm">Room Code:</span>
                <span class="text-white font-mono font-bold ml-2">{{ gameState.roomCode }}</span>
              </div>
              <div class="flex items-center text-green-400" *ngIf="connected">
                <i class="fas fa-circle text-xs mr-2"></i>
                <span class="text-sm">Connected</span>
              </div>
              <div class="flex items-center text-red-400" *ngIf="!connected">
                <i class="fas fa-circle text-xs mr-2"></i>
                <span class="text-sm">Disconnected</span>
              </div>
            </div>
          </div>
          <button 
            (click)="copyRoomCode()"
            class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i class="fas fa-copy mr-2"></i>
            Copy Code
          </button>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Players List -->
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">
              Players ({{ gameState.players.length }})
            </h3>
            <div class="space-y-3">
              <div 
                *ngFor="let player of gameState.players"
                class="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg"
              >
                <div 
                  class="w-4 h-4 rounded-full"
                  [style.background-color]="player.color"
                ></div>
                <span class="text-white font-medium">{{ player.name }}</span>
                <span 
                  *ngIf="player.isHost"
                  class="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium"
                >
                  Host
                </span>
                <span 
                  *ngIf="player.id === gameState.playerId"
                  class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium"
                >
                  You
                </span>
              </div>
            </div>
          </div>

          <!-- Game Setup -->
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">Game Setup</h3>
            
            <div *ngIf="gameState.isHost" class="space-y-4">
              <div>
                <label class="block text-white text-sm font-medium mb-2">Theme (Optional)</label>
                <input
                  [(ngModel)]="theme"
                  placeholder="e.g., Food, Movies, Travel..."
                  class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label class="block text-white text-sm font-medium mb-2">Custom Prompts</label>
                <div class="space-y-2">
                  <input 
                    *ngFor="let prompt of customPrompts; let i = index"
                    [(ngModel)]="customPrompts[i]"
                    placeholder="Enter a custom prompt..."
                    class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button 
                  (click)="addCustomPrompt()"
                  class="mt-2 text-primary hover:text-primary/80 text-sm"
                >
                  + Add another prompt
                </button>
              </div>

              <button 
                (click)="updateGameSetup()"
                [disabled]="isUpdating"
                class="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                <span *ngIf="isUpdating">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </span>
                <span *ngIf="!isUpdating">Update Setup</span>
              </button>

              <div class="pt-4 border-t border-slate-600">
                <button 
                  (click)="startGame()"
                  [disabled]="isStarting || gameState.players.length < 2"
                  class="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  <span *ngIf="isStarting">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Starting...
                  </span>
                  <span *ngIf="!isStarting">Start Game</span>
                </button>
                <p 
                  *ngIf="gameState.players.length < 2"
                  class="text-slate-400 text-sm text-center mt-2"
                >
                  Need at least 2 players to start
                </p>
              </div>
            </div>

            <div *ngIf="!gameState.isHost" class="text-center py-8">
              <i class="fas fa-clock text-slate-400 text-3xl mb-4"></i>
              <p class="text-slate-400">Waiting for host to start the game...</p>
            </div>
          </div>
        </div>

        <!-- Game Rules -->
        <div class="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">How to Play</h3>
          <div class="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div class="flex items-center text-primary mb-2">
                <i class="fas fa-edit mr-2"></i>
                <span class="font-medium">1. Create</span>
              </div>
              <p class="text-slate-400">Each player creates a situation based on the prompt</p>
            </div>
            <div>
              <div class="flex items-center text-purple-400 mb-2">
                <i class="fas fa-sort mr-2"></i>
                <span class="font-medium">2. Arrange</span>
              </div>
              <p class="text-slate-400">Drag and drop situations to arrange them in order</p>
            </div>
            <div>
              <div class="flex items-center text-green-400 mb-2">
                <i class="fas fa-trophy mr-2"></i>
                <span class="font-medium">3. Score</span>
              </div>
              <p class="text-slate-400">See how well your arrangement matches the secret numbers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: hsl(263 70% 50%); }
    .bg-primary { background-color: hsl(263 70% 50%); }
    .bg-primary\\/20 { background-color: hsla(263 70% 50% / 0.2); }
  `]
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