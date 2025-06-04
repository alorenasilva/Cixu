import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div class="text-center">
        <div class="mb-8">
          <i class="fas fa-question-circle text-slate-400 text-6xl mb-4"></i>
          <h1 class="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p class="text-slate-400 text-lg">The page you're looking for doesn't exist.</p>
        </div>
        
        <a 
          routerLink="/"
          class="inline-flex items-center bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-md transition-colors"
        >
          <i class="fas fa-home mr-2"></i>
          Back to Home
        </a>
      </div>
    </div>
  `,
  styles: [`
    .text-primary { color: hsl(263 70% 50%); }
    .bg-primary { background-color: hsl(263 70% 50%); }
  `]
})
export class NotFoundComponent {}