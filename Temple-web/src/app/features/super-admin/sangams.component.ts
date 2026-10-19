import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-super-admin-sangams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50/70">
      <!-- Breadcrumb & Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-slate-200">
        <div>
          <div class="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <a routerLink="/super-admin" class="hover:text-amber-600 transition flex items-center gap-1 font-medium">
              <span>👑</span>
              <span>Super Admin</span>
            </a>
            <span>/</span>
            <span class="font-bold text-slate-800">{{ i1n.currentLang() === 'ta' ? 'சங்கம் மேலாண்மை' : 'Sangam Management' }}</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏛️</span>
            <span>{{ i1n.currentLang() === 'ta' ? 'சங்கம் மேலாண்மை' : 'Sangam Management' }}</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ i1n.currentLang() === 'ta' 
              ? 'அனைத்து சங்கங்கள், செல்லுபடியாகும் காலம், மற்றும் நிர்வாகிகளை நிர்வகிக்கவும்' 
              : 'Add, edit, monitor validity periods, subscriptions, and manage tenant Sangams' }}
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="loadSangams()" [disabled]="loading()" 
                  class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  title="Refresh List">
            <span [class.animate-spin]="loading()">🔄</span>
            <span class="hidden sm:inline">Refresh</span>
          </button>

          <button (click)="openAddSangamModal()" class="btn-gold text-xs font-bold shadow-md flex items-center gap-2 px-4 py-2.5 rounded-xl">
            <span>➕</span>
            <span>{{ i1n.currentLang() === 'ta' ? 'புதிய சங்கம் சேர்க்க' : 'Add New Sangam' }}</span>
          </button>
        </div>
      </div>

      <!-- Filter Tabs & Search Bar -->
      <div class="glass-card p-4 mb-6 shadow-xs border border-slate-200/80 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <!-- Status Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button *ngFor="let tab of statusTabs"
                  (click)="selectedStatus.set(tab.key); page.set(1)"
                  [class.bg-gradient-to-r]="selectedStatus() === tab.key"
                  [class.from-amber-500]="selectedStatus() === tab.key"
                  [class.to-amber-600]="selectedStatus() === tab.key"
                  [class.text-white]="selectedStatus() === tab.key"
                  [class.shadow-sm]="selectedStatus() === tab.key"
                  [class.bg-white]="selectedStatus() !== tab.key"
                  [class.text-slate-600]="selectedStatus() !== tab.key"
                  [class.border]="selectedStatus() !== tab.key"
                  [class.border-slate-200]="selectedStatus() !== tab.key"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <span>{{ tab.label }}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  [class.bg-white]="selectedStatus() === tab.key"
                  [class.text-amber-800]="selectedStatus() === tab.key"
                  [class.bg-slate-100]="selectedStatus() !== tab.key"
                  [class.text-slate-600]="selectedStatus() !== tab.key">
              {{ getCountForTab(tab.key) }}
            </span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
          <input type="text"
                 [(ngModel)]="searchQuery"
                 (input)="page.set(1)"
                 placeholder="{{ i1n.currentLang() === 'ta' ? 'சங்கம், குறியீடு, ஊர், மொபைல்...' : 'Search by name, code, village, mobile...' }}"
                 class="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition shadow-xs">
          <button *ngIf="searchQuery" (click)="searchQuery = ''; page.set(1)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      </div>

      <!-- Main Sangams Data Container -->
      <div class="glass-card shadow-sm border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50/90 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th class="py-3.5 px-4">SANGAM & CODE</th>
                <th class="py-3.5 px-4">LOCATION</th>
                <th class="py-3.5 px-4">CONTACT</th>
                <th class="py-3.5 px-4">ASSIGNED ADMIN</th>
                <th class="py-3.5 px-4">VALIDITY & SUBSCRIPTION</th>
                <th class="py-3.5 px-4">STATUS</th>
                <th class="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading State -->
              <tr *ngIf="loading()" class="text-center">
                <td colspan="7" class="p-12 text-slate-400">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <span class="animate-spin text-2xl text-amber-600">⏳</span>
                    <span class="font-medium text-xs">Loading Sangams data...</span>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!loading() && paginatedSangams().length === 0" class="text-center">
                <td colspan="7" class="p-12">
                  <div class="max-w-md mx-auto flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-3xl mb-3 shadow-xs">
                      🏛️
                    </div>
                    <h3 class="text-sm font-bold text-slate-800 mb-1">No Sangams Registered Yet</h3>
                    <p class="text-xs text-slate-500 mb-4">
                      {{ searchQuery ? 'No results matched your search criteria.' : 'Create and onboard your first temple or sangam organization to get started.' }}
                    </p>
                    <button *ngIf="!searchQuery" (click)="openAddSangamModal()" class="btn-gold text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                      <span>➕</span>
                      <span>+ Create New Sangam</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr *ngFor="let s of paginatedSangams()" class="hover:bg-amber-50/20 transition-colors duration-150">
                <!-- Sangam & Code -->
                <td class="py-3.5 px-4">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/70 text-amber-800 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs mt-0.5">
                      🏛️
                    </div>
                    <div>
                      <div (click)="openViewModal(s)" class="font-bold text-slate-900 text-sm hover:text-amber-700 cursor-pointer transition leading-tight">
                        {{ s.name }}
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span *ngIf="s.code" class="px-2 py-0.2 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                          {{ s.code }}
                        </span>
                        <span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          Reg: {{ s.registrationNumber || 'N/A' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Location -->
                <td class="py-3.5 px-4 text-slate-600">
                  <div class="font-medium text-slate-900 text-xs flex items-center gap-1">
                    <span class="text-slate-400">📍</span>
                    <span>{{ s.village || s.location || '—' }}</span>
                  </div>
                  <div class="text-[11px] text-slate-400 ml-4">
                    {{ s.district || '—' }}, {{ s.state || 'Tamil Nadu' }}
                  </div>
                </td>

                <!-- Contact -->
                <td class="py-3.5 px-4 text-slate-600">
                  <div class="font-mono font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span class="text-slate-400">📞</span>
                    <span>{{ s.mobileNumber }}</span>
                  </div>
                  <div class="text-[11px] text-slate-400 truncate max-w-[130px] ml-4">
                    {{ s.email || '—' }}
                  </div>
                </td>

                <!-- Assigned Admin -->
                <td class="py-3.5 px-4">
                  <ng-container *ngIf="s.adminName; else noAdmin">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {{ s.adminName.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-xs">{{ s.adminName }}</div>
                        <div class="text-[11px] text-slate-500 font-mono">{{ s.adminMobile }}</div>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #noAdmin>
                    <span class="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-dashed border-amber-300 inline-block">
                      ⚠️ Unassigned
                    </span>
                  </ng-template>
                </td>

                <!-- Validity Period & Subscription -->
                <td class="py-3.5 px-4">
                  <div class="whitespace-nowrap font-mono text-xs font-semibold text-slate-800">
                    {{ s.startDate || '—' }} <span class="text-slate-400 font-normal">→</span> {{ s.endDate || 'Ongoing' }}
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-1.5">
                    <!-- Validity Remaining Badge -->
                    <ng-container *ngIf="s.endDate && getRemainingDays(s.endDate) !== null">
                      <span *ngIf="getRemainingDays(s.endDate) as days"
                            [class.bg-emerald-50]="days > 30"
                            [class.text-emerald-700]="days > 30"
                            [class.border-emerald-200]="days > 30"
                            [class.bg-amber-50]="days > 0 && days <= 30"
                            [class.text-amber-800]="days > 0 && days <= 30"
                            [class.border-amber-300]="days > 0 && days <= 30"
                            [class.animate-pulse]="days > 0 && days <= 30"
                            [class.bg-red-50]="days <= 0"
                            [class.text-red-700]="days <= 0"
                            [class.border-red-200]="days <= 0"
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1">
                        <span>{{ days <= 0 ? '🛑 Expired' : ('⏳ ' + days + ' days left') }}</span>
                      </span>
                    </ng-container>
                    <span *ngIf="!s.endDate" class="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                      ∞ Lifetime / Ongoing
                    </span>

                    <span *ngIf="s.extensionCount > 0" class="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                      {{ s.extensionCount }}x extended
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                        [class.bg-emerald-50]="s.status === 'ACTIVE'"
                        [class.text-emerald-700]="s.status === 'ACTIVE'"
                        [class.border-emerald-200]="s.status === 'ACTIVE'"
                        [class.bg-amber-50]="s.status === 'INACTIVE'"
                        [class.text-amber-800]="s.status === 'INACTIVE'"
                        [class.border-amber-200]="s.status === 'INACTIVE'"
                        [class.bg-red-50]="s.status === 'SUSPENDED'"
                        [class.text-red-700]="s.status === 'SUSPENDED'"
                        [class.border-red-200]="s.status === 'SUSPENDED'"
                        [class.bg-slate-100]="s.status === 'EXPIRED'"
                        [class.text-slate-700]="s.status === 'EXPIRED'"
                        [class.border-slate-300]="s.status === 'EXPIRED'">
                    <span class="w-1.5 h-1.5 rounded-full"
                          [class.bg-emerald-500]="s.status === 'ACTIVE'"
                          [class.bg-amber-500]="s.status === 'INACTIVE'"
                          [class.bg-red-500]="s.status === 'SUSPENDED'"
                          [class.bg-slate-500]="s.status === 'EXPIRED'"></span>
                    <span>{{ s.status }}</span>
                  </span>
                </td>

                <!-- Actions Group -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Extend Period Button -->
                    <button (click)="openExtendModal(s)" 
                            title="Extend Validity Period"
                            class="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1">
                      <span>📅</span>
                      <span>Extend</span>
                    </button>

                    <!-- View Details -->
                    <button (click)="openViewModal(s)" 
                            title="View Sangam & History"
                            class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            aria-label="View Details">
                      👁️
                    </button>

                    <!-- Edit Sangam -->
                    <button (click)="openEditModal(s)" 
                            title="Edit Sangam Details"
                            class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label="Edit Sangam">
                      ✏️
                    </button>

                    <!-- Quick Status Toggle Menu -->
                    <select (change)="onChangeStatus(s, $event)" 
                            [value]="s.status"
                            title="Change Sangam Status"
                            class="text-[11px] font-bold py-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 text-slate-700 cursor-pointer focus:outline-none">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>

                    <!-- Delete Sangam Button -->
                    <button (click)="confirmDeleteSangam(s)" 
                            title="Delete Sangam"
                            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            aria-label="Delete Sangam">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div *ngIf="filteredSangams().length > 0" class="py-3 px-4 border-t border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <div>
            Showing <span class="font-bold text-slate-800">{{ startIndex() + 1 }}</span> to 
            <span class="font-bold text-slate-800">{{ endIndex() }}</span> of 
            <span class="font-bold text-slate-800">{{ filteredSangams().length }}</span> Sangams
          </div>
          <div class="flex items-center gap-1.5">
            <button (click)="page.set(page() - 1)" 
                    [disabled]="page() <= 1"
                    class="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs">
              ‹ Previous
            </button>
            <span class="px-2 font-bold text-slate-700">{{ page() }} / {{ totalPages() || 1 }}</span>
            <button (click)="page.set(page() + 1)" 
                    [disabled]="page() >= totalPages()"
                    class="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs">
              Next ›
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 1: ADD NEW SANGAM (Dual Mode: Existing or New Admin)     -->
    <!-- ============================================================== -->
    <div *ngIf="showAddModal()" class="modal-overlay">
      <div class="modal-content max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>Register New Sangam Tenant</span>
            </h3>
            <p class="text-xs text-slate-500">Configure tenant registration, validity period, and assigned administrator</p>
          </div>
          <button (click)="closeAddModal()" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-4">
          <!-- Sangam Basic Details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Sangam Name *</label>
              <input type="text" [(ngModel)]="addForm.name" placeholder="e.g. Sri Mutharamman Kovil Sangam" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500/20">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Sangam Code / Short ID</label>
              <input type="text" [(ngModel)]="addForm.code" placeholder="e.g. SMK-01" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono uppercase bg-white focus:ring-2 focus:ring-amber-500/20">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Registration Number</label>
              <input type="text" [(ngModel)]="addForm.registrationNumber" placeholder="e.g. REG/2026/TN/01" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500/20">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Contact Mobile Number *</label>
              <input type="text" [(ngModel)]="addForm.mobileNumber" placeholder="10-digit mobile" maxlength="10" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-amber-500/20">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Village / Location</label>
              <input type="text" [(ngModel)]="addForm.village" placeholder="Village / Area" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">District</label>
              <input type="text" [(ngModel)]="addForm.district" placeholder="District" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
              <input type="text" [(ngModel)]="addForm.pincode" placeholder="6-digit pincode" maxlength="6" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-mono">
            </div>
          </div>

          <!-- Validity Period Box -->
          <div class="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200">
            <h4 class="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
              <span>📅</span>
              <span>Validity & Subscription Period</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
                <input type="date" [(ngModel)]="addForm.startDate" class="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-mono">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">End Date (Validity)</label>
                <input type="date" [(ngModel)]="addForm.endDate" class="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-mono">
              </div>
            </div>
          </div>

          <!-- Admin Assignment Section -->
          <div class="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/80">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Sangam Admin Assignment</span>
              </h4>
              <!-- Mode Toggle -->
              <div class="flex bg-slate-200 p-0.5 rounded-xl text-xs">
                <button type="button" 
                        (click)="addForm.adminMode = 'NEW'" 
                        [class.bg-white]="addForm.adminMode === 'NEW'"
                        [class.font-bold]="addForm.adminMode === 'NEW'"
                        [class.shadow-2xs]="addForm.adminMode === 'NEW'"
                        class="px-3 py-1 rounded-lg transition text-[11px]">
                  + Create New Admin
                </button>
                <button type="button" 
                        (click)="addForm.adminMode = 'EXISTING'" 
                        [class.bg-white]="addForm.adminMode === 'EXISTING'"
                        [class.font-bold]="addForm.adminMode === 'EXISTING'"
                        [class.shadow-2xs]="addForm.adminMode === 'EXISTING'"
                        class="px-3 py-1 rounded-lg transition text-[11px]">
                  Select Existing Admin
                </button>
              </div>
            </div>

            <!-- Existing Admin Selection -->
            <div *ngIf="addForm.adminMode === 'EXISTING'" class="space-y-2">
              <label class="block text-xs font-bold text-slate-700">Choose Sangam Admin</label>
              <select [(ngModel)]="addForm.existingAdminId" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="">-- Select an Admin --</option>
                <option *ngFor="let adm of availableAdmins()" [value]="adm.id">
                  {{ adm.name }} ({{ adm.mobileNumber }}) {{ adm.sangamName ? '- Current: ' + adm.sangamName : '- Unassigned' }}
                </option>
              </select>
            </div>

            <!-- New Admin Creation Inline -->
            <div *ngIf="addForm.adminMode === 'NEW'" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Admin Name *</label>
                  <input type="text" [(ngModel)]="addForm.adminName" placeholder="e.g. S. Nagaraj" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Admin Mobile (Username) *</label>
                  <input type="text" [(ngModel)]="addForm.adminMobile" placeholder="10-digit mobile" maxlength="10" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white">
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
                  <input type="email" [(ngModel)]="addForm.adminEmail" placeholder="admin@example.com" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                  <input type="text" [(ngModel)]="addForm.password" placeholder="Initial login password" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="closeAddModal()" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitAddSangam()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Creating Sangam...' : 'Create Sangam Tenant' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 2: EDIT SANGAM DETAILS                                   -->
    <!-- ============================================================== -->
    <div *ngIf="showEditModal()" class="modal-overlay">
      <div class="modal-content max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Edit Sangam Details</h3>
            <p class="text-xs text-slate-500">Update registration, contact, and assigned admin for {{ selectedSangam?.name }}</p>
          </div>
          <button (click)="showEditModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">Sangam Name *</label>
              <input type="text" [(ngModel)]="editForm.name" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Sangam Code</label>
              <input type="text" [(ngModel)]="editForm.code" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono uppercase bg-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">Registration Number</label>
              <input type="text" [(ngModel)]="editForm.registrationNumber" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Contact Mobile *</label>
              <input type="text" [(ngModel)]="editForm.mobileNumber" maxlength="10" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1">Village / Location</label>
              <input type="text" [(ngModel)]="editForm.village" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">District</label>
              <input type="text" [(ngModel)]="editForm.district" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1">Status</label>
              <select [(ngModel)]="editForm.status" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          <!-- Re-assign Admin -->
          <div>
            <label class="block text-xs font-bold mb-1">Assigned Admin</label>
            <select [(ngModel)]="editForm.assignedAdminId" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="">-- No Admin / Unassigned --</option>
              <option *ngFor="let adm of availableAdmins()" [value]="adm.id">
                {{ adm.name }} ({{ adm.mobileNumber }}) {{ adm.sangamId === selectedSangam?.id ? '(Current)' : '' }}
              </option>
            </select>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="showEditModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitEditSangam()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Saving Changes...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 3: EXTEND VALIDITY PERIOD MODAL                         -->
    <!-- ============================================================== -->
    <div *ngIf="showExtendModal()" class="modal-overlay">
      <div class="modal-content max-w-md rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>📅</span>
              <span>Extend Sangam Validity</span>
            </h3>
            <p class="text-xs text-slate-500">Extend subscription and service period for this tenant</p>
          </div>
          <button (click)="showExtendModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-4">
          <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs">
            <div class="font-bold text-slate-900 text-sm mb-1">🏛️ {{ selectedSangam?.name }}</div>
            <div class="text-slate-600">Current End Date: <span class="font-bold text-slate-900 font-mono">{{ selectedSangam?.endDate || 'Not set' }}</span></div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">New Extended End Date *</label>
            <input type="date" [(ngModel)]="extendForm.newEndDate" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-mono">
            <p class="text-[11px] text-slate-400 mt-1">Must be after the current end date.</p>
          </div>

          <!-- Quick presets -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Add:</span>
            <button (click)="addMonthsToExtension(3)" class="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition">+3 Mos</button>
            <button (click)="addMonthsToExtension(6)" class="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition">+6 Mos</button>
            <button (click)="addMonthsToExtension(12)" class="text-[11px] px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold transition">+1 Year</button>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Reason / Remarks *</label>
            <textarea [(ngModel)]="extendForm.reason" rows="2" placeholder="e.g. Annual renewal payment received via GPay" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs"></textarea>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="showExtendModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitExtendValidity()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Extending...' : 'Confirm Extension' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 4: VIEW SANGAM DETAILS & EXTENSION TIMELINE             -->
    <!-- ============================================================== -->
    <div *ngIf="showViewModal()" class="modal-overlay">
      <div class="modal-content max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>{{ selectedSangam?.name }}</span>
            </h3>
            <p class="text-xs text-slate-500 font-mono">{{ selectedSangam?.code || 'NO-CODE' }} • Reg: {{ selectedSangam?.registrationNumber || 'N/A' }}</p>
          </div>
          <button (click)="showViewModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-4">
          <!-- Information Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                <span>🏛️</span>
                <span>Sangam Details</span>
              </h4>
              <div class="space-y-1.5">
                <div><span class="text-slate-400">Location:</span> <span class="font-medium text-slate-800">{{ selectedSangam?.village || '—' }}, {{ selectedSangam?.district || '—' }}</span></div>
                <div><span class="text-slate-400">Mobile:</span> <span class="font-mono text-slate-800 font-bold">{{ selectedSangam?.mobileNumber }}</span></div>
                <div><span class="text-slate-400">Email:</span> <span class="text-slate-800">{{ selectedSangam?.email || '—' }}</span></div>
                <div><span class="text-slate-400">Status:</span> <span class="font-bold text-emerald-700">{{ selectedSangam?.status }}</span></div>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                <span>👤</span>
                <span>Assigned Sangam Admin</span>
              </h4>
              <div class="space-y-1.5">
                <div><span class="text-slate-400">Admin Name:</span> <span class="font-bold text-slate-900">{{ selectedSangam?.adminName || 'Unassigned' }}</span></div>
                <div><span class="text-slate-400">Admin Mobile:</span> <span class="font-mono text-slate-800">{{ selectedSangam?.adminMobile || '—' }}</span></div>
                <div><span class="text-slate-400">Admin Email:</span> <span class="text-slate-800">{{ selectedSangam?.adminEmail || '—' }}</span></div>
                <div><span class="text-slate-400">Admin Status:</span> <span class="font-bold text-slate-800">{{ selectedSangam?.adminStatus || '—' }}</span></div>
              </div>
            </div>
          </div>

          <!-- Validity Summary -->
          <div class="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex justify-between items-center text-xs">
            <div>
              <span class="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Validity Period</span>
              <span class="font-mono font-bold text-slate-900 text-sm">{{ selectedSangam?.startDate }} to {{ selectedSangam?.endDate }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Extensions</span>
              <span class="font-bold text-slate-800">{{ extensionHistory().length }} extensions recorded</span>
            </div>
          </div>

          <!-- Extension History Timeline -->
          <div>
            <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span>📜</span>
              <span>Validity Extension History</span>
            </h4>

            <div *ngIf="loadingHistory()" class="p-4 text-center text-xs text-slate-400">
              Loading extension logs...
            </div>

            <div *ngIf="!loadingHistory() && extensionHistory().length === 0" class="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No validity extensions recorded yet. Original period is active.
            </div>

            <div *ngIf="!loadingHistory() && extensionHistory().length > 0" class="space-y-2">
              <div *ngFor="let h of extensionHistory()" class="p-3.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                <div class="flex justify-between items-start mb-1">
                  <div class="font-bold text-slate-900 font-mono">
                    {{ h.oldEndDate || 'Initial' }} <span class="text-slate-400">➔</span> <span class="text-emerald-700 font-bold">{{ h.newEndDate }}</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ h.createdAt | date:'medium' }}</span>
                </div>
                <p class="text-slate-600 text-[11px] mb-1">Reason: <span class="italic text-slate-800">"{{ h.reason || 'Not specified' }}"</span></p>
                <div class="text-[10px] text-slate-400 font-medium">Extended By: {{ h.extendedBy || 'Super Admin' }}</div>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-3 border-t">
            <button (click)="showViewModal.set(false)" class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 5: DELETE CONFIRMATION MODAL                             -->
    <!-- ============================================================== -->
    <div *ngIf="showDeleteModal()" class="modal-overlay">
      <div class="modal-content max-w-md rounded-2xl shadow-2xl p-6">
        <div class="flex items-center gap-3 mb-4 text-red-600">
          <div class="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-2xl shrink-0">
            🗑️
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Delete Sangam Tenant</h3>
            <p class="text-xs text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-600 mb-4 leading-relaxed">
          Are you sure you want to permanently delete <strong class="text-slate-900">{{ sangamToDelete?.name }}</strong>? All associated tenant records, subscription history, and configuration will be removed.
        </p>

        <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 mb-3">
          {{ errorMessage() }}
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button (click)="showDeleteModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button (click)="executeDeleteSangam()" [disabled]="submitting()" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
            {{ submitting() ? 'Deleting...' : 'Yes, Delete Sangam' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminSangamsComponent implements OnInit {
  sangams = signal<any[]>([]);
  availableAdmins = signal<any[]>([]);
  loading = signal(false);
  submitting = signal(false);
  errorMessage = signal('');

  // Search & Filter
  searchQuery = '';
  selectedStatus = signal<string>('ALL');
  statusTabs = [
    { key: 'ALL', label: 'All Sangams' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'INACTIVE', label: 'Inactive' },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'EXPIRED', label: 'Expired' }
  ];

  // Pagination
  page = signal(1);
  pageSize = signal(10);

  // Modals state
  showAddModal = signal(false);
  showEditModal = signal(false);
  showExtendModal = signal(false);
  showViewModal = signal(false);
  showDeleteModal = signal(false);

  selectedSangam: any = null;
  sangamToDelete: any = null;
  extensionHistory = signal<any[]>([]);
  loadingHistory = signal(false);

  // Form Models
  addForm: any = {};
  editForm: any = {};
  extendForm = {
    newEndDate: '',
    reason: ''
  };

  constructor(public i1n: I1nService, private api: ApiService) {}

  ngOnInit() {
    this.loadSangams();
    this.loadAvailableAdmins();
  }

  loadSangams() {
    this.loading.set(true);
    this.api.get<any>('/superadmin/sangams').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.sangams.set(res.data || []);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  loadAvailableAdmins() {
    this.api.get<any>('/superadmin/available-admins').subscribe({
      next: (res) => {
        if (res.success) {
          this.availableAdmins.set(res.data || []);
        }
      }
    });
  }

  filteredSangams = computed(() => {
    let list = this.sangams();
    const status = this.selectedStatus();
    if (status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(s => 
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.code && s.code.toLowerCase().includes(query)) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase().includes(query)) ||
        (s.village && s.village.toLowerCase().includes(query)) ||
        (s.mobileNumber && s.mobileNumber.toLowerCase().includes(query)) ||
        (s.adminName && s.adminName.toLowerCase().includes(query))
      );
    }
    return list;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredSangams().length / this.pageSize());
  });

  startIndex = computed(() => (this.page() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.filteredSangams().length));

  paginatedSangams = computed(() => {
    const start = this.startIndex();
    return this.filteredSangams().slice(start, start + this.pageSize());
  });

  getCountForTab(key: string): number {
    if (key === 'ALL') return this.sangams().length;
    return this.sangams().filter(s => s.status === key).length;
  }

  getRemainingDays(endDateStr: string | null | undefined): number | null {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // --- Add Modal ---
  openAddSangamModal() {
    this.errorMessage.set('');
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endDateStr = nextYear.toISOString().split('T')[0];

    this.addForm = {
      name: '',
      code: '',
      registrationNumber: '',
      village: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      mobileNumber: '',
      email: '',
      startDate: today,
      endDate: endDateStr,
      status: 'ACTIVE',
      adminMode: 'NEW',
      existingAdminId: '',
      adminName: '',
      adminMobile: '',
      adminEmail: '',
      password: ''
    };
    this.loadAvailableAdmins();
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  submitAddSangam() {
    if (!this.addForm.name || !this.addForm.mobileNumber) {
      this.errorMessage.set('Please enter Sangam Name and Mobile Number');
      return;
    }

    if (this.addForm.adminMode === 'NEW') {
      if (!this.addForm.adminName || !this.addForm.adminMobile || !this.addForm.password) {
        this.errorMessage.set('Please enter Admin Name, Mobile, and Password');
        return;
      }
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.post<any>('/superadmin/sangams', this.addForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.closeAddModal();
          this.loadSangams();
          this.loadAvailableAdmins();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create Sangam');
      }
    });
  }

  // --- Edit Modal ---
  openEditModal(sangam: any) {
    this.selectedSangam = sangam;
    this.errorMessage.set('');
    this.editForm = {
      name: sangam.name,
      code: sangam.code || '',
      registrationNumber: sangam.registrationNumber || '',
      village: sangam.village || '',
      district: sangam.district || '',
      state: sangam.state || 'Tamil Nadu',
      pincode: sangam.pincode || '',
      mobileNumber: sangam.mobileNumber,
      email: sangam.email || '',
      status: sangam.status,
      assignedAdminId: sangam.adminId || ''
    };
    this.loadAvailableAdmins();
    this.showEditModal.set(true);
  }

  submitEditSangam() {
    if (!this.editForm.name || !this.editForm.mobileNumber) {
      this.errorMessage.set('Please enter Sangam Name and Mobile Number');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.put<any>(`/superadmin/sangams/${this.selectedSangam.id}`, this.editForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.loadSangams();
          this.loadAvailableAdmins();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update Sangam');
      }
    });
  }

  // --- Extend Modal ---
  openExtendModal(sangam: any) {
    this.selectedSangam = sangam;
    this.errorMessage.set('');
    this.extendForm = {
      newEndDate: '',
      reason: ''
    };
    const baseDate = sangam.endDate ? new Date(sangam.endDate) : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + 1);
    this.extendForm.newEndDate = baseDate.toISOString().split('T')[0];
    this.showExtendModal.set(true);
  }

  addMonthsToExtension(months: number) {
    const baseDate = this.selectedSangam?.endDate ? new Date(this.selectedSangam.endDate) : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);
    this.extendForm.newEndDate = baseDate.toISOString().split('T')[0];
  }

  submitExtendValidity() {
    if (!this.extendForm.newEndDate) {
      this.errorMessage.set('Please select a new extended end date');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.post<any>(`/superadmin/sangams/${this.selectedSangam.id}/extend`, this.extendForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.showExtendModal.set(false);
          this.loadSangams();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to extend validity');
      }
    });
  }

  // --- View Details & Extension History ---
  openViewModal(sangam: any) {
    this.selectedSangam = sangam;
    this.showViewModal.set(true);
    this.loadingHistory.set(true);
    this.api.get<any>(`/superadmin/sangams/${sangam.id}/history`).subscribe({
      next: (res) => {
        this.loadingHistory.set(false);
        if (res.success) {
          this.extensionHistory.set(res.data || []);
        }
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  // --- Status Change Dropdown ---
  onChangeStatus(sangam: any, event: any) {
    const newStatus = event.target.value;
    if (newStatus === sangam.status) return;

    this.api.put<any>(`/superadmin/sangams/${sangam.id}/status?status=${newStatus}`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadSangams();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to change status');
        this.loadSangams();
      }
    });
  }

  // --- Delete Modal ---
  confirmDeleteSangam(sangam: any) {
    this.sangamToDelete = sangam;
    this.errorMessage.set('');
    this.showDeleteModal.set(true);
  }

  executeDeleteSangam() {
    if (!this.sangamToDelete) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.delete<any>(`/superadmin/sangams/${this.sangamToDelete.id}`).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res.success) {
          this.showDeleteModal.set(false);
          this.loadSangams();
          this.loadAvailableAdmins();
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to delete Sangam');
      }
    });
  }
}
