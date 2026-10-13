import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { I1nService } from '../../core/services/i18n.service';
import { NavbarComponent } from '../../layout/navbar.component';

export interface SangamSettings {
  id: string;
  name: string;
  registrationNumber?: string;
  startDate?: string;
  location?: string;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  mobileNumber: string;
  email?: string;
  status: string;
  slogan?: string;
  defaultPasswordConfigured?: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Top Breadcrumb & Page Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <a routerLink="/dashboard" class="hover:text-orange-600 transition">📊 Dashboard</a>
              <span>/</span>
              <span class="font-bold text-slate-800">Settings</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>⚙️</span>
              <span>{{ i1n.currentLang() === 'ta' ? 'சங்க அமைப்புகள்' : 'Sangam Settings' }}</span>
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ i1n.currentLang() === 'ta' 
                  ? 'சங்கத்தின் விவரங்கள் மற்றும் தாரக மந்திரத்தை எளிதாக நிர்வகிக்கவும்' 
                  : 'Manage your Sangam details, branding slogan, and official contacts' }}
            </p>
          </div>

          <!-- Header Action Buttons -->
          <div class="flex items-center gap-2">
            <ng-container *ngIf="!isEditing()">
              <button 
                (click)="enterEditMode()"
                class="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition hover:scale-[1.02]">
                <span>✏️</span>
                <span>{{ i1n.currentLang() === 'ta' ? 'விவரங்களை மாற்று' : 'Edit Details' }}</span>
              </button>
            </ng-container>

            <ng-container *ngIf="isEditing()">
              <button 
                (click)="cancelEdit()"
                [disabled]="saving()"
                class="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition">
                ✕ {{ i1n.currentLang() === 'ta' ? 'ரத்துசெய்' : 'Cancel' }}
              </button>
              <button 
                (click)="saveSettings()"
                [disabled]="saving()"
                class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition hover:scale-[1.02]">
                <span *ngIf="saving()" class="inline-block animate-spin">⏳</span>
                <span *ngIf="!saving()">💾</span>
                <span>{{ saving() ? (i1n.currentLang() === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (i1n.currentLang() === 'ta' ? 'சேமிக்கவும்' : 'Save Changes') }}</span>
              </button>
            </ng-container>
          </div>
        </div>

        <!-- Notification Alerts -->
        <div *ngIf="successMessage()" class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div class="flex items-center gap-2.5">
            <span class="text-base">✅</span>
            <span>{{ successMessage() }}</span>
          </div>
          <button (click)="successMessage.set('')" class="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>

        <div *ngIf="errorMessage()" class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div class="flex items-center gap-2.5">
            <span class="text-base">⚠️</span>
            <span>{{ errorMessage() }}</span>
          </div>
          <button (click)="errorMessage.set('')" class="text-red-600 hover:text-red-900 font-bold">✕</button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="glass-card p-12 text-center space-y-3">
          <div class="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs text-slate-500 font-medium">Loading Sangam settings...</p>
        </div>

        <!-- MAIN SANGAM DETAILS CARD -->
        <div *ngIf="!loading() && settings" class="space-y-6">

          <!-- 1. BRANDING & AUSPICIOUS SLOGAN CARD -->
          <div class="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-orange-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 class="text-sm font-bold text-orange-950 flex items-center gap-2">
                  <span>🕉️</span>
                  <span>{{ i1n.currentLang() === 'ta' ? 'சங்க தாரக மந்திரம் / வாசகம்' : 'Sangam Title / Slogan' }}</span>
                </h3>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  {{ i1n.currentLang() === 'ta' 
                      ? 'இந்த வாசகம் ரசீதுகளில், பயன்பாட்டு தலைப்புகளில் மற்றும் சுற்றறிக்கைகளில் காட்டப்படும்' 
                      : 'This slogan is dynamically displayed in application headers, branding banners, and collection receipts' }}
                </p>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                Unicode & Emojis
              </span>
            </div>

            <!-- View Mode Slogan Display -->
            <div *ngIf="!isEditing()" class="p-4 rounded-xl bg-white border border-orange-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Branding Preview</span>
                <div class="text-base sm:text-lg font-black text-orange-900 tracking-wide">
                  {{ settings.slogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️' }}
                </div>
              </div>
              <div class="text-[11px] text-slate-500 bg-orange-50/80 border border-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span>📍</span>
                <span>Header & Receipt Header</span>
              </div>
            </div>

            <!-- Edit Mode Slogan Input -->
            <div *ngIf="isEditing()" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  {{ i1n.currentLang() === 'ta' ? 'தாரக மந்திரம் / வாசகம் உள்ளிடவும்' : 'Edit Slogan / Title' }} *
                </label>
                <div class="relative">
                  <input 
                    type="text" 
                    [(ngModel)]="editForm.slogan" 
                    placeholder="எ.கா. 🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️"
                    class="w-full p-3 rounded-xl border border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm font-bold text-slate-800 bg-white shadow-xs">
                </div>
              </div>

              <!-- Quick Emoji & Template Helpers -->
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[11px] font-semibold text-slate-500 mr-1">Quick Emojis:</span>
                <button 
                  *ngFor="let emoji of quickEmojis"
                  type="button"
                  (click)="appendEmoji(emoji)"
                  class="px-2 py-1 text-xs bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg shadow-2xs transition">
                  {{ emoji }}
                </button>
                <button 
                  type="button"
                  (click)="resetDefaultSlogan()"
                  class="ml-auto text-[11px] font-bold text-orange-600 hover:text-orange-800 hover:underline">
                  ↺ Reset Default Slogan
                </button>
              </div>
            </div>
          </div>

          <!-- 2. SANGAM DETAILS MAIN CARD -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <!-- Card Header -->
            <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                  🏛️
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">
                    {{ i1n.currentLang() === 'ta' ? 'சங்க விவரங்கள்' : 'Sangam Details' }}
                  </h2>
                  <p class="text-[11px] text-slate-500">
                    {{ i1n.currentLang() === 'ta' ? 'சங்கத்தின் பதிவு, தொடர்பு மற்றும் முகவரி தகவல்கள்' : 'Registration, contact info, and official location' }}
                  </p>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {{ settings.status || 'ACTIVE' }}
                </span>
              </div>
            </div>

            <!-- Card Body: VIEW MODE -->
            <div *ngIf="!isEditing()" class="p-5 sm:p-6 space-y-6">
              
              <!-- Row 1: Sangam Name & Registration -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'சங்க பெயர்' : 'Sangam Name' }}
                  </span>
                  <div class="text-sm sm:text-base font-bold text-slate-900">
                    {{ settings.name }}
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'பதிவு எண்' : 'Registration Number' }}
                  </span>
                  <div class="text-sm sm:text-base font-bold text-slate-900">
                    {{ settings.registrationNumber || '-' }}
                  </div>
                </div>
              </div>

              <!-- Row 2: Contact Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <span class="text-xl">📞</span>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      {{ i1n.currentLang() === 'ta' ? 'தொடர்பு அலைபேசி எண்' : 'Contact Mobile Number' }}
                    </span>
                    <div class="text-sm font-bold text-slate-900">
                      {{ settings.mobileNumber }}
                    </div>
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <span class="text-xl">✉️</span>
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      {{ i1n.currentLang() === 'ta' ? 'மின்னஞ்சல்' : 'Contact Email' }}
                    </span>
                    <div class="text-sm font-bold text-slate-900">
                      {{ settings.email || '-' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Row 3: Address & Location Details -->
              <div class="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-slate-200/60">
                  <span>📍</span>
                  <span>{{ i1n.currentLang() === 'ta' ? 'இருப்பிடம் / முகவரி விவரங்கள்' : 'Address & Location Details' }}</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'தெரு / கதவு எண்' : 'Street Address' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.address || '-' }}</span>
                  </div>

                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'மைல்கல் / இடம்' : 'Location / Landmark' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.location || '-' }}</span>
                  </div>

                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'கிராமம் / நகரம்' : 'Village / Town' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.village || '-' }}</span>
                  </div>

                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'மாவட்டம்' : 'District' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.district || '-' }}</span>
                  </div>

                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'மாநிலம்' : 'State' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.state || 'Tamil Nadu' }}</span>
                  </div>

                  <div>
                    <span class="text-[10px] font-semibold text-slate-400 block">{{ i1n.currentLang() === 'ta' ? 'அஞ்சல் குறியீடு' : 'Pincode' }}</span>
                    <span class="font-bold text-slate-800">{{ settings.pincode || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Row 4: Account Metadata -->
              <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <div class="flex items-center gap-2">
                  <span>📅 Start Date:</span>
                  <span class="font-semibold text-slate-600">{{ settings.startDate || '-' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>Tenant ID:</span>
                  <span class="font-mono text-slate-500">{{ settings.id }}</span>
                </div>
              </div>
            </div>

            <!-- Card Body: EDIT MODE -->
            <form *ngIf="isEditing()" (ngSubmit)="saveSettings()" class="p-5 sm:p-6 space-y-5">
              
              <!-- Basic Info Inputs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'சங்க பெயர்' : 'Sangam Name' }} *
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="editForm.name" 
                    name="name" 
                    required 
                    placeholder="Enter official Sangam name"
                    class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs font-semibold text-slate-800">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'பதிவு எண்' : 'Registration Number' }}
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="editForm.registrationNumber" 
                    name="registrationNumber" 
                    placeholder="e.g. S98424/2026"
                    class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                </div>
              </div>

              <!-- Contact Inputs -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'தொடர்பு அலைபேசி எண் (10 இலக்கம்)' : 'Contact Mobile Number (10 digits)' }} *
                  </label>
                  <input 
                    type="tel" 
                    [(ngModel)]="editForm.mobileNumber" 
                    name="mobileNumber" 
                    required 
                    pattern="[0-9]{10}"
                    maxlength="10"
                    placeholder="10-digit mobile number"
                    class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs font-semibold text-slate-800">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">
                    {{ i1n.currentLang() === 'ta' ? 'மின்னஞ்சல்' : 'Contact Email' }}
                  </label>
                  <input 
                    type="email" 
                    [(ngModel)]="editForm.email" 
                    name="email" 
                    placeholder="e.g. sangam@example.com"
                    class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                </div>
              </div>

              <!-- Address Details Section -->
              <div class="pt-3 border-t border-slate-100 space-y-3">
                <h4 class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{{ i1n.currentLang() === 'ta' ? 'முகவரி தகவல்கள்' : 'Address & Location Information' }}</span>
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'தெரு / கதவு எண்' : 'Street Address' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.address" 
                      name="address" 
                      placeholder="Street, door no."
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'மைல்கல் / இடம்' : 'Landmark / Location' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.location" 
                      name="location" 
                      placeholder="e.g. Near Amman Kovil"
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'கிராமம் / நகரம்' : 'Village / Town' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.village" 
                      name="village" 
                      placeholder="Village name"
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'மாவட்டம்' : 'District' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.district" 
                      name="district" 
                      placeholder="District"
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'மாநிலம்' : 'State' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.state" 
                      name="state" 
                      placeholder="Tamil Nadu"
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">
                      {{ i1n.currentLang() === 'ta' ? 'அஞ்சல் குறியீடு' : 'Pincode' }}
                    </label>
                    <input 
                      type="text" 
                      [(ngModel)]="editForm.pincode" 
                      name="pincode" 
                      maxlength="6"
                      placeholder="628xxx"
                      class="w-full p-2.5 rounded-lg border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs text-slate-800">
                  </div>
                </div>
              </div>

              <!-- Form Buttons -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  (click)="cancelEdit()"
                  [disabled]="saving()"
                  class="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition">
                  ✕ {{ i1n.currentLang() === 'ta' ? 'ரத்துசெய்' : 'Cancel' }}
                </button>
                <button 
                  type="submit" 
                  [disabled]="saving() || !editForm.name || !editForm.mobileNumber"
                  class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5">
                  <span *ngIf="saving()" class="inline-block animate-spin">⏳</span>
                  <span>{{ saving() ? 'Saving Changes...' : '💾 Save Changes' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- 3. MEMBER ACCOUNT SETTINGS CARD -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <!-- Card Header -->
            <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                  🔐
                </div>
                <div>
                  <h2 class="text-base font-bold text-slate-900">
                    <span *ngIf="i1n.currentLang() === 'ta'">உறுப்பினர் கணக்கு அமைப்புகள்</span>
                    <span *ngIf="i1n.currentLang() !== 'ta'">Member Account Settings</span>
                  </h2>
                  <p class="text-[11px] text-slate-500">
                    <span *ngIf="i1n.currentLang() === 'ta'">புதிய உறுப்பினர்களுக்கான தொடக்க கடவுச்சொல்லை உள்ளமைக்கவும்</span>
                    <span *ngIf="i1n.currentLang() !== 'ta'">Configure default password initialized for newly created & bulk-imported members</span>
                  </p>
                </div>
              </div>

              <!-- Configuration Status Badge -->
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                      [ngClass]="settings.defaultPasswordConfigured ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-blue-100 text-blue-800 border-blue-200'">
                  <span class="w-2 h-2 rounded-full"
                        [ngClass]="settings.defaultPasswordConfigured ? 'bg-emerald-500' : 'bg-blue-500'"></span>
                  <span *ngIf="i1n.currentLang() === 'ta'">
                    {{ settings.defaultPasswordConfigured ? 'இயல்புநிலை கடவுச்சொல் அமைக்கப்பட்டது' : 'இயல்புநிலை: login1-2' }}
                  </span>
                  <span *ngIf="i1n.currentLang() !== 'ta'">
                    {{ settings.defaultPasswordConfigured ? 'Default password configured' : 'Using default: login1-2' }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="p-5 sm:p-6 space-y-4">
              <!-- In-card Success/Error Alerts -->
              <div *ngIf="passwordSuccessMessage()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                <div class="flex items-center gap-2">
                  <span class="text-base">✅</span>
                  <span>{{ passwordSuccessMessage() }}</span>
                </div>
                <button (click)="passwordSuccessMessage.set('')" class="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
              </div>

              <div *ngIf="passwordErrorMessage()" class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                <div class="flex items-center gap-2">
                  <span class="text-base">⚠️</span>
                  <span>{{ passwordErrorMessage() }}</span>
                </div>
                <button (click)="passwordErrorMessage.set('')" class="text-red-600 hover:text-red-900 font-bold">✕</button>
              </div>

              <div class="max-w-xl space-y-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">
                    <span *ngIf="i1n.currentLang() === 'ta'">இயல்புநிலை உறுப்பினர் கடவுச்சொல்</span>
                    <span *ngIf="i1n.currentLang() !== 'ta'">Default Member Password</span> *
                  </label>
                  
                  <div class="relative flex items-center">
                    <input 
                      [type]="showDefaultPassword() ? 'text' : 'password'"
                      [(ngModel)]="defaultPassword" 
                      [placeholder]="i1n.currentLang() === 'ta' ? 'இயல்புநிலை கடவுச்சொல் உள்ளிடவும் (குறைந்தது 6 எழுத்துக்கள்)' : 'Enter default password (min 6 characters)'"
                      class="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold text-slate-800 shadow-xs">
                    
                    <button 
                      type="button" 
                      (click)="showDefaultPassword.set(!showDefaultPassword())"
                      title="Toggle password visibility"
                      class="absolute right-3 text-slate-400 hover:text-slate-700 text-sm focus:outline-none">
                      {{ showDefaultPassword() ? '🔒' : '👁️' }}
                    </button>
                  </div>
                </div>

                <!-- Helper / Policy notes -->
                <div class="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <div class="flex items-start gap-2">
                    <span class="text-indigo-600 font-bold">ℹ️</span>
                    <div>
                      <p class="font-semibold text-slate-800">
                        <span *ngIf="i1n.currentLang() === 'ta'">தொடக்க கணினி கடவுச்சொல்: login1-2</span>
                        <span *ngIf="i1n.currentLang() !== 'ta'">Initial system default password: login1-2</span>
                      </p>
                      <p class="text-slate-500 mt-0.5">
                        <span *ngIf="i1n.currentLang() === 'ta'">
                          இந்த கடவுச்சொல் எதிர்காலத்தில் சேர்க்கப்படும் மற்றும் இறக்குமதி செய்யப்படும் புதிய உறுப்பினர்களுக்கு மட்டுமே பொருந்தும். ஏற்கனவே உள்ள உறுப்பினர்களின் கடவுச்சொல் மாறாது.
                        </span>
                        <span *ngIf="i1n.currentLang() !== 'ta'">
                          This password applies only to newly created and bulk-imported members. Existing members' passwords are never altered.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="pt-2 flex items-center gap-3">
                  <button 
                    type="button" 
                    (click)="saveDefaultPassword()"
                    [disabled]="savingPassword() || !defaultPassword.trim()"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                    <span *ngIf="savingPassword()" class="inline-block animate-spin">⏳</span>
                    <span *ngIf="!savingPassword()">💾</span>
                    <span *ngIf="savingPassword()">{{ i1n.currentLang() === 'ta' ? 'சேமிக்கிறது...' : 'Saving Password...' }}</span>
                    <span *ngIf="!savingPassword()">{{ i1n.currentLang() === 'ta' ? 'கடவுச்சொல்லை சேமிக்கவும்' : 'Save Settings' }}</span>
                  </button>

                  <button 
                    type="button" 
                    (click)="resetToDefaultPassword()"
                    class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 flex items-center gap-1">
                    ↺ {{ i1n.currentLang() === 'ta' ? 'மீட்டமை (login1-2)' : 'Reset (login1-2)' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  isEditing = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Member Account Settings State
  defaultPassword = 'login1-2';
  showDefaultPassword = signal(false);
  savingPassword = signal(false);
  passwordSuccessMessage = signal('');
  passwordErrorMessage = signal('');

  settings: SangamSettings | null = null;
  editForm: Partial<SangamSettings> = {};

  quickEmojis = ['🕉️', '🛕', '🌺', '✨', '🚩', '🙏', '🔱', '🌿'];

  constructor(public api: ApiService, public i1n: I1nService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.get<any>('/sangam/settings').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.settings = res.data;
          if (res.data.slogan) {
            this.api.setSlogan(res.data.slogan);
          }
        } else {
          this.errorMessage.set(res.message || 'Failed to load settings');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error connecting to Sangam settings service');
      }
    });
  }

  enterEditMode() {
    if (!this.settings) return;
    this.editForm = {
      name: this.settings.name,
      registrationNumber: this.settings.registrationNumber || '',
      location: this.settings.location || '',
      address: this.settings.address || '',
      village: this.settings.village || '',
      district: this.settings.district || '',
      state: this.settings.state || 'Tamil Nadu',
      pincode: this.settings.pincode || '',
      mobileNumber: this.settings.mobileNumber,
      email: this.settings.email || '',
      slogan: this.settings.slogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
    };
    this.isEditing.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  appendEmoji(emoji: string) {
    if (!this.editForm.slogan) {
      this.editForm.slogan = emoji;
    } else {
      this.editForm.slogan += ' ' + emoji;
    }
  }

  resetDefaultSlogan() {
    this.editForm.slogan = '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️';
  }

  saveSettings() {
    if (!this.editForm.name || !this.editForm.name.trim()) {
      this.errorMessage.set('Sangam name is required.');
      return;
    }

    if (!this.editForm.mobileNumber || !this.editForm.mobileNumber.trim()) {
      this.errorMessage.set('Contact mobile number is required.');
      return;
    }

    const cleanMobile = this.editForm.mobileNumber.trim();
    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      this.errorMessage.set('Contact mobile number must be exactly 10 digits.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      name: this.editForm.name.trim(),
      registrationNumber: this.editForm.registrationNumber?.trim() || '',
      location: this.editForm.location?.trim() || '',
      address: this.editForm.address?.trim() || '',
      village: this.editForm.village?.trim() || '',
      district: this.editForm.district?.trim() || '',
      state: this.editForm.state?.trim() || 'Tamil Nadu',
      pincode: this.editForm.pincode?.trim() || '',
      mobileNumber: cleanMobile,
      email: this.editForm.email?.trim() || '',
      slogan: this.editForm.slogan?.trim() || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
    };

    this.api.put<any>('/sangam/settings', payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.settings = res.data;
          this.isEditing.set(false);
          this.successMessage.set('சங்க விவரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டது! / Sangam settings updated successfully!');
          
          // Update app-wide branding & navbar immediately
          this.api.updateSangamInfo(res.data.name, res.data.slogan);

          // Auto-hide success message after 4 seconds
          setTimeout(() => {
            this.successMessage.set('');
          }, 4000);
        } else {
          this.errorMessage.set(res.message || 'Failed to update settings');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save settings. Please try again.');
      }
    });
  }

  saveDefaultPassword() {
    const pwd = this.defaultPassword.trim();
    if (!pwd) {
      this.passwordErrorMessage.set(
        this.i1n.currentLang() === 'ta'
          ? 'தயவுசெய்து உறுப்பினர் கடவுச்சொல்லை உள்ளிடவும்.'
          : 'Please enter a default member password.'
      );
      return;
    }

    if (pwd.length < 6) {
      this.passwordErrorMessage.set(
        this.i1n.currentLang() === 'ta'
          ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்கள் இருக்க வேண்டும்.'
          : 'Default password must be at least 6 characters long.'
      );
      return;
    }

    this.savingPassword.set(true);
    this.passwordErrorMessage.set('');
    this.passwordSuccessMessage.set('');

    this.api.put<any>('/sangam/settings/default-password', { defaultPassword: pwd }).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        if (res.success) {
          if (this.settings) {
            this.settings.defaultPasswordConfigured = true;
          }
          this.defaultPassword = pwd;
          this.passwordSuccessMessage.set(
            this.i1n.currentLang() === 'ta'
              ? 'உறுப்பினர் இயல்புநிலை கடவுச்சொல் வெற்றிகரமாக சேமிக்கப்பட்டது!'
              : 'Default member password updated successfully!'
          );
          setTimeout(() => this.passwordSuccessMessage.set(''), 5000);
        } else {
          this.passwordErrorMessage.set(res.message || 'Failed to update default password');
        }
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordErrorMessage.set(err.error?.message || 'Failed to update default member password');
      }
    });
  }

  resetToDefaultPassword() {
    this.defaultPassword = 'login1-2';
    this.passwordErrorMessage.set('');
  }
}
