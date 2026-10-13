import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { I1nService } from '../core/services/i18n.service';
import { ApiService } from '../core/services/api.service';
import { ThemeService, AVAILABLE_THEMES } from '../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- 1. PUBLIC TOPBAR (Displayed on Landing Page '/' and Login '/login') -->
    <ng-container *ngIf="isPublicPage()">
      <nav class="bg-white/95 backdrop-blur-md text-slate-800 shadow-xs border-b border-slate-200/80 sticky top-0 z-50 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Brand Logo -->
            <div class="flex items-center space-x-3 cursor-pointer" routerLink="/">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-extrabold text-xl text-white shadow-md shadow-orange-500/20">
                ஊ
              </div>
              <div>
                <span class="text-xl font-bold tracking-tight text-slate-900">{{ i1n.t('appName') }}</span>
                <span class="block text-xs text-orange-600 font-semibold">{{ i1n.t('tagline') }}</span>
              </div>
            </div>

            <!-- Public Links -->
            <div class="hidden md:flex items-center space-x-5 text-sm font-medium">
              <button (click)="scrollToSection('features')" class="text-xs font-bold text-slate-600 hover:text-orange-600 transition">
                Features
              </button>
              <button (click)="scrollToSection('how-it-works')" class="text-xs font-bold text-slate-600 hover:text-orange-600 transition">
                How It Works
              </button>
              <button (click)="scrollToSection('pricing')" class="text-xs font-bold text-slate-600 hover:text-orange-600 transition">
                Pricing
              </button>

              <ng-container *ngIf="!api.currentUser()">
                <a routerLink="/login" class="text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50/50 transition shadow-xs">
                  {{ i1n.t('loginBtn') }}
                </a>
              </ng-container>

              <ng-container *ngIf="api.currentUser() as user">
                <a [routerLink]="user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard'" 
                   class="btn-primary text-xs py-2 px-4 shadow-md flex items-center gap-1.5">
                  <span>Go to Dashboard</span>
                  <span>➔</span>
                </a>
              </ng-container>

              <!-- Theme Palette Selector -->
              <div class="relative">
                <button 
                  (click)="themeMenuOpen.set(!themeMenuOpen())"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-700 transition">
                  <span class="w-3 h-3 rounded-full shadow-xs" [style.backgroundColor]="getThemeDot(theme.currentTheme())"></span>
                  <span>🎨 Theme</span>
                  <span class="text-[9px] opacity-70">▼</span>
                </button>

                <div *ngIf="themeMenuOpen()" class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div class="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Theme Color
                  </div>
                  <button *ngFor="let t of availableThemes" 
                          (click)="selectTheme(t.id)" 
                          class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition"
                          [class.font-bold]="theme.currentTheme() === t.id">
                    <div class="flex items-center gap-2.5">
                      <span class="w-3.5 h-3.5 rounded-full shadow-sm" [style.backgroundColor]="t.badgeHex"></span>
                      <span>{{ t.name }}</span>
                    </div>
                    <span *ngIf="theme.currentTheme() === t.id" class="text-xs text-orange-600 font-bold">✓</span>
                  </button>
                </div>
              </div>

              <!-- Language Switcher -->
              <div class="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                <button 
                  (click)="i1n.setLanguage('en')" 
                  [class.bg-white]="i1n.currentLang() === 'en'"
                  [class.text-orange-600]="i1n.currentLang() === 'en'"
                  [class.shadow-xs]="i1n.currentLang() === 'en'"
                  [class.text-slate-600]="i1n.currentLang() !== 'en'"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg transition">EN</button>
                <button 
                  (click)="i1n.setLanguage('ta')" 
                  [class.bg-white]="i1n.currentLang() === 'ta'"
                  [class.text-orange-600]="i1n.currentLang() === 'ta'"
                  [class.shadow-xs]="i1n.currentLang() === 'ta'"
                  [class.text-slate-600]="i1n.currentLang() !== 'ta'"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg transition">தமிழ்</button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </ng-container>

    <!-- 2. AUTHENTICATED DASHBOARD LAYOUT (Only on Authenticated Pages) -->
    <ng-container *ngIf="!isPublicPage() && api.currentUser() as user">
      <!-- Mobile Backdrop -->
      <div 
        *ngIf="sidebarMobileOpen()" 
        (click)="sidebarMobileOpen.set(false)" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity">
      </div>

      <!-- LEFT SIDEBAR -->
      <aside 
        [class.-translate-x-full]="!sidebarMobileOpen()"
        [class.translate-x-0]="sidebarMobileOpen()"
        [class.w-64]="!theme.isCollapsed()"
        [class.w-20]="theme.isCollapsed()"
        class="fixed top-0 left-0 bottom-0 theme-bg-sidebar text-white z-50 flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out md:translate-x-0 border-r theme-border-sidebar">
        
        <div>
          <!-- Sidebar Brand Header + Collapse Toggle -->
          <div class="p-4 border-b theme-border-sidebar flex items-center justify-between">
            <div class="flex items-center space-x-3 cursor-pointer overflow-hidden" routerLink="/dashboard">
              <div class="w-10 h-10 min-w-10 rounded-xl theme-brand-badge flex items-center justify-center font-extrabold text-2xl shadow-lg">
                ஊ
              </div>
              <div *ngIf="!theme.isCollapsed()" class="truncate transition-opacity duration-200">
                <h1 class="text-base font-bold text-white tracking-wide truncate">{{ i1n.t('appName') }}</h1>
                <p class="text-[10px] text-amber-200/90 font-semibold truncate">{{ i1n.t('tamilAppName') }}</p>
              </div>
            </div>

            <!-- Modern SVG Collapse / Expand Button (Desktop) -->
            <button 
              (click)="theme.toggleCollapse()" 
              [title]="theme.isCollapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'"
              class="hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 border border-white/10 shadow-sm group">
              <!-- When Expanded: Double Chevron Left (to Collapse) -->
              <svg *ngIf="!theme.isCollapsed()" class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              <!-- When Collapsed: Double Chevron Right (to Expand) -->
              <svg *ngIf="theme.isCollapsed()" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Close button (Mobile) -->
            <button (click)="sidebarMobileOpen.set(false)" class="md:hidden text-slate-400 hover:text-white p-1">✕</button>
          </div>

          <!-- User Badge in Sidebar (Expanded View) -->
          <div *ngIf="!theme.isCollapsed()" class="mx-3 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3">
            <div class="w-9 h-9 min-w-9 rounded-full bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center font-bold text-sm">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="overflow-hidden">
              <p class="text-xs font-bold text-white truncate">{{ user.name }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase"
                      [class.bg-purple-900]="user.role === 'SUPER_ADMIN'"
                      [class.text-purple-200]="user.role === 'SUPER_ADMIN'"
                      [class.bg-amber-900]="user.role === 'SANGAM_ADMIN'"
                      [class.text-amber-200]="user.role === 'SANGAM_ADMIN'"
                      [class.bg-emerald-900]="user.role === 'MEMBER'"
                      [class.text-emerald-200]="user.role === 'MEMBER'">
                  {{ user.role }}
                </span>
              </div>
            </div>
          </div>

          <!-- User Initial Avatar (Collapsed View) -->
          <div *ngIf="theme.isCollapsed()" class="mt-4 flex justify-center">
            <div class="w-9 h-9 rounded-full bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center font-bold text-sm" title="{{ user.name }} ({{ user.role }})">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <!-- SIDEBAR MENU ITEMS -->
          <nav class="mt-5 px-2.5 space-y-1.5">
            <!-- 1. DEDICATED SUPER ADMIN MENUS (Only for SUPER_ADMIN role) -->
            <ng-container *ngIf="user.role === 'SUPER_ADMIN'">
              <!-- Super Admin Dashboard -->
              <a routerLink="/super-admin" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 [routerLinkActiveOptions]="{exact: true}"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.currentLang() === 'ta' ? 'முதன்மை கட்டுப்பாட்டு பலகை' : 'Super Admin Dashboard' }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">👑</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">
                  {{ i1n.currentLang() === 'ta' ? 'முதன்மை பலகை' : 'Super Admin Dashboard' }}
                </span>
              </a>

              <!-- Sangam Management -->
              <a routerLink="/super-admin/sangams" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.currentLang() === 'ta' ? 'சங்கம் மேலாண்மை' : 'Sangam Management' }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">🏛️</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">
                  {{ i1n.currentLang() === 'ta' ? 'சங்கம் மேலாண்மை' : 'Sangam Management' }}
                </span>
              </a>

              <!-- Sangam Admin Management -->
              <a routerLink="/super-admin/admins" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.currentLang() === 'ta' ? 'சங்க நிர்வாகிகள்' : 'Sangam Admin Management' }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">🛡️</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">
                  {{ i1n.currentLang() === 'ta' ? 'சங்க நிர்வாகிகள்' : 'Sangam Admin Management' }}
                </span>
              </a>
            </ng-container>

            <!-- 2. REGULAR SANGAM MENUS (Only for SANGAM_ADMIN, COLLECTOR, MEMBER) -->
            <ng-container *ngIf="user.role !== 'SUPER_ADMIN'">
              <!-- 1. Dashboard -->
              <a routerLink="/dashboard" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('dashboard') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">📊</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('dashboard') }}</span>
              </a>

              <!-- 2. Members (Hidden for MEMBER role) -->
              <a *ngIf="user.role !== 'MEMBER'"
                 routerLink="/members" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('members') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">👥</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('members') }}</span>
              </a>

              <!-- 3. Donations -->
              <a routerLink="/donations" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('donations') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">🤝</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('donations') }}</span>
              </a>

              <!-- 4. Monthly Collections (Matrix) / My Collections for Member -->
              <a routerLink="/collections" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 [title]="user.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'என் மாதாந்திர வசூல்' : 'My Collections') : i1n.t('collections')"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">📑</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">
                  {{ user.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'என் மாதாந்திர வசூல்' : 'My Collections') : i1n.t('collections') }}
                </span>
              </a>

              <!-- 5. Temple & Sangam Events -->
              <a routerLink="/events" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('events') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">🛕</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('events') }}</span>
              </a>

              <!-- 6. Expenses -->
              <a routerLink="/expenses" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('expenses') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">💸</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('expenses') }}</span>
              </a>

              <!-- 7. Financial Ledger -->
              <a routerLink="/ledger" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="{{ i1n.t('ledger') }}"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">📜</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.t('ledger') }}</span>
              </a>

              <!-- 8. Settings (Only for Sangam Admin) -->
              <a *ngIf="user.role === 'SANGAM_ADMIN'"
                 routerLink="/settings" 
                 routerLinkActive="bg-white/15 text-amber-300 border-l-4 border-amber-400 font-bold"
                 (click)="sidebarMobileOpen.set(false)"
                 title="Settings"
                 class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs text-slate-200 hover:bg-white/10 hover:text-white transition">
                <span class="text-base min-w-5 text-center">⚙️</span>
                <span *ngIf="!theme.isCollapsed()" class="truncate">{{ i1n.currentLang() === 'ta' ? 'அமைப்புகள்' : 'Settings' }}</span>
              </a>
            </ng-container>
          </nav>
        </div>

        <!-- Sidebar Footer (Language Selector) -->
        <div class="p-3 border-t theme-border-sidebar bg-black/20">
          <div *ngIf="!theme.isCollapsed()" class="flex items-center justify-between text-xs text-slate-300 px-1">
            <span class="text-[11px] font-medium">Language:</span>
            <div class="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/15">
              <button 
                (click)="i1n.setLanguage('en')" 
                [class.bg-white]="i1n.currentLang() === 'en'"
                [class.text-slate-900]="i1n.currentLang() === 'en'"
                [class.text-slate-300]="i1n.currentLang() !== 'en'"
                class="px-2 py-0.5 text-[10px] font-bold rounded transition">EN</button>
              <button 
                (click)="i1n.setLanguage('ta')" 
                [class.bg-white]="i1n.currentLang() === 'ta'"
                [class.text-slate-900]="i1n.currentLang() === 'ta'"
                [class.text-slate-300]="i1n.currentLang() !== 'ta'"
                class="px-2 py-0.5 text-[10px] font-bold rounded transition">தமிழ்</button>
            </div>
          </div>

          <div *ngIf="theme.isCollapsed()" class="flex justify-center">
            <button 
              (click)="i1n.setLanguage(i1n.currentLang() === 'en' ? 'ta' : 'en')" 
              class="text-[10px] font-bold px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-amber-300">
              {{ i1n.currentLang().toUpperCase() }}
            </button>
          </div>
        </div>
      </aside>

      <!-- TOP HEADER BAR (Padded to match sidebar width seamlessly) -->
      <header 
        [class.md:pl-64]="!theme.isCollapsed()"
        [class.md:pl-20]="theme.isCollapsed()"
        class="sticky top-0 z-30 theme-bg-header text-white shadow-md h-16 flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
        
        <div class="flex items-center space-x-3">
          <!-- Mobile Hamburger Toggle -->
          <button 
            (click)="sidebarMobileOpen.set(!sidebarMobileOpen())" 
            class="md:hidden text-white p-2 rounded-lg hover:bg-white/10 focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <div>
            <h2 class="text-sm md:text-base font-bold text-white tracking-wide">
              {{ user.sangamName || i1n.t('appName') }}
            </h2>
            <p class="text-[10px] text-amber-200/90 hidden sm:block font-medium">
              {{ api.currentSlogan() }}
            </p>
          </div>

          <!-- Super Admin Global Sangam Selector -->
          <div *ngIf="user.role === 'SUPER_ADMIN' && sangams().length > 0" class="hidden sm:flex items-center gap-2 pl-4 border-l border-white/15">
            <span class="text-xs text-amber-300 font-bold">🏛️ Sangam:</span>
            <select [value]="api.selectedSangamId() || ''" (change)="onSangamSelect($event)"
                    class="text-xs bg-slate-900 text-amber-300 font-bold border border-white/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400">
              <option value="">-- All Sangams --</option>
              <option *ngFor="let s of sangams()" [value]="s.id">{{ s.name }} ({{ s.village || 'TN' }})</option>
            </select>
          </div>
        </div>

        <!-- RIGHT TOP ACTIONS: THEME PICKER & PROFILE MENU (Contains Logout) -->
        <div class="flex items-center space-x-3">
          <!-- THEME COLOR SWITCHER DROPDOWN -->
          <div class="relative">
            <button 
              (click)="themeMenuOpen.set(!themeMenuOpen())"
              title="Change Theme Color"
              class="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition shadow-sm">
              <span class="w-3.5 h-3.5 rounded-full shadow-inner ring-1 ring-white/40" [style.backgroundColor]="getThemeDot(theme.currentTheme())"></span>
              <span class="hidden md:inline">Theme</span>
              <span class="text-[9px] opacity-70">▼</span>
            </button>

            <!-- Theme Options Menu -->
            <div 
              *ngIf="themeMenuOpen()" 
              class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
              <div class="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Theme Palette / நிறம்
              </div>
              <button 
                *ngFor="let t of availableThemes" 
                (click)="selectTheme(t.id)" 
                class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition"
                [class.font-bold]="theme.currentTheme() === t.id">
                <div class="flex items-center gap-2.5">
                  <span class="w-4 h-4 rounded-full shadow-sm ring-1 ring-slate-300" [style.backgroundColor]="t.badgeHex"></span>
                  <div>
                    <span class="block text-xs text-slate-800">{{ t.name }}</span>
                    <span class="block text-[10px] text-slate-400">{{ t.tamilName }}</span>
                  </div>
                </div>
                <span *ngIf="theme.currentTheme() === t.id" class="text-xs text-emerald-600 font-bold">✓</span>
              </button>
            </div>
          </div>

          <!-- PROFILE MENU DROPDOWN -->
          <div class="relative">
            <button 
              (click)="profileMenuOpen.set(!profileMenuOpen())"
              class="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/10 border border-white/15 transition">
              
              <div class="w-8 h-8 rounded-full theme-brand-badge font-extrabold flex items-center justify-center text-xs shadow-md">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="hidden sm:block text-left">
                <span class="text-xs font-bold text-white block">{{ user.name }}</span>
                <span class="text-[9px] text-amber-200/90 font-semibold block uppercase">{{ user.role }}</span>
              </div>

              <span class="text-[10px] text-white/70">▼</span>
            </button>

            <!-- DROPDOWN MENU -->
            <div 
              *ngIf="profileMenuOpen()" 
              class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
              
              <div class="px-4 py-2.5 border-b border-slate-100">
                <p class="text-xs font-bold text-slate-900">{{ user.name }}</p>
                <p class="text-[11px] text-slate-500">{{ user.mobileNumber }}</p>
                <span class="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                  {{ user.role }}
                </span>
              </div>

              <div class="py-1">
                <!-- Settings option: STRICTLY for SANGAM_ADMIN role -->
                <a *ngIf="user.role === 'SANGAM_ADMIN'" 
                   routerLink="/settings" 
                   (click)="profileMenuOpen.set(false)"
                   class="block px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-600 font-semibold flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>{{ i1n.currentLang() === 'ta' ? 'அமைப்புகள் (Settings)' : 'Sangam Settings' }}</span>
                </a>

                <a [routerLink]="user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard'" 
                   (click)="profileMenuOpen.set(false)"
                   class="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-900 font-medium">
                  📊 Dashboard
                </a>
                <a routerLink="/" 
                   (click)="profileMenuOpen.set(false)"
                   class="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-900 font-medium">
                  🌐 Public Home / Landing
                </a>
              </div>

              <div class="border-t border-slate-100 pt-1">
                <button 
                  (click)="logout()" 
                  class="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center space-x-2">
                  <span>🚪</span>
                  <span>Logout / வெளியேறு</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </ng-container>
  `
})
export class NavbarComponent {
  sidebarMobileOpen = signal(false);
  profileMenuOpen = signal(false);
  themeMenuOpen = signal(false);
  sangams = signal<any[]>([]);
  availableThemes = AVAILABLE_THEMES;

  constructor(
    public i1n: I1nService, 
    public api: ApiService, 
    public theme: ThemeService, 
    private router: Router
  ) {
    // Close dropdowns on route changes
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.sidebarMobileOpen.set(false);
      this.profileMenuOpen.set(false);
      this.themeMenuOpen.set(false);
    });

    const user = this.api.currentUser();
    if (user && user.role === 'SUPER_ADMIN') {
      this.api.get<any>('/superadmin/sangams').subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.sangams.set(res.data);
          }
        }
      });
    } else if (user && user.role === 'SANGAM_ADMIN') {
      this.api.get<any>('/sangam/settings').subscribe({
        next: (res) => {
          if (res.success && res.data) {
            if (res.data.slogan) {
              this.api.setSlogan(res.data.slogan);
            }
          }
        }
      });
    }
  }

  getThemeDot(themeId: string): string {
    const found = AVAILABLE_THEMES.find(t => t.id === themeId);
    return found ? found.badgeHex : '#EA580C';
  }

  selectTheme(themeId: string) {
    this.theme.setTheme(themeId);
    this.themeMenuOpen.set(false);
  }

  onSangamSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.api.setSelectedSangamId(val ? val : null);
    window.location.reload();
  }

  scrollToSection(sectionId: string) {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    if (currentPath !== '' && currentPath !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      });
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  isPublicPage(): boolean {
    const user = this.api.currentUser();
    // If user is not logged in, ALWAYS show public topbar navigation
    if (!user) {
      return true;
    }
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    return currentPath === '' || currentPath === '/' || currentPath === '/login';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.profileMenuOpen.set(false);
      this.themeMenuOpen.set(false);
    }
  }

  logout() {
    this.profileMenuOpen.set(false);
    this.themeMenuOpen.set(false);
    this.api.logout();
    this.router.navigate(['/']);
  }
}
