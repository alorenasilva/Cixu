import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
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