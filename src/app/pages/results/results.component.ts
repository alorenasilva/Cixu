import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { GameState, ResultsData } from '../../models/game.models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Round Results</h1>
            <p class="text-slate-400">See how well you arranged the situations!</p>
          </div>
          <div class="text-right">
            <div class="bg-slate-800 px-4 py-2 rounded-lg mb-2">
              <span class="text-slate-400 text-sm">Room:</span>
              <span class="text-white font-mono font-bold ml-2">{{ gameState.roomCode }}</span>
            </div>
            <div class="flex items-center text-green-400" *ngIf="connected">
              <i class="fas fa-circle text-xs mr-2"></i>
              <span class="text-sm">Connected</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-16">
          <i class="fas fa-spinner fa-spin text-primary text-4xl mb-4"></i>
          <p class="text-white text-xl">Calculating results...</p>
        </div>

        <!-- Results Content -->
        <div *ngIf="!isLoading && resultsData" class="space-y-8">
          <!-- Accuracy Score -->
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
            <h3 class="text-2xl font-semibold text-white mb-4">Team Accuracy</h3>
            <div class="relative inline-block">
              <div class="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                {{ Math.round(resultsData.accuracy) }}%
              </div>
              <div class="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-full blur-xl -z-10"></div>
            </div>
            <p class="text-slate-400 mt-4">
              {{ getAccuracyMessage(resultsData.accuracy) }}
            </p>
          </div>

          <!-- Comparison -->
          <div class="grid lg:grid-cols-2 gap-8">
            <!-- Your Arrangement -->
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 class="text-xl font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-users text-blue-400 mr-2"></i>
                Your Team's Arrangement
              </h3>
              <div class="space-y-3">
                <div 
                  *ngFor="let situation of resultsData.playerOrder; let i = index"
                  class="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg"
                >
                  <div class="bg-blue-500/20 text-blue-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                    {{ i + 1 }}
                  </div>
                  <div 
                    class="w-3 h-3 rounded-full"
                    [style.background-color]="situation.player.color"
                  ></div>
                  <div class="flex-1">
                    <p class="text-white font-medium">{{ situation.content }}</p>
                    <p class="text-slate-400 text-sm">by {{ situation.player.name }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actual Order -->
            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 class="text-xl font-semibold text-white mb-4 flex items-center">
                <i class="fas fa-trophy text-yellow-400 mr-2"></i>
                Actual Order (by secret numbers)
              </h3>
              <div class="space-y-3">
                <div 
                  *ngFor="let situation of resultsData.actualOrder; let i = index"
                  class="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg"
                >
                  <div class="bg-yellow-500/20 text-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                    {{ i + 1 }}
                  </div>
                  <div 
                    class="w-3 h-3 rounded-full"
                    [style.background-color]="situation.player.color"
                  ></div>
                  <div class="flex-1">
                    <p class="text-white font-medium">{{ situation.content }}</p>
                    <div class="flex items-center justify-between">
                      <p class="text-slate-400 text-sm">by {{ situation.player.name }}</p>
                      <span class="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                        {{ situation.number }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual Performance -->
          <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">Individual Contributions</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div 
                *ngFor="let situation of resultsData.actualOrder"
                class="bg-slate-700/50 rounded-lg p-4"
              >
                <div class="flex items-center space-x-2 mb-2">
                  <div 
                    class="w-4 h-4 rounded-full"
                    [style.background-color]="situation.player.color"
                  ></div>
                  <span class="text-white font-medium">{{ situation.player.name }}</span>
                </div>
                <p class="text-slate-300 text-sm mb-2">{{ situation.content }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 text-xs">Secret number:</span>
                  <span class="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">
                    {{ situation.number }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="text-center space-y-4">
            <div *ngIf="gameState.isHost" class="space-x-4">
              <button 
                (click)="startNextRound()"
                [disabled]="isStartingNext"
                class="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50"
              >
                <span *ngIf="isStartingNext">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Starting...
                </span>
                <span *ngIf="!isStartingNext">Start Next Round</span>
              </button>
              <button 
                (click)="endGame()"
                class="bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 px-8 rounded-md transition-colors"
              >
                End Game
              </button>
            </div>
            <div *ngIf="!gameState.isHost" class="text-slate-400">
              <i class="fas fa-clock mr-2"></i>
              Waiting for host to decide next action...
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
export class ResultsComponent implements OnInit, OnDestroy {
  gameState!: GameState;
  connected = false;
  isLoading = true;
  isStartingNext = false;
  resultsData: ResultsData | null = null;
  Math = Math;
  
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
        } else if (state.status === 'COMPLETED') {
          // Could show final game summary
        }
      })
    );

    this.subscriptions.add(
      this.socketService.connected$.subscribe(connected => {
        this.connected = connected;
      })
    );

    // Load results data
    this.loadResults();

    this.subscriptions.add(
      this.socketService.on('nextRoundStarted').subscribe(() => {
        this.gameService.updateGameState({ status: 'IN_PROGRESS' });
      })
    );

    this.subscriptions.add(
      this.socketService.on('gameEnded').subscribe(() => {
        this.gameService.updateGameState({ status: 'COMPLETED' });
        this.router.navigate(['/']);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadResults(): void {
    if (!this.gameState.roomCode) return;

    this.gameService.showResults(this.gameState.roomCode).subscribe({
      next: (data) => {
        this.resultsData = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load results:', error);
        this.isLoading = false;
      }
    });
  }

  getAccuracyMessage(accuracy: number): string {
    if (accuracy >= 90) return "Incredible! You're mind readers! 🔮";
    if (accuracy >= 80) return "Excellent teamwork! 🎯";
    if (accuracy >= 70) return "Great job! You're getting the hang of it! 👏";
    if (accuracy >= 60) return "Good effort! Room for improvement! 💪";
    if (accuracy >= 50) return "Not bad! Keep practicing! 📈";
    return "Challenging round! Try a different strategy! 🤔";
  }

  startNextRound(): void {
    if (!this.gameState.roomCode) return;

    this.isStartingNext = true;
    this.gameService.startNextRound(this.gameState.roomCode).subscribe({
      next: () => {
        // Socket event will handle navigation
      },
      error: (error) => {
        console.error('Failed to start next round:', error);
        this.isStartingNext = false;
      }
    });
  }

  endGame(): void {
    this.gameService.resetGameState();
    this.router.navigate(['/']);
  }
}