import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { GameState, SituationWithPlayer } from '../../models/game.models';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              Round {{ gameState.currentRound?.roundNumber }}
            </h1>
            <p class="text-slate-400">{{ gameState.currentPrompt?.text }}</p>
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

        <!-- Create Situation Section -->
        <div *ngIf="!hasCreatedSituation" class="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
          <h3 class="text-xl font-semibold text-white mb-4">Create Your Situation</h3>
          <p class="text-slate-400 mb-4">
            Create a situation that fits the prompt. You'll be assigned a secret number (0-100) that others will try to guess by arranging situations in order.
          </p>
          <div class="space-y-4">
            <textarea
              [(ngModel)]="situationContent"
              placeholder="Describe your situation..."
              rows="3"
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
            <button 
              (click)="createSituation()"
              [disabled]="isCreating || !situationContent.trim()"
              class="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
            >
              <span *ngIf="isCreating">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Creating...
              </span>
              <span *ngIf="!isCreating">Create Situation</span>
            </button>
          </div>
        </div>

        <!-- Waiting for Others -->
        <div *ngIf="hasCreatedSituation && !allSituationsCreated" class="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-8 text-center">
          <i class="fas fa-clock text-slate-400 text-3xl mb-4"></i>
          <h3 class="text-xl font-semibold text-white mb-2">Situation Created!</h3>
          <p class="text-slate-400">Waiting for other players to create their situations...</p>
          <div class="mt-4">
            <div class="flex justify-center space-x-2">
              <div 
                *ngFor="let player of gameState.players"
                class="w-3 h-3 rounded-full"
                [class]="getPlayerStatusClass(player.id)"
              ></div>
            </div>
          </div>
        </div>

        <!-- Drag and Drop Area -->
        <div *ngIf="allSituationsCreated" class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-white">Arrange the Situations</h3>
            <div class="text-slate-400 text-sm">
              Drag to arrange from lowest (0) to highest (100)
            </div>
          </div>

          <!-- Scale -->
          <div class="relative mb-8">
            <div class="flex justify-between text-slate-400 text-sm mb-2">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <div class="h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"></div>
          </div>

          <!-- Drop Zone -->
          <div 
            class="min-h-96 border-2 border-dashed border-slate-600 rounded-lg p-4 relative"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)"
          >
            <div class="grid grid-cols-1 gap-4">
              <div 
                *ngFor="let situation of sortedSituations; let i = index"
                class="situation-card bg-slate-700 border border-slate-600 rounded-lg p-4 cursor-move transition-all hover:border-slate-500"
                [class.opacity-50]="draggedItem?.id === situation.id"
                draggable="true"
                (dragstart)="onDragStart($event, situation)"
                (dragend)="onDragEnd($event)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div 
                      class="w-4 h-4 rounded-full"
                      [style.background-color]="situation.player.color"
                    ></div>
                    <div>
                      <p class="text-white font-medium">{{ situation.content }}</p>
                      <p class="text-slate-400 text-sm">by {{ situation.player.name }}</p>
                    </div>
                  </div>
                  <div class="text-slate-400">
                    <i class="fas fa-grip-vertical"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="mt-6 text-center">
            <button 
              (click)="submitArrangement()"
              [disabled]="isSubmitting"
              class="bg-green-500 hover:bg-green-500/90 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50"
            >
              <span *ngIf="isSubmitting">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Submitting...
              </span>
              <span *ngIf="!isSubmitting">Submit Arrangement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: hsl(263 70% 50%); }
    .bg-primary { background-color: hsl(263 70% 50%); }
    .situation-card:hover { transform: translateY(-2px); }
  `]
})
export class GamePlayComponent implements OnInit, OnDestroy {
  gameState!: GameState;
  connected = false;
  situationContent = '';
  isCreating = false;
  isSubmitting = false;
  draggedItem: SituationWithPlayer | null = null;
  
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
        if (!state.roomCode || state.status !== 'IN_PROGRESS') {
          this.router.navigate(['/']);
          return;
        }
        
        if (state.status === 'FREE_ROUND') {
          this.router.navigate(['/free-round']);
        } else if (state.status === 'SHOW_RESULTS') {
          this.router.navigate(['/results']);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.connected$.subscribe(connected => {
        this.connected = connected;
      })
    );

    // Listen for game events
    this.subscriptions.add(
      this.socketService.on('situationCreated').subscribe((situation: SituationWithPlayer) => {
        const currentSituations = this.gameState.situations;
        this.gameService.updateGameState({
          situations: [...currentSituations, situation]
        });
      })
    );

    this.subscriptions.add(
      this.socketService.on('situationPositionUpdated').subscribe((data: any) => {
        const situations = this.gameState.situations.map(s => 
          s.id === data.situationId ? { ...s, position: data.position } : s
        );
        this.gameService.updateGameState({ situations });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get hasCreatedSituation(): boolean {
    return this.gameState.situations.some(s => s.playerId === this.gameState.playerId);
  }

  get allSituationsCreated(): boolean {
    return this.gameState.situations.length === this.gameState.players.length;
  }

  get sortedSituations(): SituationWithPlayer[] {
    return [...this.gameState.situations].sort((a, b) => a.position - b.position);
  }

  getPlayerStatusClass(playerId: string): string {
    const hasCreated = this.gameState.situations.some(s => s.playerId === playerId);
    return hasCreated ? 'bg-green-400' : 'bg-slate-600';
  }

  createSituation(): void {
    if (!this.situationContent.trim() || !this.gameState.roomCode || !this.gameState.playerId) return;

    this.isCreating = true;
    this.gameService.createSituation(this.gameState.roomCode, {
      content: this.situationContent.trim(),
      position: this.gameState.situations.length,
      playerId: this.gameState.playerId
    }).subscribe({
      next: () => {
        this.situationContent = '';
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Failed to create situation:', error);
        this.isCreating = false;
      }
    });
  }

  onDragStart(event: DragEvent, situation: SituationWithPlayer): void {
    this.draggedItem = situation;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', situation.id);
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedItem = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.draggedItem) return;

    const dropZone = event.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const newPosition = Math.floor((y / rect.height) * this.gameState.situations.length);

    this.updateSituationPosition(this.draggedItem.id, newPosition);
  }

  updateSituationPosition(situationId: string, newPosition: number): void {
    if (!this.gameState.roomCode) return;

    this.gameService.updateSituationPosition(situationId, {
      position: newPosition,
      roomCode: this.gameState.roomCode
    }).subscribe({
      error: (error) => {
        console.error('Failed to update position:', error);
      }
    });
  }

  submitArrangement(): void {
    if (!this.gameState.roomCode) return;

    this.isSubmitting = true;
    this.gameService.startFreeRound(this.gameState.roomCode).subscribe({
      next: () => {
        this.gameService.updateGameState({ status: 'FREE_ROUND' });
      },
      error: (error) => {
        console.error('Failed to submit arrangement:', error);
        this.isSubmitting = false;
      }
    });
  }
}