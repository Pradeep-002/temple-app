import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- HERO SECTION (White Background with Radiant Orange Accents) -->
    <section class="relative bg-white pt-16 pb-20 md:pt-24 md:pb-28 px-4 overflow-hidden border-b border-slate-100">
      <!-- Ambient Orange Glow & Dot Matrix -->
      <div class="absolute inset-0 bg-[radial-gradient(#fed7aa_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>
      <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-orange-200/35 via-amber-100/20 to-transparent blur-3xl pointer-events-none rounded-full"></div>

      <div class="max-w-7xl mx-auto text-center relative z-10">
        <!-- Top Tagline Pill -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-bold mb-6 shadow-xs">
          <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span>{{ i1n.t('tamilAppName') }} • {{ i1n.t('tagline') }}</span>
        </div>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.15]">
          Manage Your Sangam.<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500">Track Every Rupee.</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {{ i1n.t('heroSub') }}
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <button (click)="openRegisterModal()" 
                  class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
            <span>✨ {{ i1n.t('registerSangamBtn') }}</span>
            <span class="text-orange-200">➔</span>
          </button>
          <a routerLink="/login" 
             class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base text-slate-700 bg-white hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
            <span>🔑 {{ i1n.t('loginBtn') }}</span>
          </a>
        </div>

        <!-- Feature Highlight Pills -->
        <div class="mt-14 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div class="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <span class="text-2xl">🏛️</span>
            <div>
              <h4 class="text-xs font-bold text-slate-900">100% Isolation</h4>
              <p class="text-[11px] text-slate-500">Dedicated Tenant DB</p>
            </div>
          </div>
          <div class="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <div>
              <h4 class="text-xs font-bold text-slate-900">Excel Matrix</h4>
              <p class="text-[11px] text-slate-500">12-Month Grid View</p>
            </div>
          </div>
          <div class="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <span class="text-2xl">🛕</span>
            <div>
              <h4 class="text-xs font-bold text-slate-900">Thiruvizha Tracker</h4>
              <p class="text-[11px] text-slate-500">Festival Budgets</p>
            </div>
          </div>
          <div class="bg-white/80 p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <div>
              <h4 class="text-xs font-bold text-slate-900">Instant Receipts</h4>
              <p class="text-[11px] text-slate-500">Auto Numbers & Ledger</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES SECTION -->
    <section id="features" class="py-20 px-4 bg-slate-50/70 border-b border-slate-100">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <span class="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 inline-block mb-2">
            All-In-One Platform
          </span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Complete Sangam Management Solution</h2>
          <p class="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">Built specifically for Village Sangams, Temple Committees, and Community Associations.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">🏛️</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Sangam & Tenant Isolation</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Each Sangam has 100% isolated data security. Millions of Sangams supported on one platform.</p>
          </div>

          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Dynamic Monthly Collection</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Dynamic Excel-style collection matrix. Automatically generates expected slots and tracks pending rupee-by-rupee.</p>
          </div>

          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">🛕</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Temple Festival & Expenses</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Manage Kovil Thiruvizha expenses (Melam, Pandhal, Arch, Serial Lights) with real-time budget tracking.</p>
          </div>

          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">📜</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Double-Entry Financial Ledger</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Every payment, donation, and expense is recorded in an immutable ledger with automated balance calculation.</p>
          </div>

          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">🌐</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Tamil + English i18n</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Full bi-lingual support across web and mobile. Switch languages seamlessly with a single click.</p>
          </div>

          <div class="bg-white p-7 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">📱</div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-2">Mobile Agent App</h3>
            <p class="text-slate-600 text-xs leading-relaxed">Collection agents can collect payments on-the-go via Android & iOS mobile apps with receipt generation.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how-it-works" class="py-20 bg-white px-4 border-b border-slate-100">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <span class="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 inline-block mb-2">
            Simple 4-Step Process
          </span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">How Oor Nithi Works</h2>
          <p class="text-slate-600 max-w-xl mx-auto text-sm">Get your Sangam digitized and running within minutes.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div class="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 hover:border-orange-200 hover:bg-white shadow-xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold mx-auto mb-4 flex items-center justify-center shadow-md shadow-orange-500/20 text-base">1</div>
            <h4 class="font-bold text-base text-slate-900 mb-2">Register Sangam</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Sign up your Sangam details & Admin account in 2 minutes.</p>
          </div>
          <div class="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 hover:border-orange-200 hover:bg-white shadow-xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold mx-auto mb-4 flex items-center justify-center shadow-md shadow-orange-500/20 text-base">2</div>
            <h4 class="font-bold text-base text-slate-900 mb-2">Add Members</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Add Sangam members with auto-generated Member Codes (SGM001).</p>
          </div>
          <div class="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 hover:border-orange-200 hover:bg-white shadow-xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold mx-auto mb-4 flex items-center justify-center shadow-md shadow-orange-500/20 text-base">3</div>
            <h4 class="font-bold text-base text-slate-900 mb-2">Configure Cycle</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Set monthly amount (e.g. ₹500) & collection cycle tenure.</p>
          </div>
          <div class="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 hover:border-orange-200 hover:bg-white shadow-xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold mx-auto mb-4 flex items-center justify-center shadow-md shadow-orange-500/20 text-base">4</div>
            <h4 class="font-bold text-base text-slate-900 mb-2">Track Financials</h4>
            <p class="text-xs text-slate-500 leading-relaxed">Collect payments, manage Thiruvizha expenses & view ledger reports.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING SECTION -->
    <section id="pricing" class="py-20 px-4 bg-slate-50/50">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <span class="text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3.5 py-1 rounded-full border border-orange-200 inline-block mb-2">
            Fair & Transparent
          </span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Simple Pricing for Every Sangam</h2>
          <p class="text-slate-600 max-w-xl mx-auto text-sm">No hidden charges. Start for free and upgrade as your Sangam grows.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-md transition">
            <span class="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full uppercase">Free Trial</span>
            <h3 class="text-2xl font-bold text-slate-900 mt-4">1 Month Free</h3>
            <p class="text-4xl font-extrabold text-slate-900 my-4">₹0</p>
            <ul class="text-xs text-slate-600 space-y-3 mb-8 text-left max-w-xs mx-auto">
              <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> 100 Members Limit</li>
              <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Full Dynamic Monthly Collection Matrix</li>
              <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Temple Event & Expense Tracking</li>
              <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">✓</span> Tamil + English Support</li>
            </ul>
            <button (click)="openRegisterModal()" class="btn-primary w-full text-xs py-3 font-bold">Start 1-Month Free Trial</button>
          </div>

          <div class="bg-white p-8 rounded-2xl border-2 border-orange-500 text-center relative shadow-xl shadow-orange-500/10">
            <span class="text-xs font-bold bg-orange-500 text-white px-3.5 py-1 rounded-full uppercase absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">Popular</span>
            <h3 class="text-2xl font-bold text-slate-900 mt-4">Yearly Plan</h3>
            <p class="text-4xl font-extrabold text-orange-600 my-4">₹2,999 <span class="text-sm font-normal text-slate-500">/year</span></p>
            <ul class="text-xs text-slate-600 space-y-3 mb-8 text-left max-w-xs mx-auto">
              <li class="flex items-center gap-2"><span class="text-orange-500 font-bold">✓</span> Up to 1,000 Members</li>
              <li class="flex items-center gap-2"><span class="text-orange-500 font-bold">✓</span> Unlimited Collection Agents</li>
              <li class="flex items-center gap-2"><span class="text-orange-500 font-bold">✓</span> Unlimited Temple Events & Expenses</li>
              <li class="flex items-center gap-2"><span class="text-orange-500 font-bold">✓</span> Double-Entry Financial Ledger & PDF Reports</li>
            </ul>
            <button (click)="openRegisterModal()" class="btn-gold w-full text-xs py-3 font-bold shadow-md">Get Started Now →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- REGISTRATION WIZARD MODAL -->
    <div *ngIf="showRegisterModal()" class="modal-overlay">
      <div class="modal-content max-w-lg w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-900">Register Your Sangam / சங்கம் பதிவு</h3>
          <button (click)="closeRegisterModal()" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <!-- Step Indicators -->
        <div class="flex justify-between items-center mb-6 text-xs font-bold text-slate-400">
          <span [class.text-orange-600]="regStep() === 1" [class.font-extrabold]="regStep() === 1">1. Sangam</span>
          <span [class.text-orange-600]="regStep() === 2" [class.font-extrabold]="regStep() === 2">2. Contact</span>
          <span [class.text-orange-600]="regStep() === 3" [class.font-extrabold]="regStep() === 3">3. Admin</span>
          <span [class.text-orange-600]="regStep() === 4" [class.font-extrabold]="regStep() === 4">4. Password</span>
        </div>

        <!-- STEP 1: SANGAM DETAILS -->
        <div *ngIf="regStep() === 1" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Sangam Name *</label>
            <input type="text" [(ngModel)]="regForm.sangamName" placeholder="e.g. Sri Mariamman Temple Sangam" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Registration Number (Optional)</label>
            <input type="text" [(ngModel)]="regForm.registrationNumber" placeholder="e.g. REG/2026/001" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Village / Area</label>
              <input type="text" [(ngModel)]="regForm.village" placeholder="Village" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">District</label>
              <input type="text" [(ngModel)]="regForm.district" placeholder="District" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>
          <button (click)="regStep.set(2)" [disabled]="!regForm.sangamName" class="btn-gold w-full mt-4">Next: Contact Info →</button>
        </div>

        <!-- STEP 2: CONTACT INFO -->
        <div *ngIf="regStep() === 2" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Sangam Mobile Number *</label>
            <input type="text" [(ngModel)]="regForm.sangamMobile" placeholder="10-digit Mobile Number" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Sangam Email (Optional)</label>
            <input type="email" [(ngModel)]="regForm.sangamEmail" placeholder="sangam@gmail.com" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div class="flex gap-2">
            <button (click)="regStep.set(1)" class="btn-primary bg-slate-500 w-1/3">← Back</button>
            <button (click)="regStep.set(3)" [disabled]="!regForm.sangamMobile" class="btn-gold w-2/3">Next: Admin Info →</button>
          </div>
        </div>

        <!-- STEP 3: ADMIN DETAILS -->
        <div *ngIf="regStep() === 3" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Admin Name *</label>
            <input type="text" [(ngModel)]="regForm.adminName" placeholder="e.g. S. Nagaraj" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Admin Mobile Number *</label>
            <input type="text" [(ngModel)]="regForm.adminMobile" placeholder="10-digit Mobile Number" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div class="flex gap-2">
            <button (click)="regStep.set(2)" class="btn-primary bg-slate-500 w-1/3">← Back</button>
            <button (click)="regStep.set(4)" [disabled]="!regForm.adminName || !regForm.adminMobile" class="btn-gold w-2/3">Next: Security →</button>
          </div>
        </div>

        <!-- STEP 4: SECURITY -->
        <div *ngIf="regStep() === 4" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Password *</label>
            <input type="password" [(ngModel)]="regForm.password" placeholder="••••••••" class="w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>
          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-2 rounded">
            {{ errorMessage() }}
          </div>
          <div class="flex gap-2">
            <button (click)="regStep.set(3)" class="btn-primary bg-slate-500 w-1/3">← Back</button>
            <button (click)="submitRegistration()" [disabled]="!regForm.password || loading()" class="btn-gold w-2/3">
              {{ loading() ? 'Registering...' : 'Complete Registration ✨' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LandingComponent {
  showRegisterModal = signal(false);
  regStep = signal(1);
  loading = signal(false);
  errorMessage = signal('');

  regForm = {
    sangamName: '',
    registrationNumber: '',
    village: '',
    district: '',
    sangamMobile: '',
    sangamEmail: '',
    adminName: '',
    adminMobile: '',
    password: ''
  };

  constructor(public i1n: I1nService, private api: ApiService, private router: Router) {}

  openRegisterModal() {
    this.showRegisterModal.set(true);
    this.regStep.set(1);
    this.errorMessage.set('');
  }

  closeRegisterModal() {
    this.showRegisterModal.set(false);
  }

  submitRegistration() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.post<any>('/auth/register-sangam', this.regForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.api.saveSession(res.data);
          this.closeRegisterModal();
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Please check your mobile numbers.');
      }
    });
  }
}
