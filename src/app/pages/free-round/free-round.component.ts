import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { GameState, SituationWithPlayer } from '../../models/game.models';

@Component({
  selector: 'app-free-round',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Free Round</h1>
            <p class="text-slate-400">Collaborate to arrange all situations together</p>
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

        <!-- Instructions -->
        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
          <div class="flex items-center text-blue-400 mb-2">
            <i class="fas fa-info-circle mr-2"></i>
            <span class="font-medium">Free Round</span>
          </div>
          <p class="text-blue-300 text-sm">
            Now everyone can see and rearrange all situations. Work together to find the best order before revealing the results!
          </p>
        </div>

        <!-- Collaborative Drag and Drop Area -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold text-white">Arrange All Situations</h3>
            <div class="text-slate-400 text-sm">
              Everyone can drag and rearrange
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
                [class.ring-2]="situation.playerId === gameState.playerId"
                [class.ring-primary]="situation.playerId === gameState.playerId"
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
                    <div class="flex-1">
                      <p class="text-white font-medium">{{ situation.content }}</p>
                      <div class="flex items-center space-x-2 text-slate-400 text-sm">
                        <span>by {{ situation.player.name }}</span>
                        <span *ngIf="situation.playerId === gameState.playerId" class="text-primary">
                          (Your situation)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-slate-400 text-sm">#{{ i + 1 }}</span>
                    <i class="fas fa-grip-vertical text-slate-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Show Results Button (Host Only) -->
          <div class="mt-6 text-center" *ngIf="gameState.isHost">
            <button 
              (click)="showResults()"
              [disabled]="isShowingResults"
              class="bg-green-500 hover:bg-green-500/90 text-white font-medium py-3 px-8 rounded-md transition-colors disabled:opacity-50"
            >
              <span *ngIf="isShowingResults">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Loading Results...
              </span>
              <span *ngIf="!isShowingResults">Show Results</span>
            </button>
          </div>

          <!-- Waiting for Host -->
          <div class="mt-6 text-center" *ngIf="!gameState.isHost">
            <div class="text-slate-400">
              <i class="fas fa-clock mr-2"></i>
              Waiting for host to show results...
            </div>
          </div>
        </div>

        <!-- Players Activity -->
        <div class="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">Players</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              *ngFor="let player of gameState.players"
              class="flex items-center space-x-2"
            >
              <div 
                class="w-3 h-3 rounded-full"
                [style.background-color]="player.color"
              ></div>
              <span class="text-white text-sm">{{ player.name }}</span>
              <span 
                *ngIf="player.isHost"
                class="text-primary text-xs"
              >
                (Host)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: hsl(263 70% 50%); }
    .ring-primary { --tw-ring-color: hsl(263 70% 50%); }
    .situation-card:hover { transform: translateY(-2px); }
  `]
})
export class FreeRoundComponent implements OnInit, OnDestroy {
  gameState!: GameState;
  connected = false;
  isShowingResults = false;
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
        if (!state.roomCode || state.status !== 'FREE_ROUND') {
          this.router.navigate(['/']);
          return;
        }
        
        if (state.status === 'SHOW_RESULTS') {
          this.router.navigate(['/results']);
        }
      })
    );

    this.subscriptions.add(
      this.socketService.connected$.subscribe(connected => {
        this.connected = connected;
      })
    );

    // Listen for position updates
    this.subscriptions.add(
      this.socketService.on('situationPositionUpdated').subscribe((data: any) => {
        const situations = this.gameState.situations.map(s => 
          s.id === data.situationId ? { ...s, position: data.position } : s
        );
        this.gameService.updateGameState({ situations });
      })
    );

    this.subscriptions.add(
      this.socketService.on('resultsReady').subscribe(() => {
        this.gameService.updateGameState({ status: 'SHOW_RESULTS' });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get sortedSituations(): SituationWithPlayer[] {
    return [...this.gameState.situations].sort((a, b) => a.position - b.position);
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

  showResults(): void {
    if (!this.gameState.roomCode) return;

    this.isShowingResults = true;
    this.gameService.showResults(this.gameState.roomCode).subscribe({
      next: () => {
        this.gameService.updateGameState({ status: 'SHOW_RESULTS' });
      },
      error: (error) => {
        console.error('Failed to show results:', error);
        this.isShowingResults = false;
      }
    });
  }
}