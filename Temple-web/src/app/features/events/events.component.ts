import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <!-- Title & Action Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ i1n.t('events') }} Management</h1>
          <p class="text-xs text-slate-500 mt-0.5">Track Temple Festivals (Kovil Thiruvizha), Budgets & Line-Item Expenses</p>
        </div>

        <button *ngIf="api.currentUser()?.role !== 'MEMBER'" (click)="openCreateEventModal()" class="btn-gold text-xs font-bold shadow-md flex items-center gap-1.5">
          <span>🏛️</span>
          <span>+ Create New Event</span>
        </button>
      </div>

      <!-- Empty State -->
      <div *ngIf="events().length === 0" class="glass-card p-12 text-center max-w-lg mx-auto">
        <div class="text-4xl mb-3">🛕</div>
        <h3 class="text-base font-bold text-slate-800">No Events Created Yet</h3>
        <p class="text-xs text-slate-500 mt-1 mb-6">
          Create your first Kovil Thiruvizha or Sangam event to budget and track line-item expenses.
        </p>
        <button *ngIf="api.currentUser()?.role !== 'MEMBER'" (click)="openCreateEventModal()" class="btn-gold text-xs font-bold">+ Create First Event</button>
      </div>

      <!-- Events List Cards Grid -->
      <div *ngIf="events().length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div *ngFor="let ev of events()" class="glass-card p-6 border-t-4 border-orange-500 shadow-lg flex flex-col justify-between">
          <div>
            <!-- Header Title & Badges -->
            <div class="flex justify-between items-start mb-3">
              <div>
                <span class="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-900 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {{ ev.eventType }}
                </span>
                <h3 class="text-xl font-bold text-slate-900 mt-1.5">{{ ev.eventName }}</h3>
                <p class="text-xs text-orange-600 font-bold mt-0.5">{{ ev.tamilEventName || ev.templeName }}</p>
                <p *ngIf="ev.location" class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{{ ev.location }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase"
                      [ngClass]="{
                        'bg-blue-100 text-blue-800 border-blue-300': ev.status === 'UPCOMING',
                        'bg-emerald-100 text-emerald-800 border-emerald-300': ev.status === 'ONGOING',
                        'bg-slate-100 text-slate-700 border-slate-300': ev.status === 'COMPLETED',
                        'bg-red-100 text-red-800 border-red-300': ev.status === 'CANCELLED'
                      }">
                  {{ ev.status }}
                </span>
                <button *ngIf="api.currentUser()?.role !== 'MEMBER'"
                        (click)="openEditEventModal(ev)"
                        title="Edit Event"
                        class="p-1.5 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition text-xs flex items-center gap-1 font-bold">
                  <span>✏️</span>
                  <span class="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>

            <!-- Dates display if available -->
            <div class="flex items-center gap-4 text-xs text-slate-500 mb-2">
              <span class="flex items-center gap-1">
                <span>📅</span>
                <span>{{ ev.startDate | date:'mediumDate' }}</span>
                <span *ngIf="ev.endDate"> → {{ ev.endDate | date:'mediumDate' }}</span>
              </span>
            </div>

            <!-- Budget Bar Card -->
            <div class="bg-slate-50 p-4 rounded-xl my-4 text-xs space-y-2 border border-slate-200/80">
              <div class="flex justify-between font-bold text-slate-700">
                <span>Expected Budget: ₹{{ ev.expectedBudget | number:'1.0-0' }}</span>
                <span>Total Expenses: ₹{{ ev.totalExpenses | number:'1.0-0' }}</span>
              </div>
              <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500" 
                     [style.width.%]="getProgressPercent(ev.totalExpenses, ev.expectedBudget)"></div>
              </div>
              <div class="flex justify-between items-center pt-0.5 text-[11px]">
                <span class="text-slate-500">
                  {{ (ev.expenses || []).length }} Expense Items Recorded
                </span>
                <span class="font-extrabold" [class.text-emerald-700]="ev.remainingBudget >= 0" [class.text-red-600]="ev.remainingBudget < 0">
                  Remaining Budget: ₹{{ ev.remainingBudget | number:'1.0-0' }}
                </span>
              </div>
            </div>

            <!-- INLINE EXPENSE BREAKDOWN (Expandable) -->
            <div class="mt-4 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>💸</span>
                  <span>Expense Breakdown ({{ (ev.expenses || []).length }})</span>
                </span>
                <button 
                  (click)="toggleInlineBreakdown(ev.id)" 
                  class="text-xs font-bold text-orange-600 hover:text-orange-700 transition flex items-center gap-1">
                  <span>{{ isCardExpanded(ev.id) ? 'Hide ▲' : 'Show List ▼' }}</span>
                </button>
              </div>

              <!-- Inline List Preview (Shown when expanded) -->
              <div *ngIf="isCardExpanded(ev.id)" class="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 animate-in fade-in">
                <div *ngIf="!ev.expenses || ev.expenses.length === 0" class="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No expenses recorded for this event yet.
                </div>

                <div *ngFor="let exp of ev.expenses" 
                     class="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-orange-50/50 rounded-xl border border-slate-200/80 transition text-xs">
                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 border border-orange-200">
                        {{ exp.expenseCategory }}
                      </span>
                      <span *ngIf="exp.vendorName" class="font-bold text-slate-800 truncate max-w-[140px]">
                        {{ exp.vendorName }}
                      </span>
                    </div>
                    <p *ngIf="exp.description" class="text-[11px] text-slate-500 truncate max-w-[220px]">
                      {{ exp.description }}
                    </p>
                    <p class="text-[10px] text-slate-400">
                      {{ exp.expenseDate | date:'mediumDate' }}
                      <span *ngIf="exp.paymentMode" class="ml-1.5 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold text-[9px]">
                        {{ exp.paymentMode }}
                      </span>
                    </p>
                  </div>
                  <div class="text-right pl-2">
                    <span class="text-xs font-extrabold text-slate-900 block">₹{{ exp.amount | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons Footer -->
          <div class="mt-5 pt-3 border-t border-slate-100 flex gap-2">
            <button 
              (click)="openViewExpensesModal(ev)" 
              [ngClass]="api.currentUser()?.role === 'MEMBER' ? 'w-full' : 'flex-1'"
              class="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/40 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs">
              <span>📋</span>
              <span>View ({{ (ev.expenses || []).length }})</span>
            </button>
            <button *ngIf="api.currentUser()?.role !== 'MEMBER'"
              (click)="openEditEventModal(ev)"
              class="py-2.5 px-3 rounded-xl border border-orange-200 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs">
              <span>✏️</span>
              <span>Edit</span>
            </button>
            <button *ngIf="api.currentUser()?.role !== 'MEMBER'"
              (click)="openAddExpenseModal(ev)" 
              class="flex-1 py-2.5 px-3 rounded-xl btn-gold text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
              <span>➕</span>
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. VIEW EXPENSES MODAL (Full Detailed Audit Table for Particular Event) -->
    <div *ngIf="showViewModal()" class="modal-overlay">
      <div class="modal-content max-w-3xl w-full animate-in fade-in zoom-in-95">
        <!-- Modal Header -->
        <div class="flex justify-between items-start mb-5 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🛕</span>
              <h3 class="text-lg font-bold text-slate-900">{{ viewingEvent()?.eventName }}</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-orange-100 text-orange-800">
                {{ viewingEvent()?.eventType }}
              </span>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase"
                    [ngClass]="{
                      'bg-blue-100 text-blue-800 border border-blue-200': viewingEvent()?.status === 'UPCOMING',
                      'bg-emerald-100 text-emerald-800 border border-emerald-200': viewingEvent()?.status === 'ONGOING',
                      'bg-slate-100 text-slate-700 border border-slate-200': viewingEvent()?.status === 'COMPLETED',
                      'bg-red-100 text-red-800 border border-red-200': viewingEvent()?.status === 'CANCELLED'
                    }">
                {{ viewingEvent()?.status }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Itemized Line-Item Expenses & Vendor Payment History
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button *ngIf="api.currentUser()?.role !== 'MEMBER'"
                    (click)="openEditEventModal(viewingEvent())"
                    class="btn-secondary text-xs py-1.5 px-3 font-bold flex items-center gap-1 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg">
              <span>✏️</span>
              <span>Edit Event</span>
            </button>
            <button (click)="showViewModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
          </div>
        </div>

        <!-- Event KPI Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Expected Budget</span>
            <span class="text-base font-extrabold text-slate-900">₹{{ viewingEvent()?.expectedBudget | number:'1.0-0' }}</span>
          </div>
          <div class="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
            <span class="text-[10px] font-bold text-orange-700 uppercase block">Total Spent</span>
            <span class="text-base font-extrabold text-orange-600">₹{{ viewingEvent()?.totalExpenses | number:'1.0-0' }}</span>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span class="text-[10px] font-bold text-emerald-700 uppercase block">Remaining</span>
            <span class="text-base font-extrabold text-emerald-700">₹{{ viewingEvent()?.remainingBudget | number:'1.0-0' }}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span class="text-[10px] font-bold text-slate-500 uppercase block">Total Items</span>
            <span class="text-base font-extrabold text-slate-900">{{ (viewingEvent()?.expenses || []).length }} Items</span>
          </div>
        </div>

        <!-- Search / Filter -->
        <div class="flex justify-between items-center mb-3">
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Line-Item Expenses</h4>
          <button *ngIf="api.currentUser()?.role !== 'MEMBER'"
            (click)="openAddExpenseFromViewModal()" 
            class="btn-gold text-xs py-1.5 px-3 font-bold flex items-center gap-1 shadow-sm">
            <span>➕</span>
            <span>Record Another Expense</span>
          </button>
        </div>

        <!-- Expenses Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-xs mb-4">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="theme-table-header">
                <th class="p-3 rounded-l-lg font-bold">#</th>
                <th class="p-3 font-bold">CATEGORY</th>
                <th class="p-3 font-bold">PAID TO / VENDOR</th>
                <th class="p-3 font-bold">DESCRIPTION</th>
                <th class="p-3 font-bold">MODE</th>
                <th class="p-3 font-bold">DATE</th>
                <th class="p-3 rounded-r-lg font-bold text-right">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              <tr *ngIf="!viewingEvent()?.expenses || viewingEvent()?.expenses.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-400">
                  No expenses recorded for this event yet. Click "Record Another Expense" above.
                </td>
              </tr>
              <tr *ngFor="let exp of viewingEvent()?.expenses; let i = index" class="hover:bg-orange-50/30 transition">
                <td class="p-3 font-bold text-slate-400">{{ i + 1 }}</td>
                <td class="p-3 font-bold">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-900 border border-orange-200">
                    {{ exp.expenseCategory }}
                  </span>
                </td>
                <td class="p-3 font-bold text-slate-800">{{ exp.vendorName || '—' }}</td>
                <td class="p-3 text-slate-600 max-w-xs">{{ exp.description || '—' }}</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    {{ exp.paymentMode || 'CASH' }}
                  </span>
                </td>
                <td class="p-3 text-slate-500 whitespace-nowrap">{{ exp.expenseDate | date:'mediumDate' }}</td>
                <td class="p-3 font-extrabold text-slate-900 text-right whitespace-nowrap">
                  ₹{{ exp.amount | number:'1.2-2' }}
                </td>
              </tr>
            </tbody>
            <tfoot *ngIf="viewingEvent()?.expenses && viewingEvent()?.expenses.length > 0">
              <tr class="bg-slate-50 border-t border-slate-200 font-extrabold text-xs">
                <td colspan="6" class="p-3 text-right text-slate-700">TOTAL SPENT:</td>
                <td class="p-3 text-right text-orange-600 text-sm">
                  ₹{{ viewingEvent()?.totalExpenses | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button (click)="showViewModal.set(false)" class="btn-primary bg-slate-500 hover:bg-slate-600 text-xs px-5 py-2">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- 2. CREATE EVENT MODAL -->
    <div *ngIf="showEventModal()" class="modal-overlay">
      <div class="modal-content max-w-lg w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Create Temple / Sangam Event</h3>
            <p class="text-xs text-slate-500">Add a new Kovil Thiruvizha or Sangam event</p>
          </div>
          <button (click)="showEventModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Event Name (English) *</label>
              <input type="text" [(ngModel)]="eventForm.eventName" placeholder="e.g. Kovil Thiruvizha 2026" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Tamil Event Name (தமிழ் பெயர்)</label>
              <input type="text" [(ngModel)]="eventForm.tamilEventName" placeholder="எ.கா. கோவில் திருவிழா" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Temple Name (கோவில்)</label>
              <input type="text" [(ngModel)]="eventForm.templeName" placeholder="e.g. Sri Mutharamman Temple" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Event Type</label>
              <select [(ngModel)]="eventForm.eventType" 
                      class="w-full p-2.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="TEMPLE_FESTIVAL">Temple Festival / கோவில் திருவிழா</option>
                <option value="SANGAM_EVENT">Sangam Event / சங்க நிகழ்வு</option>
                <option value="ANNADHANAM">Annadhanam / அன்னதானம்</option>
                <option value="CULTURAL">Cultural / கலை நிகழ்ச்சி</option>
                <option value="RELIGIOUS">Religious Pooja / ஆன்மீக பூஜை</option>
                <option value="OTHER">Other / பிற</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Start Date *</label>
              <input type="date" [(ngModel)]="eventForm.startDate" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">End Date</label>
              <input type="date" [(ngModel)]="eventForm.endDate" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Expected Budget (₹)</label>
              <input type="number" [(ngModel)]="eventForm.expectedBudget" placeholder="50000" 
                     class="w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Location / Venue</label>
            <input type="text" [(ngModel)]="eventForm.location" placeholder="e.g. Kovil Valagam" 
                   class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Description</label>
            <textarea [(ngModel)]="eventForm.description" rows="2" placeholder="Description or notes..."
                      class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
          </div>

          <button (click)="submitCreateEvent()" [disabled]="!eventForm.eventName || !eventForm.startDate" class="btn-gold w-full mt-2 font-bold shadow-md">
            Create Event →
          </button>
        </div>
      </div>
    </div>

    <!-- 3. ADD EVENT EXPENSE MODAL -->
    <div *ngIf="showExpenseModal()" class="modal-overlay">
      <div class="modal-content max-w-md w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">
            Add Expense • {{ selectedEvent()?.eventName }}
          </h3>
          <button (click)="showExpenseModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Expense Category *</label>
            <select [(ngModel)]="expenseForm.expenseCategory" 
                    class="w-full p-2.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="Melam">Melam / மேளம்</option>
              <option value="Santha Melam">Santha Melam / சந்த மேளம்</option>
              <option value="Serial Light">Serial Light / சீரியல் லைட்</option>
              <option value="Arch">Arch / வளைவு</option>
              <option value="Pandhal">Pandhal / பந்தல்</option>
              <option value="Decoration">Decoration / அலங்காரம்</option>
              <option value="Food">Food / அன்னதானம்</option>
              <option value="Transport">Transport / போக்குவரத்து</option>
              <option value="Pooja Items">Pooja Items / பூஜை பொருட்கள்</option>
              <option value="Other">Other / பிற</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Amount (₹) *</label>
              <input type="number" [(ngModel)]="expenseForm.amount" placeholder="5000" 
                     class="w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Payment Mode</label>
              <select [(ngModel)]="expenseForm.paymentMode" 
                      class="w-full p-2.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="CASH">Cash / ரொக்கம்</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Vendor Name / Paid To</label>
            <input type="text" [(ngModel)]="expenseForm.vendorName" placeholder="e.g. Shanmuga Melam Group" 
                   class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Description / Details (Optional)</label>
            <input type="text" [(ngModel)]="expenseForm.description" placeholder="e.g. 5-person melam for morning pooja" 
                   class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Expense Date</label>
              <input type="date" [(ngModel)]="expenseForm.expenseDate" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Reference / Voucher No</label>
              <input type="text" [(ngModel)]="expenseForm.referenceNumber" placeholder="UPI Ref / VCH-01" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <button (click)="submitAddExpense()" [disabled]="!expenseForm.amount || expenseForm.amount <= 0" 
                  class="btn-gold w-full mt-2 text-xs py-2.5 font-bold shadow-md">
            Add Expense & Record Ledger →
          </button>
        </div>
      </div>
    </div>

    <!-- 4. EDIT EVENT MODAL -->
    <div *ngIf="showEditModal()" class="modal-overlay">
      <div class="modal-content max-w-lg w-full animate-in fade-in zoom-in-95">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>✏️</span>
              <span>Edit Event Details</span>
            </h3>
            <p class="text-xs text-slate-500">Update event details, budget, dates and status</p>
          </div>
          <button (click)="showEditModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Event Name (English) *</label>
              <input type="text" [(ngModel)]="editForm.eventName" placeholder="e.g. Panguni Uthiram 2026" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Tamil Event Name (தமிழ் பெயர்)</label>
              <input type="text" [(ngModel)]="editForm.tamilEventName" placeholder="எ.கா. பங்குனி உத்திரம்" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Temple Name (கோவில்)</label>
              <input type="text" [(ngModel)]="editForm.templeName" placeholder="e.g. Sri Mutharamman Temple" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Event Type</label>
              <select [(ngModel)]="editForm.eventType" 
                      class="w-full p-2.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="TEMPLE_FESTIVAL">Temple Festival / கோவில் திருவிழா</option>
                <option value="SANGAM_EVENT">Sangam Event / சங்க நிகழ்வு</option>
                <option value="ANNADHANAM">Annadhanam / அன்னதானம்</option>
                <option value="CULTURAL">Cultural / கலை நிகழ்ச்சி</option>
                <option value="RELIGIOUS">Religious Pooja / ஆன்மீக பூஜை</option>
                <option value="OTHER">Other / பிற</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Start Date *</label>
              <input type="date" [(ngModel)]="editForm.startDate" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">End Date</label>
              <input type="date" [(ngModel)]="editForm.endDate" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Status</label>
              <select [(ngModel)]="editForm.status" 
                      class="w-full p-2.5 border rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="UPCOMING">Upcoming</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Expected Budget (₹)</label>
              <input type="number" [(ngModel)]="editForm.expectedBudget" placeholder="50000" 
                     class="w-full p-2.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 text-slate-700">Location / Venue</label>
              <input type="text" [(ngModel)]="editForm.location" placeholder="e.g. Vadakku Street Mandapam" 
                     class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1 text-slate-700">Description / Details</label>
            <textarea [(ngModel)]="editForm.description" rows="2" placeholder="Add any details, notes or guidelines..."
                      class="w-full p-2.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
          </div>

          <div *ngIf="editError" class="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {{ editError }}
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button (click)="showEditModal.set(false)" type="button"
                    class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition">
              Cancel
            </button>
            <button (click)="submitEditEvent()" [disabled]="!editForm.eventName || !editForm.startDate || isSavingEdit"
                    type="button"
                    class="btn-gold px-5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5">
              <span *ngIf="isSavingEdit">Saving...</span>
              <span *ngIf="!isSavingEdit">💾 Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EventsComponent implements OnInit {
  events = signal<any[]>([]);
  showEventModal = signal(false);
  showExpenseModal = signal(false);
  showViewModal = signal(false);
  showEditModal = signal(false);
  selectedEvent = signal<any>(null);
  viewingEvent = signal<any>(null);
  editingEvent = signal<any>(null);
  expandedCardId = signal<string | null>(null);

  isSavingEdit = false;
  editError: string | null = null;

  eventForm = {
    eventName: '',
    tamilEventName: '',
    templeName: '',
    eventType: 'TEMPLE_FESTIVAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    expectedBudget: 50000,
    location: '',
    description: ''
  };

  editForm = {
    eventName: '',
    tamilEventName: '',
    templeName: '',
    eventType: 'TEMPLE_FESTIVAL',
    startDate: '',
    endDate: '',
    expectedBudget: 50000,
    status: 'UPCOMING',
    location: '',
    description: ''
  };

  expenseForm = {
    expenseCategory: 'Melam',
    amount: 5000,
    vendorName: '',
    description: '',
    paymentMode: 'CASH',
    expenseDate: new Date().toISOString().split('T')[0],
    referenceNumber: ''
  };

  constructor(public i1n: I1nService, public api: ApiService) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.api.get<any>('/events').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events.set(res.data);
          // If viewing an event in modal, keep its data fresh
          if (this.viewingEvent()) {
            const updated = res.data.find((e: any) => e.id === this.viewingEvent().id);
            if (updated) {
              this.viewingEvent.set(updated);
            }
          }
        }
      }
    });
  }

  getProgressPercent(spent: number, budget: number): number {
    if (!budget || budget <= 0) return 0;
    const pct = ((spent || 0) / budget) * 100;
    return Math.min(Math.round(pct), 100);
  }

  toggleInlineBreakdown(eventId: string) {
    if (this.expandedCardId() === eventId) {
      this.expandedCardId.set(null);
    } else {
      this.expandedCardId.set(eventId);
    }
  }

  isCardExpanded(eventId: string): boolean {
    return this.expandedCardId() === eventId;
  }

  openViewExpensesModal(event: any) {
    this.viewingEvent.set(event);
    this.showViewModal.set(true);
  }

  openAddExpenseFromViewModal() {
    this.openAddExpenseModal(this.viewingEvent());
  }

  openCreateEventModal() {
    this.eventForm = {
      eventName: '',
      tamilEventName: '',
      templeName: '',
      eventType: 'TEMPLE_FESTIVAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      expectedBudget: 50000,
      location: '',
      description: ''
    };
    this.showEventModal.set(true);
  }

  submitCreateEvent() {
    if (!this.eventForm.eventName || !this.eventForm.startDate) return;

    const body: any = {
      eventName: this.eventForm.eventName.trim(),
      tamilEventName: this.eventForm.tamilEventName ? this.eventForm.tamilEventName.trim() : null,
      templeName: this.eventForm.templeName ? this.eventForm.templeName.trim() : null,
      eventType: this.eventForm.eventType,
      startDate: this.eventForm.startDate,
      endDate: this.eventForm.endDate ? this.eventForm.endDate : null,
      expectedBudget: Number(this.eventForm.expectedBudget) || 0,
      location: this.eventForm.location ? this.eventForm.location.trim() : null,
      description: this.eventForm.description ? this.eventForm.description.trim() : null
    };

    this.api.post<any>('/events', body).subscribe({
      next: (res) => {
        if (res.success) {
          this.showEventModal.set(false);
          this.loadEvents();
        }
      }
    });
  }

  openEditEventModal(event: any) {
    this.editingEvent.set(event);
    this.editError = null;
    this.isSavingEdit = false;
    this.editForm = {
      eventName: event.eventName || '',
      tamilEventName: event.tamilEventName || '',
      templeName: event.templeName || '',
      eventType: event.eventType || 'TEMPLE_FESTIVAL',
      startDate: event.startDate ? String(event.startDate).substring(0, 10) : '',
      endDate: event.endDate ? String(event.endDate).substring(0, 10) : '',
      expectedBudget: event.expectedBudget != null ? event.expectedBudget : 0,
      status: event.status || 'UPCOMING',
      location: event.location || '',
      description: event.description || ''
    };
    this.showEditModal.set(true);
  }

  submitEditEvent() {
    if (!this.editingEvent() || !this.editForm.eventName || !this.editForm.startDate) {
      this.editError = 'Event Name and Start Date are required';
      return;
    }
    this.isSavingEdit = true;
    this.editError = null;

    const body: any = {
      eventName: this.editForm.eventName.trim(),
      tamilEventName: this.editForm.tamilEventName ? this.editForm.tamilEventName.trim() : null,
      templeName: this.editForm.templeName ? this.editForm.templeName.trim() : null,
      eventType: this.editForm.eventType,
      startDate: this.editForm.startDate,
      endDate: this.editForm.endDate ? this.editForm.endDate : null,
      expectedBudget: Number(this.editForm.expectedBudget) || 0,
      status: this.editForm.status,
      location: this.editForm.location ? this.editForm.location.trim() : null,
      description: this.editForm.description ? this.editForm.description.trim() : null
    };

    this.api.put<any>('/events/' + this.editingEvent().id, body).subscribe({
      next: (res) => {
        this.isSavingEdit = false;
        if (res.success) {
          this.showEditModal.set(false);
          this.loadEvents();
        } else {
          this.editError = res.message || 'Failed to update event';
        }
      },
      error: (err) => {
        this.isSavingEdit = false;
        this.editError = err.error?.message || 'Error updating event';
      }
    });
  }

  openAddExpenseModal(event: any) {
    this.selectedEvent.set(event);
    this.expenseForm = {
      expenseCategory: 'Melam',
      amount: 1000,
      vendorName: '',
      description: '',
      paymentMode: 'CASH',
      expenseDate: new Date().toISOString().split('T')[0],
      referenceNumber: ''
    };
    this.showExpenseModal.set(true);
  }

  submitAddExpense() {
    const body = {
      eventId: this.selectedEvent().id,
      ...this.expenseForm
    };

    this.api.post<any>('/events/expense', body).subscribe({
      next: (res) => {
        if (res.success) {
          this.showExpenseModal.set(false);
          this.loadEvents();
        }
      }
    });
  }
}
