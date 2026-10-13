import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-super-admin-admins',
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
            <span class="font-bold text-slate-800">{{ i1n.currentLang() === 'ta' ? 'சங்க நிர்வாகிகள்' : 'Sangam Admin Management' }}</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛡️</span>
            <span>{{ i1n.currentLang() === 'ta' ? 'சங்க நிர்வாகிகள் மேலாண்மை' : 'Sangam Admin Management' }}</span>
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ i1n.currentLang() === 'ta'
              ? 'சங்க நிர்வாகிகளை உருவாக்கவும், சங்கங்களுக்கு ஒதுக்கவும், கடவுச்சொல் மாற்றவும்'
              : 'Create, assign, edit, and reset credentials for Sangam Administrators' }}
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="loadAdmins()" [disabled]="loading()" 
                  class="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  title="Refresh List">
            <span [class.animate-spin]="loading()">🔄</span>
            <span class="hidden sm:inline">Refresh</span>
          </button>

          <button (click)="openCreateAdminModal()" class="btn-gold text-xs font-bold shadow-md flex items-center gap-2 px-4 py-2.5 rounded-xl">
            <span>➕</span>
            <span>{{ i1n.currentLang() === 'ta' ? 'புதிய நிர்வாகி சேர்க்க' : 'Create Sangam Admin' }}</span>
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
                 placeholder="{{ i1n.currentLang() === 'ta' ? 'பெயர், மொபைல், சங்கம் தேட...' : 'Search admin name, mobile, sangam...' }}"
                 class="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition shadow-xs">
          <button *ngIf="searchQuery" (click)="searchQuery = ''; page.set(1)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      </div>

      <!-- Main Admins Table Container -->
      <div class="glass-card shadow-sm border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50/90 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider">
                <th class="py-3.5 px-4">ADMIN NAME & CODE</th>
                <th class="py-3.5 px-4">LOGIN MOBILE</th>
                <th class="py-3.5 px-4">EMAIL</th>
                <th class="py-3.5 px-4">ASSIGNED SANGAM</th>
                <th class="py-3.5 px-4">STATUS</th>
                <th class="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading State -->
              <tr *ngIf="loading()" class="text-center">
                <td colspan="6" class="p-12 text-slate-400">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <span class="animate-spin text-2xl text-amber-600">⏳</span>
                    <span class="font-medium text-xs">Loading Sangam Admins...</span>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!loading() && paginatedAdmins().length === 0" class="text-center">
                <td colspan="6" class="p-12">
                  <div class="max-w-md mx-auto flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-3xl mb-3 shadow-xs">
                      🛡️
                    </div>
                    <h3 class="text-sm font-bold text-slate-800 mb-1">No Sangam Admins Found</h3>
                    <p class="text-xs text-slate-500 mb-4">
                      {{ searchQuery ? 'No admin accounts matched your search criteria.' : 'Create your first Sangam Administrator account or assign one while adding a Sangam.' }}
                    </p>
                    <button *ngIf="!searchQuery" (click)="openCreateAdminModal()" class="btn-gold text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5">
                      <span>➕</span>
                      <span>+ Create Sangam Admin</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr *ngFor="let a of paginatedAdmins()" class="hover:bg-amber-50/20 transition-colors duration-150">
                <!-- Name & Code -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 border border-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {{ a.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div (click)="openViewModal(a)" class="font-bold text-slate-900 text-sm hover:text-amber-700 cursor-pointer transition">
                        {{ a.name }}
                      </div>
                      <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                        {{ a.memberCode || 'ADM-001' }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Mobile -->
                <td class="py-3.5 px-4">
                  <div class="font-mono font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span class="text-slate-400">📞</span>
                    <span>{{ a.mobileNumber }}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 ml-4">Primary Login ID</div>
                </td>

                <!-- Email -->
                <td class="py-3.5 px-4 text-slate-600">
                  <span class="text-xs">{{ a.email || '—' }}</span>
                </td>

                <!-- Assigned Sangam -->
                <td class="py-3.5 px-4">
                  <ng-container *ngIf="a.sangamName; else unassigned">
                    <div class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>{{ a.sangamName }}</span>
                    </div>
                    <span *ngIf="a.sangamCode" class="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold ml-5 mt-0.5 inline-block">
                      {{ a.sangamCode }}
                    </span>
                  </ng-container>
                  <ng-template #unassigned>
                    <span class="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-dashed border-amber-300 inline-block">
                      ⚠️ Unassigned
                    </span>
                  </ng-template>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border"
                        [class.bg-emerald-50]="a.status === 'ACTIVE'"
                        [class.text-emerald-700]="a.status === 'ACTIVE'"
                        [class.border-emerald-200]="a.status === 'ACTIVE'"
                        [class.bg-red-50]="a.status === 'INACTIVE'"
                        [class.text-red-700]="a.status === 'INACTIVE'"
                        [class.border-red-200]="a.status === 'INACTIVE'">
                    <span class="w-1.5 h-1.5 rounded-full"
                          [class.bg-emerald-500]="a.status === 'ACTIVE'"
                          [class.bg-red-500]="a.status === 'INACTIVE'"></span>
                    <span>{{ a.status }}</span>
                  </span>
                </td>

                <!-- Actions Group -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Reset Password Button -->
                    <button (click)="openResetPasswordModal(a)" 
                            title="Reset Admin Password"
                            class="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1">
                      <span>🔑</span>
                      <span>Reset Pwd</span>
                    </button>

                    <!-- View Details -->
                    <button (click)="openViewModal(a)" 
                            title="View Admin Details"
                            class="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            aria-label="View Details">
                      👁️
                    </button>

                    <!-- Edit Admin -->
                    <button (click)="openEditModal(a)" 
                            title="Edit Admin Details"
                            class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label="Edit Admin">
                      ✏️
                    </button>

                    <!-- Toggle Status -->
                    <button (click)="toggleAdminStatus(a)"
                            [title]="a.status === 'ACTIVE' ? 'Deactivate Admin' : 'Activate Admin'"
                            class="px-2 py-1 rounded-lg text-[11px] font-bold border transition"
                            [class.border-red-200]="a.status === 'ACTIVE'"
                            [class.text-red-600]="a.status === 'ACTIVE'"
                            [class.hover:bg-red-50]="a.status === 'ACTIVE'"
                            [class.border-emerald-200]="a.status === 'INACTIVE'"
                            [class.text-emerald-600]="a.status === 'INACTIVE'"
                            [class.hover:bg-emerald-50]="a.status === 'INACTIVE'">
                      {{ a.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                    </button>

                    <!-- Delete Admin -->
                    <button (click)="confirmDeleteAdmin(a)" 
                            title="Delete Admin Account"
                            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            aria-label="Delete Admin">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div *ngIf="filteredAdmins().length > 0" class="py-3 px-4 border-t border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <div>
            Showing <span class="font-bold text-slate-800">{{ startIndex() + 1 }}</span> to 
            <span class="font-bold text-slate-800">{{ endIndex() }}</span> of 
            <span class="font-bold text-slate-800">{{ filteredAdmins().length }}</span> Admins
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
    <!-- MODAL 1: CREATE SANGAM ADMIN                                   -->
    <!-- ============================================================== -->
    <div *ngIf="showCreateModal()" class="modal-overlay">
      <div class="modal-content max-w-lg rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🛡️</span>
              <span>Create Sangam Admin</span>
            </h3>
            <p class="text-xs text-slate-500">Add a new admin account with login credentials</p>
          </div>
          <button (click)="showCreateModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Admin Full Name *</label>
            <input type="text" [(ngModel)]="createForm.name" placeholder="e.g. S. Nagaraj" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number (Login ID) *</label>
              <input type="text" [(ngModel)]="createForm.mobileNumber" placeholder="10-digit mobile" maxlength="10" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono bg-white">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input type="email" [(ngModel)]="createForm.email" placeholder="admin@example.com" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
            <div class="relative">
              <input [type]="showPassword() ? 'text' : 'password'" 
                     [(ngModel)]="createForm.password" 
                     placeholder="Enter password (e.g. admin123)" 
                     class="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-xs bg-white">
              <button type="button" 
                      (click)="showPassword.set(!showPassword())"
                      class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">
                {{ showPassword() ? '👁️' : '🙈' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Assign to Sangam (Optional)</label>
            <select [(ngModel)]="createForm.sangamId" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="">-- No Sangam (Assign Later) --</option>
              <option *ngFor="let s of allSangams()" [value]="s.id">
                {{ s.name }} ({{ s.code || s.village || 'Tamil Nadu' }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
            <select [(ngModel)]="createForm.status" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="showCreateModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitCreateAdmin()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Creating Admin...' : 'Create Admin' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 2: EDIT SANGAM ADMIN                                     -->
    <!-- ============================================================== -->
    <div *ngIf="showEditModal()" class="modal-overlay">
      <div class="modal-content max-w-lg rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Edit Sangam Admin</h3>
            <p class="text-xs text-slate-500">Update admin details and assigned Sangam</p>
          </div>
          <button (click)="showEditModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold mb-1">Admin Full Name *</label>
            <input type="text" [(ngModel)]="editForm.name" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Email Address</label>
            <input type="email" [(ngModel)]="editForm.email" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Assigned Sangam</label>
            <select [(ngModel)]="editForm.sangamId" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="">-- No Sangam (Unassigned) --</option>
              <option *ngFor="let s of allSangams()" [value]="s.id">
                {{ s.name }} ({{ s.code || s.village || 'Tamil Nadu' }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Status</label>
            <select [(ngModel)]="editForm.status" class="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white font-bold">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="showEditModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitEditAdmin()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Saving Changes...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 3: RESET PASSWORD MODAL                                  -->
    <!-- ============================================================== -->
    <div *ngIf="showResetPasswordModal()" class="modal-overlay">
      <div class="modal-content max-w-md rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>🔑</span>
              <span>Reset Admin Password</span>
            </h3>
            <p class="text-xs text-slate-500">Set a new password for {{ selectedAdmin?.name }}</p>
          </div>
          <button (click)="showResetPasswordModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3.5">
          <div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs">
            <div class="font-bold text-slate-900 text-sm mb-1">👤 {{ selectedAdmin?.name }}</div>
            <div class="text-slate-600 font-mono">Login Mobile: <span class="font-bold text-slate-900">{{ selectedAdmin?.mobileNumber }}</span></div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">New Password *</label>
            <div class="relative">
              <input [type]="showResetPwd() ? 'text' : 'password'" 
                     [(ngModel)]="resetPasswordForm.newPassword" 
                     placeholder="Enter new password" 
                     class="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-xs bg-white">
              <button type="button" 
                      (click)="showResetPwd.set(!showResetPwd())"
                      class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">
                {{ showResetPwd() ? '👁️' : '🙈' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">The admin can use this new password immediately to log in.</p>
          </div>

          <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {{ errorMessage() }}
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button (click)="showResetPasswordModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
            <button (click)="submitResetPassword()" [disabled]="submitting()" class="btn-gold px-6 py-2 rounded-xl text-xs font-bold shadow-sm">
              {{ submitting() ? 'Updating Password...' : 'Reset Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL 4: VIEW ADMIN DETAILS                                    -->
    <!-- ============================================================== -->
    <div *ngIf="showViewModal()" class="modal-overlay">
      <div class="modal-content max-w-md rounded-2xl shadow-2xl">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>👤</span>
              <span>{{ selectedAdmin?.name }}</span>
            </h3>
            <p class="text-xs text-slate-500">Sangam Admin Account Overview</p>
          </div>
          <button (click)="showViewModal.set(false)" class="text-slate-400 font-bold hover:text-slate-600 text-lg p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div><span class="text-slate-400">Mobile Number:</span> <span class="font-mono font-bold text-slate-900 ml-1">{{ selectedAdmin?.mobileNumber }}</span></div>
            <div><span class="text-slate-400">Email:</span> <span class="text-slate-800 ml-1">{{ selectedAdmin?.email || '—' }}</span></div>
            <div><span class="text-slate-400">Role:</span> <span class="font-bold text-amber-700 ml-1">{{ selectedAdmin?.role }}</span></div>
            <div><span class="text-slate-400">Status:</span> <span class="font-bold ml-1" [class.text-emerald-700]="selectedAdmin?.status === 'ACTIVE'" [class.text-red-700]="selectedAdmin?.status === 'INACTIVE'">{{ selectedAdmin?.status }}</span></div>
            <div><span class="text-slate-400">Account Created:</span> <span class="font-mono text-slate-600 ml-1">{{ selectedAdmin?.createdAt | date:'medium' }}</span></div>
          </div>

          <div class="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <span class="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Assigned Sangam</span>
            <div *ngIf="selectedAdmin?.sangamName; else unassignedSangam">
              <div class="font-bold text-slate-900 text-sm">🏛️ {{ selectedAdmin?.sangamName }}</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">Code: {{ selectedAdmin?.sangamCode || 'N/A' }}</div>
            </div>
            <ng-template #unassignedSangam>
              <span class="text-slate-500 italic">No Sangam assigned currently.</span>
            </ng-template>
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
    <!-- MODAL 5: DELETE ADMIN CONFIRMATION MODAL                       -->
    <!-- ============================================================== -->
    <div *ngIf="showDeleteModal()" class="modal-overlay">
      <div class="modal-content max-w-md rounded-2xl shadow-2xl p-6">
        <div class="flex items-center gap-3 mb-4 text-red-600">
          <div class="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-2xl shrink-0">
            🗑️
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">Delete Admin Account</h3>
            <p class="text-xs text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-600 mb-4 leading-relaxed">
          Are you sure you want to permanently delete the administrator account for <strong class="text-slate-900">{{ adminToDelete?.name }}</strong> ({{ adminToDelete?.mobileNumber }})?
        </p>

        <div *ngIf="errorMessage()" class="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 mb-3">
          {{ errorMessage() }}
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button (click)="showDeleteModal.set(false)" class="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button (click)="executeDeleteAdmin()" [disabled]="submitting()" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
            {{ submitting() ? 'Deleting...' : 'Yes, Delete Admin' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminAdminsComponent implements OnInit {
  admins = signal<any[]>([]);
  allSangams = signal<any[]>([]);
  loading = signal(false);
  submitting = signal(false);
  errorMessage = signal('');

  // Search & Filter
  searchQuery = '';
  selectedStatus = signal<string>('ALL');
  statusTabs = [
    { key: 'ALL', label: 'All Admins' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'INACTIVE', label: 'Inactive' }
  ];

  // Pagination
  page = signal(1);
  pageSize = signal(10);

  // Modals state
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showResetPasswordModal = signal(false);
  showViewModal = signal(false);
  showDeleteModal = signal(false);
  showPassword = signal(false);
  showResetPwd = signal(false);

  selectedAdmin: any = null;
  adminToDelete: any = null;

  // Form Models
  createForm: any = {};
  editForm: any = {};
  resetPasswordForm = {
    newPassword: ''
  };

  constructor(public i1n: I1nService, private api: ApiService) {}

  ngOnInit() {
    this.loadAdmins();
    this.loadAllSangams();
  }

  loadAdmins() {
    this.loading.set(true);
    this.api.get<any>('/superadmin/admins').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.admins.set(res.data || []);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  loadAllSangams() {
    this.api.get<any>('/superadmin/sangams').subscribe({
      next: (res) => {
        if (res.success) {
          this.allSangams.set(res.data || []);
        }
      }
    });
  }

  filteredAdmins = computed(() => {
    let list = this.admins();
    const status = this.selectedStatus();
    if (status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(query)) ||
        (a.mobileNumber && a.mobileNumber.toLowerCase().includes(query)) ||
        (a.email && a.email.toLowerCase().includes(query)) ||
        (a.sangamName && a.sangamName.toLowerCase().includes(query)) ||
        (a.sangamCode && a.sangamCode.toLowerCase().includes(query))
      );
    }
    return list;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAdmins().length / this.pageSize());
  });

  startIndex = computed(() => (this.page() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.filteredAdmins().length));

  paginatedAdmins = computed(() => {
    const start = this.startIndex();
    return this.filteredAdmins().slice(start, start + this.pageSize());
  });

  getCountForTab(key: string): number {
    if (key === 'ALL') return this.admins().length;
    return this.admins().filter(a => a.status === key).length;
  }

  // --- Create Modal ---
  openCreateAdminModal() {
    this.errorMessage.set('');
    this.showPassword.set(false);
    this.createForm = {
      name: '',
      mobileNumber: '',
      email: '',
      password: '',
      sangamId: '',
      status: 'ACTIVE'
    };
    this.loadAllSangams();
    this.showCreateModal.set(true);
  }

  submitCreateAdmin() {
    if (!this.createForm.name || !this.createForm.mobileNumber || !this.createForm.password) {
      this.errorMessage.set('Please fill Name, Mobile Number, and Password');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.post<any>('/superadmin/admins', this.createForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.showCreateModal.set(false);
          this.loadAdmins();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create Sangam Admin');
      }
    });
  }

  // --- Edit Modal ---
  openEditModal(admin: any) {
    this.selectedAdmin = admin;
    this.errorMessage.set('');
    this.editForm = {
      name: admin.name,
      email: admin.email || '',
      sangamId: admin.sangamId || '',
      status: admin.status
    };
    this.loadAllSangams();
    this.showEditModal.set(true);
  }

  submitEditAdmin() {
    if (!this.editForm.name) {
      this.errorMessage.set('Please enter Admin Name');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.put<any>(`/superadmin/admins/${this.selectedAdmin.id}`, this.editForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.loadAdmins();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update Admin');
      }
    });
  }

  // --- Reset Password Modal ---
  openResetPasswordModal(admin: any) {
    this.selectedAdmin = admin;
    this.errorMessage.set('');
    this.showResetPwd.set(false);
    this.resetPasswordForm = {
      newPassword: ''
    };
    this.showResetPasswordModal.set(true);
  }

  submitResetPassword() {
    if (!this.resetPasswordForm.newPassword) {
      this.errorMessage.set('Please enter a new password');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.put<any>(`/superadmin/admins/${this.selectedAdmin.id}/reset-password`, this.resetPasswordForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          alert('Admin password has been successfully reset!');
          this.showResetPasswordModal.set(false);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to reset password');
      }
    });
  }

  // --- Toggle Admin Status ---
  toggleAdminStatus(admin: any) {
    const newStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.put<any>(`/superadmin/admins/${admin.id}/status?status=${newStatus}`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAdmins();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update admin status');
      }
    });
  }

  // --- View Modal ---
  openViewModal(admin: any) {
    this.selectedAdmin = admin;
    this.showViewModal.set(true);
  }

  // --- Delete Modal ---
  confirmDeleteAdmin(admin: any) {
    this.adminToDelete = admin;
    this.errorMessage.set('');
    this.showDeleteModal.set(true);
  }

  executeDeleteAdmin() {
    if (!this.adminToDelete) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    this.api.delete<any>(`/superadmin/admins/${this.adminToDelete.id}`).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        if (res.success) {
          this.showDeleteModal.set(false);
          this.loadAdmins();
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to delete Admin');
      }
    });
  }
}
