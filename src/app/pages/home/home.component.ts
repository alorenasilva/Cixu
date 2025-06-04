import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div class="max-w-4xl w-full">
        <!-- Hero Section -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-6">
            <i class="fas fa-gamepad text-primary mr-2"></i>
            <span class="text-primary font-medium">Multiplayer Turn-Based Game</span>
          </div>
          <h1 class="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            SituationSort
          </h1>
          <p class="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Create situations, arrange them in order, and discover how well you and your friends think alike in this collaborative guessing game.
          </p>
        </div>

        <!-- Action Cards -->
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <!-- Create Game Card -->
          <div class="bg-slate-800/50 border border-slate-700 hover:border-primary/50 transition-all duration-300 rounded-lg">
            <div class="p-6">
              <div class="flex items-center text-white mb-4">
                <div class="bg-primary/10 p-3 rounded-xl mr-4">
                  <i class="fas fa-plus text-primary text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold">Create Game</h3>
              </div>
              <p class="text-slate-400 mb-4">Start a new game session and invite friends to join with a shareable room code.</p>
              <div class="space-y-4">
                <div>
                  <label class="block text-white text-sm font-medium mb-2">Your Name</label>
                  <input
                    [(ngModel)]="hostName"
                    placeholder="Enter your name"
                    class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button 
                  (click)="createGame()"
                  [disabled]="isLoading"
                  class="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  <span *ngIf="isLoading">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </span>
                  <span *ngIf="!isLoading">Create Room</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Join Game Card -->
          <div class="bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 rounded-lg">
            <div class="p-6">
              <div class="flex items-center text-white mb-4">
                <div class="bg-purple-500/10 p-3 rounded-xl mr-4">
                  <i class="fas fa-sign-in-alt text-purple-500 text-xl"></i>
                </div>
                <h3 class="text-xl font-semibold">Join Game</h3>
              </div>
              <p class="text-slate-400 mb-4">Enter a room code to join an existing game session.</p>
              <div class="space-y-4">
                <div>
                  <label class="block text-white text-sm font-medium mb-2">Room Code</label>
                  <input
                    [(ngModel)]="roomCode"
                    (input)="onRoomCodeChange($event)"
                    placeholder="Enter 6-digit code"
                    maxlength="6"
                    class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-white text-sm font-medium mb-2">Your Name</label>
                  <input
                    [(ngModel)]="playerName"
                    placeholder="Enter your name"
                    class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button 
                  (click)="joinGame()"
                  [disabled]="isLoading"
                  class="w-full bg-purple-500 hover:bg-purple-500/90 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  <span *ngIf="isLoading">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Joining...
                  </span>
                  <span *ngIf="!isLoading">Join Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div class="grid sm:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="bg-green-500/10 p-4 rounded-xl inline-block mb-4">
              <i class="fas fa-users text-green-400 text-2xl"></i>
            </div>
            <h4 class="font-semibold mb-2 text-white">Real-time Multiplayer</h4>
            <p class="text-slate-400 text-sm">Play with friends in real-time with instant updates</p>
          </div>
          <div class="text-center">
            <div class="bg-yellow-500/10 p-4 rounded-xl inline-block mb-4">
              <i class="fas fa-brain text-yellow-400 text-2xl"></i>
            </div>
            <h4 class="font-semibold mb-2 text-white">Strategic Thinking</h4>
            <p class="text-slate-400 text-sm">Create and arrange situations based on hidden numbers</p>
          </div>
          <div class="text-center">
            <div class="bg-purple-500/10 p-4 rounded-xl inline-block mb-4">
              <i class="fas fa-trophy text-purple-400 text-2xl"></i>
            </div>
            <h4 class="font-semibold mb-2 text-white">Collaborative Fun</h4>
            <p class="text-slate-400 text-sm">Work together in the free-hand round</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: hsl(263 70% 50%); }
    .bg-primary { background-color: hsl(263 70% 50%); }
    .bg-primary\\/10 { background-color: hsla(263 70% 50% / 0.1); }
    .border-primary { border-color: hsl(263 70% 50%); }
    .border-primary\\/20 { border-color: hsla(263 70% 50% / 0.2); }
    .border-primary\\/50 { border-color: hsla(263 70% 50% / 0.5); }
  `]
})
export class HomeComponent {
  hostName = '';
  roomCode = '';
  playerName = '';
  isLoading = false;

  constructor(
    private gameService: GameService,
    private router: Router
  ) {}

  onRoomCodeChange(event: any): void {
    this.roomCode = event.target.value.toUpperCase();
  }

  createGame(): void {
    if (!this.hostName.trim()) {
      alert('Please enter your name');
      return;
    }

    this.isLoading = true;
    this.gameService.createGame({ hostName: this.hostName }).subscribe({
      next: (response) => {
        this.gameService.updateGameState({
          gameId: response.game.id,
          roomCode: response.game.roomCode,
          playerId: response.host.id,
          isHost: true,
          status: 'LOBBY',
          players: [response.host]
        });
        this.router.navigate(['/lobby']);
      },
      error: (error) => {
        console.error('Failed to create game:', error);
        alert('Failed to create game');
        this.isLoading = false;
      }
    });
  }

  joinGame(): void {
    if (!this.roomCode.trim() || !this.playerName.trim()) {
      alert('Please enter both room code and your name');
      return;
    }

    this.isLoading = true;
    this.gameService.joinGame(this.roomCode, { playerName: this.playerName }).subscribe({
      next: (response) => {
        this.gameService.updateGameState({
          gameId: response.game.id,
          roomCode: response.game.roomCode,
          playerId: response.player.id,
          isHost: false,
          status: response.game.status
        });
        this.router.navigate(['/lobby']);
      },
      error: (error) => {
        console.error('Failed to join game:', error);
        alert('Failed to join game');
        this.isLoading = false;
      }
    });
  }
}