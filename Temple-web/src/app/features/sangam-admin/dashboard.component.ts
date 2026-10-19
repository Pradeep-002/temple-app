import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-sangam-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <!-- Title Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            {{ api.currentUser()?.sangamName || 'Sangam' }} • {{ i1n.t('dashboard') }}
          </h1>
          <p class="text-xs text-slate-500">Real-time Financial & Member Summary</p>
        </div>

        <div class="flex gap-2">
          <a routerLink="/collections" class="btn-gold text-xs">
            📊 {{ api.currentUser()?.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'என் மாதாந்திர வசூல்' : 'My Collections') : (i1n.t('collections') + ' Matrix') }}
          </a>
          <a *ngIf="api.currentUser()?.role !== 'MEMBER'" routerLink="/members" class="btn-primary text-xs">+ {{ i1n.t('members') }}</a>
        </div>
      </div>

      <!-- Financial Metrics Grid (6 Cards matching prompt specification) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div class="glass-card p-6 border-l-4 border-emerald-700">
          <span class="text-xs font-bold text-slate-500 uppercase">{{ i1n.t('totalMembers') }}</span>
          <p class="text-3xl font-extrabold text-slate-900 mt-2">{{ dashboard()?.totalMembers || 0 }}</p>
        </div>

        <div class="glass-card p-6 border-l-4 border-emerald-500">
          <span class="text-xs font-bold text-slate-500 uppercase">{{ i1n.t('thisMonthCollection') }}</span>
          <p class="text-3xl font-extrabold text-emerald-700 mt-2">₹{{ dashboard()?.totalCollection | number:'1.0-0' }}</p>
        </div>

        <div class="glass-card p-6 border-l-4 border-red-500">
          <span class="text-xs font-bold text-slate-500 uppercase">{{ i1n.t('pendingAmount') }}</span>
          <p class="text-3xl font-extrabold text-red-600 mt-2">₹{{ dashboard()?.thisMonthPending | number:'1.0-0' }}</p>
        </div>

        <div class="glass-card p-6 border-l-4 border-amber-500">
          <span class="text-xs font-bold text-slate-500 uppercase">{{ i1n.t('totalDonations') }}</span>
          <p class="text-3xl font-extrabold text-amber-700 mt-2">₹{{ dashboard()?.totalDonations | number:'1.0-0' }}</p>
        </div>

        <div class="glass-card p-6 border-l-4 border-purple-500">
          <span class="text-xs font-bold text-slate-500 uppercase">{{ i1n.t('totalExpenses') }}</span>
          <p class="text-3xl font-extrabold text-purple-700 mt-2">₹{{ dashboard()?.totalExpenses | number:'1.0-0' }}</p>
        </div>

        <div class="glass-card p-6 border-l-4 border-blue-600 bg-blue-50/50">
          <span class="text-xs font-bold text-blue-800 uppercase">{{ i1n.t('availableBalance') }} (Ledger)</span>
          <p class="text-3xl font-extrabold text-blue-900 mt-2">₹{{ dashboard()?.availableBalance | number:'1.2-2' }}</p>
        </div>
      </div>

      <!-- RECENT ACTIVITIES & QUICK LINKS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 glass-card p-6">
          <h3 class="text-lg font-bold text-slate-900 mb-4">Recent Financial Transactions</h3>
          <div *ngIf="loading()" class="py-8 text-center text-xs text-slate-400">Loading activities...</div>
          
          <div *ngIf="!loading() && dashboard()?.recentActivities as activities">
            <div *ngIf="activities.length === 0" class="py-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
            <div class="space-y-3">
              <div *ngFor="let act of activities" class="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded"
                        [class.bg-emerald-100]="act.type === 'COLLECTION'"
                        [class.text-emerald-800]="act.type === 'COLLECTION'"
                        [class.bg-amber-100]="act.type === 'DONATION'"
                        [class.text-amber-800]="act.type === 'DONATION'"
                        [class.bg-red-100]="act.type === 'EXPENSE'"
                        [class.text-red-800]="act.type === 'EXPENSE'">
                    {{ act.type }}
                  </span>
                  <p class="text-sm font-bold text-slate-800 mt-1">{{ act.title }}</p>
                  <p class="text-[10px] text-slate-400">{{ act.date | date:'medium' }}</p>
                </div>
                <div class="text-right">
                  <p class="font-extrabold text-sm" [class.text-emerald-700]="act.type !== 'EXPENSE'" [class.text-red-600]="act.type === 'EXPENSE'">
                    {{ act.type === 'EXPENSE' ? '-' : '+' }}₹{{ act.amount }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="glass-card p-6">
            <h3 class="text-lg font-bold text-slate-900 mb-4">Quick Navigation</h3>
            <div class="space-y-2">
              <a routerLink="/collections" class="block w-full p-3 bg-orange-50 text-orange-950 border border-orange-200 rounded-lg font-bold text-xs hover:bg-orange-100 transition">
                📊 {{ api.currentUser()?.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'என் மாதாந்திர வசூல் விவரம்' : 'My Collections View') : 'Open Dynamic Matrix View' }}
              </a>
              <a *ngIf="api.currentUser()?.role !== 'MEMBER'" routerLink="/members" class="block w-full p-3 bg-slate-50 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-100 transition">
                👥 Manage Members (SGM001...)
              </a>
              <a routerLink="/events" class="block w-full p-3 bg-slate-50 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-100 transition">
                🛕 {{ api.currentUser()?.role === 'MEMBER' ? 'View Temple Events' : 'Kovil Thiruvizha Events' }}
              </a>
              <a routerLink="/donations" class="block w-full p-3 bg-slate-50 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-100 transition">
                🤝 {{ api.currentUser()?.role === 'MEMBER' ? 'View Donations' : 'Record Donations' }}
              </a>
              <a routerLink="/expenses" class="block w-full p-3 bg-slate-50 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-100 transition">
                💸 {{ api.currentUser()?.role === 'MEMBER' ? 'View Expenses' : 'General Expenses' }}
              </a>
              <a routerLink="/ledger" class="block w-full p-3 bg-blue-50 text-blue-900 rounded-lg font-bold text-xs hover:bg-blue-100 transition">
                📜 Financial Ledger Audit
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SangamAdminDashboardComponent implements OnInit {
  loading = signal(true);
  dashboard = signal<any>(null);

  constructor(public i1n: I1nService, public api: ApiService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.api.get<any>('/reports/sangam-dashboard').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.dashboard.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }
}
