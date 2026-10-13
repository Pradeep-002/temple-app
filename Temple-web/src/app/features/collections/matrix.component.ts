import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { ReceiptPdfService, ReceiptData } from '../../core/services/receipt-pdf.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-collection-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <!-- Header Bar -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">
            {{ api.currentUser()?.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'என் மாதாந்திர வசூல் விவரம்' : 'My Monthly Collections') : (i1n.t('collections') + ' • ' + i1n.t('appName')) }}
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ api.currentUser()?.role === 'MEMBER' ? (i1n.currentLang() === 'ta' ? 'உங்கள் மாதாந்திர சந்தா நிலை, நிலுவைத் தொகை மற்றும் ரசீதுகள்' : 'Your personal monthly subscription records, payment status, and receipts') : 'Dynamic Excel Business Matrix View for Sangam Monthly Contributions & Collections' }}
          </p>
        </div>

        <div *ngIf="api.currentUser()?.role !== 'MEMBER'" class="flex gap-2">
          <button (click)="openNewCycleModal()" class="btn-primary text-xs flex items-center gap-1.5 shadow-sm font-bold">
            <span>➕</span>
            <span>Start Next Collection Cycle</span>
          </button>
        </div>
      </div>

      <!-- Success Notification Alert -->
      <div *ngIf="successMessage()" class="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
        <div class="flex items-center gap-2">
          <span class="text-base">✅</span>
          <span>{{ successMessage() }}</span>
        </div>
        <button (click)="successMessage.set('')" class="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
      </div>

      <!-- CYCLE SELECTOR & CONTROLS BAR -->
      <div class="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg">
            📂
          </div>
          <div class="flex-1 md:flex-initial">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Select Collection Cycle:</span>
            <select 
              [ngModel]="selectedCycleId()" 
              (ngModelChange)="switchCycle($event)" 
              class="w-full md:w-80 mt-0.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700">
              <option *ngFor="let c of matrixData()?.cycles" [value]="c.id">
                {{ c.collectionName }} — [{{ c.status }}] ({{ c.startMonth }}/{{ c.startYear }} to {{ c.endMonth }}/{{ c.endYear }})
              </option>
            </select>
          </div>
        </div>

        <div *ngIf="api.currentUser()?.role !== 'MEMBER'" class="flex items-center gap-2 w-full md:w-auto justify-end">
          <!-- Complete Cycle Button (Only visible if viewing an ACTIVE cycle) -->
          <button *ngIf="matrixData()?.activeConfig?.status === 'ACTIVE'" 
                  (click)="completeCurrentCycle()" 
                  [disabled]="completingCycle()"
                  class="px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <span>🏁</span>
            <span>{{ completingCycle() ? 'Completing...' : 'Mark Cycle Completed' }}</span>
          </button>

          <!-- Edit Configuration Button -->
          <button (click)="openConfigModal()" class="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      <!-- SELECTED COLLECTION CYCLE PROMINENT BANNER -->
      <div *ngIf="matrixData()?.activeConfig as config" class="mb-6 p-5 rounded-xl theme-bg-header text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-slate-700/80 animate-in fade-in">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-extrabold text-2xl shadow">
            📅
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-base font-bold text-white">{{ config.collectionName }}</h3>
              <span [class.bg-amber-400]="config.status === 'ACTIVE'"
                    [class.text-slate-900]="config.status === 'ACTIVE'"
                    [class.bg-slate-300]="config.status === 'COMPLETED'"
                    [class.text-slate-800]="config.status === 'COMPLETED'"
                    class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase shadow-sm">
                {{ config.status === 'ACTIVE' ? 'ACTIVE CYCLE' : 'COMPLETED / ARCHIVE' }}
              </span>
            </div>
            <p class="text-xs text-slate-300 mt-1 font-medium">
              Tenure: Month {{ config.startMonth }}/{{ config.startYear }} to {{ config.endMonth }}/{{ config.endYear }}
              <span class="mx-1.5">•</span>
              Due: Every {{ config.dueDate || 10 }}th
              <span class="mx-1.5">•</span>
              Grace: {{ config.gracePeriod || 5 }} days
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end md:self-center">
          <div class="bg-emerald-950/90 px-4 py-2.5 rounded-lg border border-emerald-800 text-right shadow-inner">
            <span class="text-[10px] text-emerald-300 uppercase block font-semibold">Monthly Rate</span>
            <span class="text-xl font-extrabold text-amber-300">₹{{ config.monthlyAmount | number:'1.2-2' }}</span>
            <span class="text-[10px] text-emerald-300"> / member</span>
          </div>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div class="glass-card p-5 border-l-4 border-emerald-600 shadow-md">
          <span class="text-slate-500 font-bold text-xs uppercase tracking-wider block">Cycle Total Paid</span>
          <span class="text-2xl font-black text-emerald-800 mt-1 block">₹{{ matrixData()?.grandTotalPaid | number:'1.2-2' }}</span>
          <p class="text-[11px] text-slate-400 mt-1">Successfully collected contributions</p>
        </div>
        <div class="glass-card p-5 border-l-4 border-amber-600 shadow-md">
          <span class="text-slate-500 font-bold text-xs uppercase tracking-wider block">Cycle Total Pending</span>
          <span class="text-2xl font-black text-amber-800 mt-1 block">₹{{ matrixData()?.grandTotalPending | number:'1.2-2' }}</span>
          <p class="text-[11px] text-slate-400 mt-1">Pending to be collected</p>
        </div>
        <div class="glass-card p-5 border-l-4 border-slate-600 shadow-md">
          <span class="text-slate-500 font-bold text-xs uppercase tracking-wider block">Total Members In Cycle</span>
          <span class="text-2xl font-black text-slate-800 mt-1 block">{{ matrixData()?.rows?.length || 0 }}</span>
          <p class="text-[11px] text-slate-400 mt-1">Registered contributing members</p>
        </div>
      </div>

      <!-- MATRIX DATA SECTION -->
      <div class="glass-card p-6 shadow-xl overflow-hidden">
        <div *ngIf="loading()" class="py-16 text-center text-slate-500 font-medium">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-800 border-t-transparent mb-3"></div>
          <p class="text-xs">Loading collection business matrix...</p>
        </div>

        <!-- Empty State When No Members Found -->
        <div *ngIf="!loading() && (!matrixData()?.rows || matrixData()?.rows?.length === 0)" class="py-16 text-center">
          <div class="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            👥
          </div>
          <h3 class="text-sm font-bold text-slate-800">No Members Found for This Sangam</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please register members first in the Members section.
          </p>
          <a routerLink="/members" class="btn-gold inline-flex items-center gap-2 text-xs font-bold mt-4 px-5 py-2.5 shadow-md">
            <span>➕</span>
            <span>Add Sangam Members Now →</span>
          </a>
        </div>

        <!-- Populated Matrix Table -->
        <div *ngIf="!loading() && matrixData()?.rows?.length > 0 as data" class="matrix-table-wrapper">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="sticky-col-1">S.NO</th>
                <th class="sticky-col-2">MEMBER CODE</th>
                <th class="sticky-col-3 text-left">MEMBER NAME</th>
                <!-- DYNAMIC MONTH HEADERS -->
                <th *ngFor="let header of matrixData().monthHeaders">{{ header }}</th>
                <th class="bg-emerald-900 text-amber-300">TOTAL PAID</th>
                <th class="bg-red-900 text-red-100">TOTAL PENDING</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of matrixData().rows; let i = index" class="hover:bg-slate-50 transition">
                <td class="sticky-col-1 font-bold text-slate-500 text-center">{{ i + 1 }}</td>
                <td class="sticky-col-2 font-mono text-xs font-bold text-slate-700">{{ row.memberCode || '—' }}</td>
                <td class="sticky-col-3 font-bold text-slate-900 text-left">
                  <div class="flex items-center gap-2 max-w-[190px]">
                    <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
                      {{ row.memberName?.charAt(0).toUpperCase() }}
                    </div>
                    <span class="truncate" [title]="row.memberName">{{ row.memberName }}</span>
                  </div>
                </td>
                
                <!-- DYNAMIC MONTH CELLS -->
                <td *ngFor="let cell of row.months" 
                    (click)="cell.status !== 'N/A' && openPaymentModal(row, cell)"
                    [class.matrix-cell-paid]="cell.status === 'PAID'"
                    [class.matrix-cell-pending]="cell.status === 'PENDING'"
                    [class.matrix-cell-partial]="cell.status === 'PARTIAL'"
                    [class.bg-slate-100]="cell.status === 'N/A'"
                    [class.cursor-not-allowed]="cell.status === 'N/A' || (api.currentUser()?.role === 'MEMBER' && cell.status !== 'PAID')"
                    [class.cursor-pointer]="cell.status === 'PAID' || (api.currentUser()?.role !== 'MEMBER' && cell.status !== 'N/A')"
                    class="transition hover:opacity-80"
                    [title]="cell.status === 'PAID' ? 'Click to view & download Receipt PDF' : (api.currentUser()?.role === 'MEMBER' ? 'Pending Contribution' : 'Click to collect payment')">
                  <div class="text-xs" *ngIf="cell.status !== 'N/A'">
                    <div class="font-bold">₹{{ cell.paidAmount }}</div>
                    <div class="text-[9px] opacity-75 font-semibold uppercase flex items-center justify-center gap-0.5">
                      <span *ngIf="cell.status === 'PAID'">🧾</span>
                      <span>{{ cell.status }}</span>
                    </div>
                  </div>
                  <div class="text-xs text-slate-400 font-semibold" *ngIf="cell.status === 'N/A'">
                    —
                  </div>
                </td>

                <td class="font-bold text-emerald-700 bg-emerald-50 text-center">₹{{ row.totalPaid | number:'1.0-0' }}</td>
                <td class="font-bold text-red-600 bg-red-50 text-center">₹{{ row.totalPending | number:'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PAYMENT RECORD MODAL -->
    <div *ngIf="showPaymentModal()" class="modal-overlay">
      <div class="modal-content max-w-md w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 class="text-base font-bold text-slate-900">Record Member Collection / வசூல் பதிவு</h3>
          <button (click)="showPaymentModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <div *ngIf="selectedCell() as cell" class="space-y-4">
          <div class="bg-slate-50 p-4 rounded-xl border text-xs space-y-1.5">
            <div><span class="font-bold text-slate-600">Member:</span> <span class="font-bold text-slate-900">{{ selectedRow()?.memberName }} ({{ selectedRow()?.memberCode }})</span></div>
            <div><span class="font-bold text-slate-600">Period:</span> <span class="font-semibold text-slate-800">{{ cell.monthName }} {{ cell.year }}</span></div>
            <div><span class="font-bold text-slate-600">Expected Amount:</span> ₹{{ cell.expectedAmount }}</div>
            <div><span class="font-bold text-slate-600">Already Paid:</span> ₹{{ cell.paidAmount }}</div>
            <div class="text-red-600 font-bold text-sm pt-1 border-t border-slate-200 mt-1">Remaining Balance: ₹{{ cell.balanceAmount }}</div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Amount to Collect (₹) *</label>
            <input 
              type="number" 
              [(ngModel)]="paymentForm.amountPaid" 
              class="w-full p-2.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <!-- CUSTOM COLLECTION DATE PICKER -->
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Collection Date / வசூல் தேதி *</label>
            <input 
              type="date" 
              [(ngModel)]="paymentForm.paymentDate" 
              class="w-full p-2.5 border rounded-lg text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            <p class="text-[10px] text-slate-400 mt-0.5">Custom date for backdated or advance collection</p>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Payment Mode *</label>
            <select [(ngModel)]="paymentForm.paymentMode" class="w-full p-2.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CASH">Cash / ரொக்கம்</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Reference Number / Remarks</label>
            <input type="text" [(ngModel)]="paymentForm.referenceNumber" placeholder="e.g. UPI Ref 123456" class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <!-- Auto-Download PDF Option -->
          <div class="flex items-center gap-2 pt-1">
            <input 
              type="checkbox" 
              id="autoDownloadPdf" 
              [(ngModel)]="paymentForm.autoDownloadPdf" 
              class="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer">
            <label for="autoDownloadPdf" class="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Download Receipt PDF immediately after saving
            </label>
          </div>

          <div *ngIf="paymentError()" class="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ paymentError() }}</span>
          </div>

          <div class="flex gap-2 pt-2">
            <button (click)="showPaymentModal.set(false)" class="btn-primary bg-slate-400 hover:bg-slate-500 w-1/3 text-xs py-2.5">Cancel</button>
            <button (click)="submitPayment()" [disabled]="submittingPayment()" class="btn-gold w-2/3 text-xs py-2.5 font-bold shadow-md flex items-center justify-center gap-1.5">
              <span *ngIf="submittingPayment()" class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent"></span>
              <span>{{ submittingPayment() ? 'Recording...' : 'Collect & Generate Receipt ✨' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RECEIPT PREVIEW / DOWNLOAD MODAL -->
    <div *ngIf="showReceiptModal()" class="modal-overlay">
      <div class="modal-content max-w-lg w-full animate-in fade-in zoom-in-95 p-6">
        <div class="flex justify-between items-center pb-3 border-b mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧾</span>
            <div>
              <h3 class="text-base font-bold text-slate-900">Official Collection Receipt / வசூல் ரசீது</h3>
              <p class="text-[10px] text-slate-500">Sangam verified contribution payment receipt</p>
            </div>
          </div>
          <button (click)="showReceiptModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1 text-base">✕</button>
        </div>

        <div *ngIf="currentReceipt() as r" class="space-y-4">
          <!-- Visual Receipt Preview Card -->
          <div class="p-5 rounded-2xl border-2 border-orange-300 bg-amber-50/50 text-xs space-y-3.5 relative overflow-hidden shadow-sm">
            <!-- Header with Sangam Name -->
            <div class="text-center pb-2">
              <span class="text-[11px] font-bold text-orange-600 tracking-wider block mb-1">{{ r.slogan || api.currentSlogan() }}</span>
              <h4 class="text-lg font-black text-orange-950 leading-snug">
                {{ r.sangamName }}
              </h4>
              <p *ngIf="r.sangamAddress" class="text-[11px] text-slate-500 mt-0.5 font-medium">📍 {{ r.sangamAddress }}</p>
              <p *ngIf="r.sangamMobile" class="text-[10px] text-slate-500 font-medium">📞 அலைபேசி: {{ r.sangamMobile }}</p>
            </div>

            <!-- Title (No background color, themed text color) -->
            <div class="text-center my-2">
              <span class="inline-block text-orange-600 font-black text-xs uppercase tracking-wider">
                மாதாந்திர சந்தா ரசீது • COLLECTION RECEIPT
              </span>
            </div>

            <!-- Divider Line -->
            <div class="border-b border-orange-200"></div>

            <!-- Receipt Meta Row -->
            <div class="flex justify-between items-center bg-white/95 px-3 py-2 rounded-xl border border-orange-200 shadow-xs">
              <div>
                <span class="text-[10px] text-slate-400 font-semibold">ரசீது எண் / RECEIPT NO: </span>
                <span class="font-mono font-bold text-orange-900 text-xs ml-1">{{ r.receiptNumber }}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 font-semibold">வசூல் தேதி / DATE: </span>
                <span class="font-bold text-slate-800 text-xs ml-1">{{ r.paymentDate | date:'mediumDate' }}</span>
              </div>
            </div>

            <!-- Member & Contribution Details -->
            <div class="space-y-2 text-xs bg-white/80 p-3 rounded-xl border border-orange-100">
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Member Name:</span>
                <span class="font-bold text-slate-900">{{ r.memberName }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Member Code:</span>
                <span class="font-mono font-bold text-emerald-800">{{ r.memberCode || '—' }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Contribution Period:</span>
                <span class="font-bold text-orange-700">{{ r.monthName }} {{ r.year }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Payment Mode:</span>
                <span class="font-semibold text-slate-800">{{ r.paymentMode }}</span>
              </div>
              <div *ngIf="r.referenceNumber" class="flex justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500 font-medium">Reference:</span>
                <span class="font-mono text-slate-600">{{ r.referenceNumber }}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-500 font-medium">Collected By:</span>
                <span class="font-medium text-slate-700">{{ r.collectedBy || 'Admin' }}</span>
              </div>
            </div>

            <!-- Highlighted Amount Box -->
            <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center shadow-xs">
              <span class="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">AMOUNT PAID / வசூலான தொகை</span>
              <span class="text-2xl font-black text-emerald-900 block my-0.5">₹{{ r.amountPaid | number:'1.2-2' }}</span>
            </div>

            <!-- Signatures Row in Preview -->
            <div class="flex justify-between items-end pt-3 pb-1 text-[10px]">
              <div class="text-center w-[36%]">
                <div class="h-6"></div>
                <div class="border-t border-dashed border-slate-300 pt-1 text-slate-600 font-semibold">
                  உறுப்பினர் கையொப்பம்
                </div>
              </div>
              <div class="text-center w-[26%] pb-1">
                <span class="inline-block border border-emerald-600 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">
                  ✓ PAID
                </span>
              </div>
              <div class="text-center w-[36%]">
                <div class="h-6"></div>
                <div class="border-t border-dashed border-slate-300 pt-1 text-slate-600 font-semibold">
                  நிர்வாகி கையொப்பம்
                </div>
              </div>
            </div>

            <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2">
              இது கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது • Powered by Oor Nithi
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-2">
            <button 
              type="button" 
              (click)="printReceipt(r)" 
              class="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-1/3 transition shadow-sm">
              <span>🖨️</span>
              <span>Print</span>
            </button>
            <button 
              type="button" 
              (click)="downloadReceiptPdf(r)" 
              class="btn-gold flex-1 text-xs py-2.5 font-bold shadow-md flex items-center justify-center gap-1.5">
              <span>📥</span>
              <span>Download PDF Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIGURATION MODAL (Create New Cycle / Edit Cycle) -->
    <div *ngIf="showConfigModal()" class="modal-overlay">
      <div class="modal-content max-w-md w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 class="text-base font-bold text-slate-900">
            {{ isCreatingNewCycle() ? 'Start New Collection Cycle' : 'Edit Collection Cycle' }}
          </h3>
          <button (click)="showConfigModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <div *ngIf="isCreatingNewCycle()" class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 mb-3">
          💡 Starting a new cycle will archive previous cycles and generate 12 monthly slots for all Sangam members.
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Collection Name *</label>
            <input type="text" [(ngModel)]="configForm.collectionName" placeholder="e.g. Monthly Sangam Fund 2027-2028" class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Monthly Amount Per Member (₹) *</label>
            <input type="number" [(ngModel)]="configForm.monthlyAmount" placeholder="500" class="w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Start Month & Year</label>
              <div class="flex gap-1.5">
                <input type="number" [(ngModel)]="configForm.startMonth" placeholder="9 (Sep)" min="1" max="12" class="w-1/2 p-2 border rounded-lg text-xs">
                <input type="number" [(ngModel)]="configForm.startYear" placeholder="2027" class="w-1/2 p-2 border rounded-lg text-xs">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">End Month & Year</label>
              <div class="flex gap-1.5">
                <input type="number" [(ngModel)]="configForm.endMonth" placeholder="8 (Aug)" min="1" max="12" class="w-1/2 p-2 border rounded-lg text-xs">
                <input type="number" [(ngModel)]="configForm.endYear" placeholder="2028" class="w-1/2 p-2 border rounded-lg text-xs">
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Monthly Due Date</label>
              <input type="number" [(ngModel)]="configForm.dueDate" placeholder="10" min="1" max="31" class="w-full p-2 border rounded-lg text-xs">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Grace Period (Days)</label>
              <input type="number" [(ngModel)]="configForm.gracePeriod" placeholder="5" min="0" max="30" class="w-full p-2 border rounded-lg text-xs">
            </div>
          </div>

          <div *ngIf="configError()" class="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ configError() }}</span>
          </div>

          <button (click)="submitConfig()" [disabled]="submittingConfig()" class="btn-gold w-full text-xs py-2.5 font-bold shadow-md flex items-center justify-center gap-1.5 mt-2">
            <span *ngIf="submittingConfig()" class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent"></span>
            <span>{{ submittingConfig() ? 'Saving Configuration...' : (isCreatingNewCycle() ? 'Launch New Cycle & Generate Slots 🚀' : 'Save Configuration Changes') }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class CollectionMatrixComponent implements OnInit {
  loading = signal(true);
  matrixData = signal<any>(null);
  selectedCycleId = signal<string | null>(null);

  showPaymentModal = signal(false);
  showReceiptModal = signal(false);
  showConfigModal = signal(false);
  isCreatingNewCycle = signal(false);
  completingCycle = signal(false);

  submittingPayment = signal(false);
  submittingConfig = signal(false);
  paymentError = signal('');
  configError = signal('');
  successMessage = signal('');

  selectedRow = signal<any>(null);
  selectedCell = signal<any>(null);
  currentReceipt = signal<ReceiptData | null>(null);

  paymentForm = {
    amountPaid: 0,
    paymentMode: 'UPI',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    autoDownloadPdf: false
  };

  configForm = {
    collectionName: 'Monthly Sangam Fund 2026-2027',
    monthlyAmount: 500,
    startMonth: 9,
    startYear: 2026,
    endMonth: 8,
    endYear: 2027,
    dueDate: 10,
    gracePeriod: 5
  };

  constructor(
    public i1n: I1nService, 
    public api: ApiService,
    private receiptPdfService: ReceiptPdfService
  ) {}

  ngOnInit() {
    this.loadMatrix();
  }

  loadMatrix(configId?: string) {
    this.loading.set(true);
    const url = configId ? `/collections/matrix?configId=${configId}` : '/collections/matrix';
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.matrixData.set(res.data);
          if (res.data.activeConfig) {
            this.selectedCycleId.set(res.data.activeConfig.id);
            this.configForm = {
              collectionName: res.data.activeConfig.collectionName,
              monthlyAmount: res.data.activeConfig.monthlyAmount,
              startMonth: res.data.activeConfig.startMonth,
              startYear: res.data.activeConfig.startYear,
              endMonth: res.data.activeConfig.endMonth,
              endYear: res.data.activeConfig.endYear,
              dueDate: res.data.activeConfig.dueDate || 10,
              gracePeriod: res.data.activeConfig.gracePeriod || 5
            };
          }
        }
      },
      error: () => this.loading.set(false)
    });
  }

  switchCycle(cycleId: string) {
    if (cycleId) {
      this.selectedCycleId.set(cycleId);
      this.loadMatrix(cycleId);
    }
  }

  completeCurrentCycle() {
    const config = this.matrixData()?.activeConfig;
    if (!config) return;

    if (!confirm(`Are you sure you want to mark "${config.collectionName}" as COMPLETED? Once completed, this cycle will be archived.`)) {
      return;
    }

    this.completingCycle.set(true);
    this.api.put<any>(`/collections/cycles/${config.id}/complete`, {}).subscribe({
      next: (res) => {
        this.completingCycle.set(false);
        if (res.success) {
          this.successMessage.set(`Collection cycle "${config.collectionName}" marked as COMPLETED!`);
          this.loadMatrix(config.id);
          setTimeout(() => this.successMessage.set(''), 6000);
        }
      },
      error: (err) => {
        this.completingCycle.set(false);
        alert(err.error?.message || 'Failed to complete cycle.');
      }
    });
  }

  openNewCycleModal() {
    const curr = this.matrixData()?.activeConfig;
    let nextStartMonth = 9;
    let nextStartYear = 2027;
    let nextEndMonth = 8;
    let nextEndYear = 2028;
    let amount = 500;
    let nextName = 'Monthly Sangam Fund 2027-2028';

    if (curr) {
      amount = curr.monthlyAmount || 500;
      nextStartYear = (curr.endYear || 2026) + (curr.endMonth === 12 ? 1 : 0);
      nextStartMonth = curr.endMonth === 12 ? 1 : (curr.endMonth + 1);
      nextEndYear = nextStartYear + 1;
      nextEndMonth = nextStartMonth === 1 ? 12 : (nextStartMonth - 1);
      nextName = `Monthly Sangam Fund ${nextStartYear}-${nextEndYear}`;
    }

    this.configForm = {
      collectionName: nextName,
      monthlyAmount: amount,
      startMonth: nextStartMonth,
      startYear: nextStartYear,
      endMonth: nextEndMonth,
      endYear: nextEndYear,
      dueDate: curr?.dueDate || 10,
      gracePeriod: curr?.gracePeriod || 5
    };

    this.isCreatingNewCycle.set(true);
    this.configError.set('');
    this.showConfigModal.set(true);
  }

  openConfigModal() {
    this.isCreatingNewCycle.set(false);
    this.configError.set('');
    this.showConfigModal.set(true);
  }

  submitConfig() {
    this.configError.set('');
    this.submittingConfig.set(true);

    this.api.post<any>('/collections/config', this.configForm).subscribe({
      next: (res) => {
        this.submittingConfig.set(false);
        if (res.success) {
          this.showConfigModal.set(false);
          this.successMessage.set(`Collection cycle "${this.configForm.collectionName}" created successfully!`);
          this.loadMatrix();
          setTimeout(() => this.successMessage.set(''), 6000);
        }
      },
      error: (err) => {
        this.submittingConfig.set(false);
        this.configError.set(err.error?.message || 'Failed to save collection configuration.');
      }
    });
  }

  openPaymentModal(row: any, cell: any) {
    if (cell.status === 'N/A') return;
    this.selectedRow.set(row);
    this.selectedCell.set(cell);

    // If cell is already PAID, show receipt with download/print option
    if (cell.status === 'PAID') {
      this.fetchAndShowReceipt(row, cell);
      return;
    }

    // Members cannot open payment collection modal
    if (this.api.currentUser()?.role === 'MEMBER') {
      return;
    }

    this.paymentForm.amountPaid = cell.balanceAmount;
    this.paymentForm.paymentDate = new Date().toISOString().split('T')[0];
    this.paymentForm.paymentMode = 'UPI';
    this.paymentForm.referenceNumber = '';
    this.paymentForm.autoDownloadPdf = false;
    this.paymentError.set('');
    this.showPaymentModal.set(true);
  }

  fetchAndShowReceipt(row: any, cell: any) {
    const sangamName = this.api.currentUser()?.sangamName || 'பெருந்தலைவர் நற்பணி மன்றம்';

    this.api.get<any>(`/collections/receipt/${cell.collectionId}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const rData = { ...res.data, slogan: res.data.sangamSlogan || this.api.currentSlogan() };
          this.currentReceipt.set(rData);
          this.showReceiptModal.set(true);
        } else {
          this.openFallbackReceipt(row, cell, sangamName);
        }
      },
      error: () => {
        this.openFallbackReceipt(row, cell, sangamName);
      }
    });
  }

  private openFallbackReceipt(row: any, cell: any, sangamName: string) {
    const fallbackReceipt: ReceiptData = {
      receiptNumber: 'REC-' + (cell.collectionId ? cell.collectionId.substring(0, 8).toUpperCase() : Date.now()),
      sangamName: sangamName,
      slogan: this.api.currentSlogan(),
      memberName: row.memberName,
      memberCode: row.memberCode,
      monthName: cell.monthName,
      year: cell.year,
      amountPaid: cell.paidAmount || cell.expectedAmount,
      paymentMode: 'CASH',
      paymentDate: new Date(),
      collectedBy: this.api.currentUser()?.name || 'Admin'
    };
    this.currentReceipt.set(fallbackReceipt);
    this.showReceiptModal.set(true);
  }

  submitPayment() {
    this.submittingPayment.set(true);
    this.paymentError.set('');

    const body = {
      memberCollectionId: this.selectedCell().collectionId,
      amountPaid: this.paymentForm.amountPaid,
      paymentMode: this.paymentForm.paymentMode,
      referenceNumber: this.paymentForm.referenceNumber,
      paymentDate: this.paymentForm.paymentDate
    };

    this.api.post<any>('/collections/payment', body).subscribe({
      next: (res) => {
        this.submittingPayment.set(false);
        if (res.success) {
          this.showPaymentModal.set(false);
          this.successMessage.set(`Payment of ₹${this.paymentForm.amountPaid} recorded successfully! Receipt: ${res.data?.receiptNumber || 'OK'}`);
          this.loadMatrix(this.selectedCycleId() || undefined);

          const receiptData: ReceiptData = {
            receiptNumber: res.data?.receiptNumber || 'REC-' + Date.now(),
            sangamName: res.data?.sangamName || this.api.currentUser()?.sangamName || 'பெருந்தலைவர் நற்பணி மன்றம்',
            slogan: res.data?.sangamSlogan || this.api.currentSlogan(),
            sangamAddress: res.data?.sangamAddress || '',
            sangamMobile: res.data?.sangamMobile || '',
            memberName: res.data?.memberName || this.selectedRow()?.memberName,
            memberCode: res.data?.memberCode || this.selectedRow()?.memberCode,
            monthName: res.data?.monthName || this.selectedCell()?.monthName,
            year: res.data?.year || this.selectedCell()?.year,
            amountPaid: res.data?.amountPaid || this.paymentForm.amountPaid,
            paymentMode: res.data?.paymentMode || this.paymentForm.paymentMode,
            paymentDate: this.paymentForm.paymentDate || res.data?.paymentDate || new Date(),
            referenceNumber: res.data?.referenceNumber || this.paymentForm.referenceNumber,
            collectedBy: res.data?.collectedBy || this.api.currentUser()?.name || 'Admin'
          };

          this.currentReceipt.set(receiptData);

          if (this.paymentForm.autoDownloadPdf) {
            this.receiptPdfService.downloadReceiptPdf(receiptData);
          }

          this.showReceiptModal.set(true);
          setTimeout(() => this.successMessage.set(''), 6000);
        }
      },
      error: (err) => {
        this.submittingPayment.set(false);
        this.paymentError.set(err.error?.message || 'Payment recording failed.');
      }
    });
  }

  downloadReceiptPdf(receipt: ReceiptData) {
    this.receiptPdfService.downloadReceiptPdf(receipt);
  }

  printReceipt(receipt: ReceiptData) {
    this.receiptPdfService.printReceipt(receipt);
  }
}
