import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="glass-card max-w-md w-full p-8 space-y-6 shadow-2xl">
        <div class="text-center">
          <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-3xl rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-orange-500/25">
            ஊ
          </div>
          <h2 class="text-2xl font-bold text-slate-900">
            {{ i1n.t('loginBtn') }} • {{ i1n.t('appName') }}
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            {{ i1n.t('tagline') }}
          </p>
        </div>

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              {{ i1n.t('mobileNumber') }} *
            </label>
            <input 
              type="text" 
              [(ngModel)]="mobileNumber" 
              name="mobileNumber" 
              placeholder="10-digit Mobile Number" 
              required 
              class="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Password / கடவுச்சொல் *
            </label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              placeholder="••••••••" 
              required 
              class="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            ⚠️ {{ errorMessage() }}
          </div>

          <button 
            type="submit" 
            [disabled]="loading() || !mobileNumber || !password" 
            class="btn-gold w-full py-3 text-sm shadow-md transition hover:scale-[1.01]">
            {{ loading() ? 'Logging in...' : 'Login to Your Sangam →' }}
          </button>
        </form>

        <div class="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
          Super Admin Demo: <span class="font-bold text-slate-800">9999999999</span> | Password: <span class="font-bold text-slate-800">admin123</span>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  mobileNumber = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor(public i1n: I1nService, private api: ApiService, private router: Router) {}

  login() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.post<any>('/auth/login', { mobileNumber: this.mobileNumber, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.api.saveSession(res.data);
          if (res.data.role === 'SUPER_ADMIN') {
            this.router.navigate(['/super-admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }
}
