import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { ExcelService, ParsedMemberRow } from '../../core/services/excel.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <!-- Top Title and Action Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900">{{ i1n.t('members') }} Management</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {{ filteredMembers().length }} Members
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Manage Sangam members, roles, contact details, and auto-provisioned collection numbers
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <!-- Download Excel Template Button -->
          <button 
            (click)="downloadExcelTemplate()" 
            title="Download ready-to-use Excel template"
            class="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition">
            <span class="text-emerald-600 font-bold">📗</span>
            <span>Excel Template</span>
          </button>

          <!-- Bulk Import Excel Button -->
          <button 
            (click)="openImportModal()" 
            class="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition">
            <span>📥</span>
            <span>Import Members</span>
          </button>

          <!-- Export Members Button -->
          <button 
            (click)="exportMembers()" 
            *ngIf="filteredMembers().length > 0"
            title="Export filtered members to Excel"
            class="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition">
            <span>📊</span>
            <span>Export</span>
          </button>

          <!-- Add Single Member Button -->
          <button 
            (click)="openAddModal()" 
            class="btn-gold text-xs font-bold px-4 py-2.5 shadow-md flex items-center justify-center gap-1.5">
            <span>➕</span>
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <!-- Success Notification Alert -->
      <div *ngIf="successMessage()" class="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
        <div class="flex items-center gap-2">
          <span class="text-base">✅</span>
          <span>{{ successMessage() }}</span>
        </div>
        <button (click)="successMessage.set('')" class="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="glass-card p-4 mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-xs">
            🔍
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search by name, mobile, or member code..." 
            class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
        </div>

        <!-- Super Admin Sangam Filter -->
        <div *ngIf="isSuperAdmin() && sangams().length > 0" class="flex items-center gap-2 text-xs">
          <span class="font-bold text-slate-600 whitespace-nowrap">Filter Sangam:</span>
          <select 
            [(ngModel)]="selectedFilterSangam" 
            (ngModelChange)="onFilterSangamChange($event)"
            class="p-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">-- All Sangams --</option>
            <option *ngFor="let s of sangams()" [value]="s.id">{{ s.name }} ({{ s.village || 'TN' }})</option>
          </select>
        </div>
      </div>

      <!-- Members Table -->
      <div class="glass-card p-6 shadow-xl overflow-hidden">
        <div *ngIf="loading()" class="py-16 text-center text-slate-500 font-medium">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent mb-3"></div>
          <p class="text-xs">Loading members directory...</p>
        </div>

        <div *ngIf="!loading() && filteredMembers().length === 0" class="py-16 text-center">
          <div class="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            👥
          </div>
          <h3 class="text-sm font-bold text-slate-800">No Members Found</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {{ searchQuery ? 'No members match your search criteria.' : 'Click "Add Member" or "Import Members" above to register Sangam members.' }}
          </p>
        </div>

        <div *ngIf="!loading() && filteredMembers().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="theme-table-header">
                <th class="p-3.5 rounded-l-lg font-bold">MEMBER CODE</th>
                <th class="p-3.5 font-bold">NAME</th>
                <th class="p-3.5 font-bold">MOBILE</th>
                <th class="p-3.5 font-bold">ROLE</th>
                <th *ngIf="isSuperAdmin()" class="p-3.5 font-bold">SANGAM</th>
                <th class="p-3.5 font-bold">JOIN DATE</th>
                <th class="p-3.5 font-bold">STATUS</th>
                <th class="p-3.5 rounded-r-lg font-bold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let member of filteredMembers()" class="hover:bg-emerald-50/40 transition">
                <td class="p-3.5 font-mono font-bold text-emerald-800">{{ member.memberCode || '—' }}</td>
                <td class="p-3.5 font-bold text-slate-800">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                      {{ member.name.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ member.name }}</span>
                  </div>
                </td>
                <td class="p-3.5 font-medium text-slate-600">{{ member.mobileNumber }}</td>
                <td class="p-3.5">
                  <span class="px-2 py-0.5 rounded font-bold text-[10px]"
                        [class.bg-purple-100]="member.role === 'SANGAM_ADMIN'"
                        [class.text-purple-800]="member.role === 'SANGAM_ADMIN'"
                        [class.bg-amber-100]="member.role === 'COLLECTOR'"
                        [class.text-amber-800]="member.role === 'COLLECTOR'"
                        [class.bg-emerald-100]="member.role === 'MEMBER'"
                        [class.text-emerald-800]="member.role === 'MEMBER'">
                    {{ member.role }}
                  </span>
                </td>
                <td *ngIf="isSuperAdmin()" class="p-3.5 font-semibold text-slate-700">
                  {{ member.sangamName || 'Default Sangam' }}
                </td>
                <td class="p-3.5 text-slate-500">{{ member.joinDate || '—' }}</td>
                <td class="p-3.5">
                  <span class="px-2 py-0.5 rounded font-bold text-[10px]"
                        [class.bg-emerald-100]="member.status === 'ACTIVE'"
                        [class.text-emerald-800]="member.status === 'ACTIVE'"
                        [class.bg-slate-100]="member.status !== 'ACTIVE'"
                        [class.text-slate-600]="member.status !== 'ACTIVE'">
                    {{ member.status || 'ACTIVE' }}
                  </span>
                </td>
                <td class="p-3.5 text-center">
                  <button 
                    type="button"
                    (click)="openEditModal(member)"
                    title="Edit Member Information"
                    class="px-2.5 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-lg text-slate-700 hover:text-orange-700 font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1">
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- BULK IMPORT EXCEL MODAL -->
    <div *ngIf="showImportModal()" class="modal-overlay">
      <div class="modal-content max-w-2xl w-full animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col p-6">
        <!-- Modal Header -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
              📥
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">Import Members from Excel / CSV</h3>
              <p class="text-[11px] text-slate-500">Upload multiple Sangam members at once with automatic validation</p>
            </div>
          </div>
          <button (click)="closeImportModal()" [disabled]="importing()" class="text-slate-400 hover:text-slate-700 font-bold p-1 text-base">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto py-4 space-y-4">
          <!-- Download Template Banner -->
          <div class="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>📋</span>
                <span>Need the Excel template?</span>
              </p>
              <p class="text-[11px] text-amber-800 mt-0.5">
                Download the pre-formatted template with sample rows and column instructions.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="downloadExcelTemplate()"
                class="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-sm flex items-center gap-1 transition">
                <span>📗</span>
                <span>.XLSX Template</span>
              </button>
              <button 
                type="button" 
                (click)="downloadCsvTemplate()"
                class="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-sm flex items-center gap-1 transition">
                <span>📄</span>
                <span>.CSV</span>
              </button>
            </div>
          </div>

          <!-- Target Sangam Selection for Super Admin -->
          <div *ngIf="isSuperAdmin()" class="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label class="block text-xs font-bold text-slate-700 mb-1">Target Sangam for Imported Members *</label>
            <select 
              [(ngModel)]="importTargetSangamId" 
              [disabled]="importing()"
              class="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="" disabled>-- Select Sangam --</option>
              <option *ngFor="let s of sangams()" [value]="s.id">{{ s.name }} ({{ s.village || 'TN' }})</option>
            </select>
          </div>

          <!-- Upload Dropzone (When no file is selected yet) -->
          <div 
            *ngIf="!selectedFile()" 
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onFileDropped($event)"
            [class.border-emerald-500]="isDragOver()"
            [class.bg-emerald-50]="isDragOver()"
            class="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-7 text-center transition cursor-pointer bg-slate-50/50"
            (click)="fileInput.click()">
            <input 
              #fileInput 
              type="file" 
              (change)="onFileSelected($event)" 
              accept=".xlsx,.xls,.csv" 
              class="hidden">
            <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
              📊
            </div>
            <p class="text-xs font-bold text-slate-800">
              Click to choose an Excel or CSV file, or drag and drop here
            </p>
            <p class="text-[11px] text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv files
            </p>
            <button 
              type="button" 
              class="mt-3 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm pointer-events-none">
              Browse File...
            </button>
          </div>

          <!-- File Uploaded Info Card -->
          <div *ngIf="selectedFile()" class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📄</span>
              <div>
                <p class="text-xs font-bold text-slate-900">{{ selectedFile()?.name }}</p>
                <p class="text-[10px] text-slate-500">
                  {{ (selectedFile()!.size / 1024).toFixed(1) }} KB • {{ parsedRows().length }} rows parsed
                </p>
              </div>
            </div>
            <button 
              *ngIf="!importing()" 
              (click)="resetImportFile()" 
              type="button" 
              class="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded">
              Remove
            </button>
          </div>

          <!-- Parsing / Validation Error Alert -->
          <div *ngIf="importError()" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span class="flex-1">{{ importError() }}</span>
          </div>

          <!-- Validation Summary & Preview Table -->
          <div *ngIf="selectedFile() && parsedRows().length > 0" class="space-y-3">
            <!-- Stats Counters & Filter Tabs -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
              <div class="flex items-center gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-md font-bold bg-slate-100 text-slate-700">
                  Total: {{ parsedRows().length }}
                </span>
                <span class="px-2.5 py-1 rounded-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Ready: {{ validRowCount() }}
                </span>
                <span *ngIf="invalidRowCount() > 0" class="px-2.5 py-1 rounded-md font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Issues: {{ invalidRowCount() }}
                </span>
              </div>

              <!-- Filter Tabs -->
              <div class="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 p-0.5 rounded-lg">
                <button 
                  type="button" 
                  (click)="previewFilter.set('ALL')"
                  [class.bg-white]="previewFilter() === 'ALL'"
                  [class.shadow-sm]="previewFilter() === 'ALL'"
                  [class.text-slate-900]="previewFilter() === 'ALL'"
                  class="px-2.5 py-1 rounded-md text-slate-600 transition">
                  All ({{ parsedRows().length }})
                </button>
                <button 
                  type="button" 
                  (click)="previewFilter.set('VALID')"
                  [class.bg-white]="previewFilter() === 'VALID'"
                  [class.shadow-sm]="previewFilter() === 'VALID'"
                  [class.text-emerald-800]="previewFilter() === 'VALID'"
                  class="px-2.5 py-1 rounded-md text-slate-600 transition">
                  Ready ({{ validRowCount() }})
                </button>
                <button 
                  *ngIf="invalidRowCount() > 0"
                  type="button" 
                  (click)="previewFilter.set('INVALID')"
                  [class.bg-white]="previewFilter() === 'INVALID'"
                  [class.shadow-sm]="previewFilter() === 'INVALID'"
                  [class.text-rose-800]="previewFilter() === 'INVALID'"
                  class="px-2.5 py-1 rounded-md text-slate-600 transition">
                  Issues ({{ invalidRowCount() }})
                </button>
              </div>
            </div>

            <!-- Preview Rows Table -->
            <div class="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table class="w-full text-left text-[11px] border-collapse">
                <thead class="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                  <tr>
                    <th class="p-2 w-10 text-center">#</th>
                    <th class="p-2">Name</th>
                    <th class="p-2">Mobile</th>
                    <th class="p-2">Role</th>
                    <th class="p-2">Address</th>
                    <th class="p-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let row of filteredParsedRows()" [class.bg-rose-50]="!row.isValid" class="hover:bg-slate-50 transition">
                    <td class="p-2 text-center font-mono text-slate-400">{{ row.rowNumber }}</td>
                    <td class="p-2 font-bold text-slate-800">{{ row.name || '—' }}</td>
                    <td class="p-2 font-mono text-slate-600">{{ row.mobileNumber || '—' }}</td>
                    <td class="p-2">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                        {{ row.role }}
                      </span>
                    </td>
                    <td class="p-2 text-slate-500 truncate max-w-[140px]">{{ row.address || '—' }}</td>
                    <td class="p-2 text-right">
                      <span *ngIf="row.isValid" class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {{ row.errorReason === 'Imported Successfully' ? '✅ Imported' : '✅ Ready' }}
                      </span>
                      <span *ngIf="!row.isValid" class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800" [title]="row.errorReason">
                        ⚠️ {{ row.errorReason }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Import Progress Indicator -->
          <div *ngIf="importing()" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
            <div class="flex justify-between items-center text-xs font-bold text-emerald-900">
              <span class="flex items-center gap-1.5">
                <span class="inline-block animate-spin rounded-full h-3 w-3 border-2 border-emerald-800 border-t-transparent"></span>
                <span>Importing members to Sangam...</span>
              </span>
              <span>{{ importProgress().current }} / {{ importProgress().total }}</span>
            </div>
            <div class="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div 
                class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                [style.width.%]="importProgress().total ? (importProgress().current / importProgress().total * 100) : 0">
              </div>
            </div>
            <p class="text-[10px] text-emerald-700 text-center">
              Registering member credentials and provisioning collection slots...
            </p>
          </div>

          <!-- Import Done Summary Alert -->
          <div *ngIf="importSummary()" class="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs space-y-1 animate-in fade-in">
            <p class="font-bold flex items-center gap-1.5 text-emerald-950">
              <span>🎉</span>
              <span>Import Completed Successfully!</span>
            </p>
            <p class="text-[11px] text-emerald-800">
              Successfully imported <strong>{{ importSummary()!.success }}</strong> members.
              <span *ngIf="importSummary()!.failed > 0">
                (<strong>{{ importSummary()!.failed }}</strong> rows were skipped due to errors or duplicates).
              </span>
            </p>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button 
            type="button" 
            (click)="closeImportModal()" 
            [disabled]="importing()"
            class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition">
            {{ importSummary() ? 'Close' : 'Cancel' }}
          </button>

          <div class="flex items-center gap-2">
            <button 
              *ngIf="importSummary()" 
              type="button" 
              (click)="resetImportFile()" 
              class="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
              Import Another File
            </button>

            <button 
              *ngIf="!importSummary()"
              type="button" 
              (click)="startImport()" 
              [disabled]="importing() || validRowCount() === 0"
              class="btn-gold text-xs font-bold px-5 py-2.5 shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="importing()" class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent"></span>
              <span>{{ importing() ? 'Importing...' : 'Import ' + validRowCount() + ' Members →' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD SINGLE MEMBER MODAL -->
    <div *ngIf="showAddModal()" class="modal-overlay">
      <div class="modal-content max-w-md w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="text-lg">👤</span>
            <h3 class="text-base font-bold text-slate-900">Add New Member</h3>
          </div>
          <button (click)="closeAddModal()" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <form (ngSubmit)="submitAddMember()" class="space-y-4">
          <!-- Sangam Selection (Visible for Super Admin) -->
          <div *ngIf="isSuperAdmin()">
            <label class="block text-xs font-bold text-slate-700 mb-1">Target Sangam *</label>
            <select 
              [(ngModel)]="form.sangamId" 
              name="sangamId"
              required
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="" disabled>-- Select Sangam --</option>
              <option *ngFor="let s of sangams()" [value]="s.id">{{ s.name }} ({{ s.village || 'TN' }})</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Member Name *</label>
            <input 
              type="text" 
              [(ngModel)]="form.name" 
              name="name"
              placeholder="e.g. S. Murugan / முருகன்" 
              required
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
            <input 
              type="tel" 
              [(ngModel)]="form.mobileNumber" 
              name="mobileNumber"
              maxlength="10"
              placeholder="10-digit mobile (e.g. 9876543210)" 
              required
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            <p class="text-[10px] text-slate-400 mt-0.5">Used as login username and password defaults to mobile number</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Role *</label>
            <select 
              [(ngModel)]="form.role" 
              name="role"
              required
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="MEMBER">MEMBER / உறுப்பினர்</option>
              <option value="COLLECTOR">COLLECTOR / AGENT / வசூல் முகவர்</option>
              <option value="SANGAM_ADMIN">SANGAM ADMIN / சங்க நிர்வாகி</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Address / Village (Optional)</label>
            <input 
              type="text" 
              [(ngModel)]="form.address" 
              name="address"
              placeholder="e.g. South Street, Valavallan" 
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="error()" class="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-start gap-2">
            <span class="text-sm">⚠️</span>
            <span class="flex-1">{{ error() }}</span>
          </div>

          <div class="flex gap-2 pt-2">
            <button 
              type="button" 
              (click)="closeAddModal()" 
              [disabled]="submitting()"
              class="btn-primary bg-slate-400 hover:bg-slate-500 w-1/3 text-xs py-2.5">
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="submitting()"
              class="btn-gold w-2/3 text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 shadow-md">
              <span *ngIf="submitting()" class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent"></span>
              <span>{{ submitting() ? 'Creating Member...' : 'Save Member →' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- EDIT MEMBER MODAL -->
    <div *ngIf="showEditModal()" class="modal-overlay">
      <div class="modal-content max-w-lg w-full animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col p-6">
        <!-- Header -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center text-lg font-bold">
              ✏️
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">
                <span *ngIf="i1n.currentLang() === 'ta'">உறுப்பினர் விவரங்களை மாற்ற</span>
                <span *ngIf="i1n.currentLang() !== 'ta'">Edit Member Details</span>
              </h3>
              <p class="text-[11px] text-slate-500">
                <span *ngIf="i1n.currentLang() === 'ta'">உறுப்பினர்: </span>
                <span *ngIf="i1n.currentLang() !== 'ta'">Updating: </span>
                <span class="font-bold text-slate-700">{{ editingMember?.memberCode || '' }} - {{ editingMember?.name }}</span>
              </p>
            </div>
          </div>
          <button (click)="closeEditModal()" [disabled]="editSubmitting()" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <form (ngSubmit)="submitEditMember()" class="flex-1 overflow-y-auto py-4 space-y-4">
          <!-- Member Code & Sangam Info (Read-only banner) -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">
                {{ i1n.currentLang() === 'ta' ? 'உறுப்பினர் எண்' : 'Member Code' }}
              </span>
              <span class="font-mono font-bold text-emerald-800 text-sm">{{ editingMember?.memberCode || '—' }}</span>
            </div>
            <div *ngIf="editingMember?.sangamName" class="text-right">
              <span class="text-[10px] font-bold text-slate-400 block uppercase">
                {{ i1n.currentLang() === 'ta' ? 'சங்கம்' : 'Sangam' }}
              </span>
              <span class="font-semibold text-slate-700">{{ editingMember?.sangamName }}</span>
            </div>
          </div>

          <!-- Name & Mobile Number -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'உறுப்பினர் பெயர்' : 'Member Name' }} *
              </label>
              <input 
                type="text" 
                [(ngModel)]="editForm.name" 
                name="editName" 
                required 
                placeholder="Member name"
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'அலைபேசி எண் (10 இலக்கம்)' : 'Mobile Number (10 digits)' }} *
              </label>
              <input 
                type="tel" 
                [(ngModel)]="editForm.mobileNumber" 
                name="editMobile" 
                required 
                maxlength="10"
                placeholder="10-digit mobile"
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <!-- Email & Role -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'மின்னஞ்சல்' : 'Email Address' }}
              </label>
              <input 
                type="email" 
                [(ngModel)]="editForm.email" 
                name="editEmail" 
                placeholder="e.g. member@example.com"
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'பொறுப்பு / பதவி' : 'Role' }} *
              </label>
              <select 
                [(ngModel)]="editForm.role" 
                name="editRole" 
                required
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="MEMBER">MEMBER / உறுப்பினர்</option>
                <option value="COLLECTOR">COLLECTOR / AGENT / வசூல் முகவர்</option>
                <option value="SANGAM_ADMIN">SANGAM ADMIN / சங்க நிர்வாகி</option>
              </select>
            </div>
          </div>

          <!-- Status & Join Date -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'நிலை' : 'Status' }} *
              </label>
              <select 
                [(ngModel)]="editForm.status" 
                name="editStatus" 
                required
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="ACTIVE">ACTIVE / செயல்பாட்டில்</option>
                <option value="INACTIVE">INACTIVE / செயலற்ற</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">
                {{ i1n.currentLang() === 'ta' ? 'சேர்ந்த தேதி' : 'Join Date' }}
              </label>
              <input 
                type="date" 
                [(ngModel)]="editForm.joinDate" 
                name="editJoinDate" 
                class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <!-- Address -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              {{ i1n.currentLang() === 'ta' ? 'முகவரி / கிராமம்' : 'Address / Village' }}
            </label>
            <textarea 
              [(ngModel)]="editForm.address" 
              name="editAddress" 
              rows="2"
              placeholder="Door no, Street, Village..."
              class="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
          </div>

          <!-- Password Note -->
          <div class="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-[11px] text-amber-900">
            <span>🔒</span>
            <span *ngIf="i1n.currentLang() === 'ta'">உறுப்பினரின் உள்நுழைவு கடவுச்சொல் பாதுகாக்கப்படுகிறது, மாறாது.</span>
            <span *ngIf="i1n.currentLang() !== 'ta'">Member login password is fully preserved and remains unchanged.</span>
          </div>

          <!-- Edit Error Alert -->
          <div *ngIf="editError()" class="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-start gap-2">
            <span class="text-sm">⚠️</span>
            <span class="flex-1">{{ editError() }}</span>
          </div>

          <!-- Modal Footer Actions -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button 
              type="button" 
              (click)="closeEditModal()" 
              [disabled]="editSubmitting()"
              class="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
              {{ i1n.currentLang() === 'ta' ? 'ரத்துசெய்' : 'Cancel' }}
            </button>
            <button 
              type="submit" 
              [disabled]="editSubmitting() || !editForm.name || !editForm.mobileNumber"
              class="btn-gold text-xs font-bold px-5 py-2.5 shadow-md flex items-center gap-1.5 disabled:opacity-50">
              <span *ngIf="editSubmitting()" class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent"></span>
              <span>{{ editSubmitting() ? (i1n.currentLang() === 'ta' ? 'சேமிக்கிறது...' : 'Saving Changes...') : (i1n.currentLang() === 'ta' ? '💾 சேமிக்கவும்' : '💾 Save Changes') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class MembersComponent implements OnInit {
  members = signal<any[]>([]);
  sangams = signal<any[]>([]);
  showAddModal = signal(false);
  loading = signal(false);
  submitting = signal(false);
  error = signal('');
  successMessage = signal('');
  searchQuery = '';
  selectedFilterSangam = '';

  // Edit Member State
  showEditModal = signal(false);
  editSubmitting = signal(false);
  editError = signal('');
  editingMember: any = null;
  editForm = {
    name: '',
    mobileNumber: '',
    email: '',
    role: 'MEMBER',
    status: 'ACTIVE',
    address: '',
    joinDate: ''
  };

  // Single Add Form
  form = {
    name: '',
    mobileNumber: '',
    role: 'MEMBER',
    sangamId: '',
    address: ''
  };

  // Bulk Import State
  showImportModal = signal(false);
  selectedFile = signal<File | null>(null);
  parsedRows = signal<ParsedMemberRow[]>([]);
  previewFilter = signal<'ALL' | 'VALID' | 'INVALID'>('ALL');
  importing = signal(false);
  importProgress = signal<{ current: number; total: number }>({ current: 0, total: 0 });
  importError = signal('');
  importTargetSangamId = '';
  isDragOver = signal(false);
  importSummary = signal<{ success: number; failed: number } | null>(null);

  // Computed Properties for Filter and Counters
  filteredMembers = computed(() => {
    let list = this.members();
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(m => 
        (m.name && m.name.toLowerCase().includes(query)) ||
        (m.mobileNumber && m.mobileNumber.includes(query)) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(query)) ||
        (m.sangamName && m.sangamName.toLowerCase().includes(query))
      );
    }
    return list;
  });

  validRowCount = computed(() => this.parsedRows().filter(r => r.isValid).length);
  invalidRowCount = computed(() => this.parsedRows().filter(r => !r.isValid).length);

  filteredParsedRows = computed(() => {
    const filter = this.previewFilter();
    if (filter === 'VALID') {
      return this.parsedRows().filter(r => r.isValid);
    }
    if (filter === 'INVALID') {
      return this.parsedRows().filter(r => !r.isValid);
    }
    return this.parsedRows();
  });

  constructor(
    public i1n: I1nService, 
    public api: ApiService,
    public excelService: ExcelService
  ) {}

  ngOnInit() {
    this.loadSangams();
    this.loadMembers();
  }

  isSuperAdmin(): boolean {
    return this.api.currentUser()?.role === 'SUPER_ADMIN';
  }

  loadSangams() {
    if (this.isSuperAdmin()) {
      this.api.get<any>('/superadmin/sangams').subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.sangams.set(res.data);
            const activeSangam = this.api.selectedSangamId();
            if (activeSangam) {
              this.selectedFilterSangam = activeSangam;
            }
          }
        }
      });
    }
  }

  loadMembers() {
    this.loading.set(true);
    let url = '/members';
    if (this.selectedFilterSangam) {
      url += `?sangamId=${this.selectedFilterSangam}`;
    }

    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.members.set(res.data);
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onFilterSangamChange(sangamId: string) {
    this.selectedFilterSangam = sangamId;
    this.api.setSelectedSangamId(sangamId || null);
    this.loadMembers();
  }

  // Template & Export handlers
  downloadExcelTemplate() {
    this.excelService.downloadMemberTemplateXlsx();
  }

  downloadCsvTemplate() {
    this.excelService.downloadMemberTemplateCsv();
  }

  exportMembers() {
    let sangamName = '';
    if (this.selectedFilterSangam) {
      const match = this.sangams().find(s => s.id === this.selectedFilterSangam);
      if (match) sangamName = match.name;
    }
    this.excelService.exportMembersToXlsx(this.filteredMembers(), sangamName);
  }

  // Single Add Member handlers
  openAddModal() {
    this.error.set('');
    let targetSangam = this.selectedFilterSangam || this.api.selectedSangamId() || this.api.currentUser()?.sangamId || '';
    if (!targetSangam && this.sangams().length === 1) {
      targetSangam = this.sangams()[0].id;
    }

    this.form = {
      name: '',
      mobileNumber: '',
      role: 'MEMBER',
      sangamId: targetSangam,
      address: ''
    };
    this.showAddModal.set(true);
  }

  closeAddModal() {
    if (!this.submitting()) {
      this.showAddModal.set(false);
      this.error.set('');
    }
  }

  submitAddMember() {
    this.error.set('');
    const name = this.form.name.trim();
    const mobile = this.form.mobileNumber.trim();

    if (!name) {
      this.error.set('Member name is required');
      return;
    }

    if (!mobile) {
      this.error.set('Mobile number is required');
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      this.error.set('Please enter a valid 10-digit mobile number');
      return;
    }

    if (this.isSuperAdmin() && !this.form.sangamId && this.sangams().length > 0) {
      this.error.set('Please select a target Sangam for this member');
      return;
    }

    this.submitting.set(true);
    const payload = {
      name: name,
      mobileNumber: mobile,
      role: this.form.role,
      sangamId: this.form.sangamId || null,
      address: this.form.address?.trim() || null
    };

    this.api.post<any>('/members', payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.showAddModal.set(false);
          this.successMessage.set(`Member "${name}" (${res.data?.memberCode || 'Created'}) added successfully!`);
          this.loadMembers();
          setTimeout(() => this.successMessage.set(''), 6000);
        } else {
          this.error.set(res.message || 'Failed to add member');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'Failed to add member. Please verify the mobile number is unique.');
      }
    });
  }

  // Edit Member Handlers
  openEditModal(member: any) {
    this.editError.set('');
    this.editingMember = member;
    this.editForm = {
      name: member.name || '',
      mobileNumber: member.mobileNumber || '',
      email: member.email || '',
      role: member.role || 'MEMBER',
      status: member.status || 'ACTIVE',
      address: member.address || '',
      joinDate: member.joinDate || ''
    };
    this.showEditModal.set(true);
  }

  closeEditModal() {
    if (!this.editSubmitting()) {
      this.showEditModal.set(false);
      this.editingMember = null;
      this.editError.set('');
    }
  }

  submitEditMember() {
    this.editError.set('');
    if (!this.editingMember?.id) return;

    const name = this.editForm.name.trim();
    const mobile = this.editForm.mobileNumber.trim();

    if (!name) {
      this.editError.set('Member name is required');
      return;
    }

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      this.editError.set('Please enter a valid 10-digit mobile number');
      return;
    }

    this.editSubmitting.set(true);

    const payload = {
      name: name,
      mobileNumber: mobile,
      email: this.editForm.email?.trim() || null,
      role: this.editForm.role,
      status: this.editForm.status,
      address: this.editForm.address?.trim() || null,
      joinDate: this.editForm.joinDate || null
    };

    this.api.put<any>(`/members/${this.editingMember.id}`, payload).subscribe({
      next: (res) => {
        this.editSubmitting.set(false);
        if (res.success) {
          this.showEditModal.set(false);
          this.successMessage.set(`Member "${name}" updated successfully!`);
          this.loadMembers();
          setTimeout(() => this.successMessage.set(''), 5000);
        } else {
          this.editError.set(res.message || 'Failed to update member');
        }
      },
      error: (err) => {
        this.editSubmitting.set(false);
        this.editError.set(err.error?.message || 'Failed to update member details. Please verify the mobile number is unique.');
      }
    });
  }

  // Bulk Import Handlers
  openImportModal() {
    this.resetImportFile();
    let target = this.selectedFilterSangam || this.api.selectedSangamId() || this.api.currentUser()?.sangamId || '';
    if (!target && this.sangams().length === 1) {
      target = this.sangams()[0].id;
    }
    this.importTargetSangamId = target;
    this.showImportModal.set(true);
  }

  closeImportModal() {
    if (!this.importing()) {
      this.showImportModal.set(false);
      this.resetImportFile();
    }
  }

  resetImportFile() {
    this.selectedFile.set(null);
    this.parsedRows.set([]);
    this.previewFilter.set('ALL');
    this.importError.set('');
    this.importSummary.set(null);
    this.importProgress.set({ current: 0, total: 0 });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  async processFile(file: File) {
    this.importError.set('');
    this.importSummary.set(null);
    this.selectedFile.set(file);

    try {
      const rawRows = await this.excelService.parseFile(file);
      if (!rawRows || rawRows.length === 0) {
        this.importError.set('No rows found in uploaded file. Please make sure data starts beneath the header row.');
        this.parsedRows.set([]);
        return;
      }

      const validated = this.excelService.validateParsedRows(rawRows, this.members());
      if (validated.length === 0) {
        this.importError.set('No valid member records found. Please check column headers.');
        this.parsedRows.set([]);
        return;
      }

      this.parsedRows.set(validated);
    } catch (err: any) {
      this.importError.set('Failed to read Excel/CSV file. Please check file format.');
      this.parsedRows.set([]);
    }
  }

  async startImport() {
    const validRows = this.parsedRows().filter(r => r.isValid);
    if (validRows.length === 0) {
      this.importError.set('No valid rows available to import.');
      return;
    }

    if (this.isSuperAdmin() && !this.importTargetSangamId && this.sangams().length > 0) {
      this.importError.set('Please select a Target Sangam for imported members.');
      return;
    }

    this.importing.set(true);
    this.importError.set('');
    this.importProgress.set({ current: 0, total: validRows.length });

    const targetSangam = this.importTargetSangamId || this.selectedFilterSangam || this.api.selectedSangamId() || this.api.currentUser()?.sangamId || null;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      this.importProgress.set({ current: i + 1, total: validRows.length });

      const payload = {
        name: row.name,
        mobileNumber: row.mobileNumber,
        role: row.role || 'MEMBER',
        sangamId: targetSangam,
        address: row.address || null
      };

      try {
        const res: any = await firstValueFrom(this.api.post<any>('/members', payload));
        if (res && res.success) {
          successCount++;
          row.errorReason = 'Imported Successfully';
        } else {
          failCount++;
          row.isValid = false;
          row.errorReason = res?.message || 'Import failed';
        }
      } catch (err: any) {
        failCount++;
        row.isValid = false;
        row.errorReason = err.error?.message || 'Failed to save member';
      }
    }

    this.importing.set(false);
    this.importSummary.set({ success: successCount, failed: failCount });
    this.successMessage.set(`Successfully imported ${successCount} members to Sangam!`);
    this.loadMembers();
    setTimeout(() => this.successMessage.set(''), 8000);
  }
}
