import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ i1n.t('expenses') }} Management</h1>
          <p class="text-xs text-slate-500">Record General Maintenance & Operational Sangam Expenses</p>
        </div>

        <button *ngIf="api.currentUser()?.role !== 'MEMBER'" (click)="openModal()" class="btn-gold text-xs font-bold">+ Record General Expense</button>
      </div>

      <div class="glass-card p-6 shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="theme-table-header">
                <th class="p-3 rounded-l-lg">CATEGORY</th>
                <th class="p-3">DESCRIPTION</th>
                <th class="p-3">PAID TO</th>
                <th class="p-3 text-right">AMOUNT</th>
                <th class="p-3">MODE</th>
                <th class="p-3 rounded-r-lg">DATE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ex of expenses()" class="border-b hover:bg-slate-50 transition">
                <td class="p-3 font-bold text-slate-800">{{ ex.expenseCategory }}</td>
                <td class="p-3 text-slate-600 font-medium">{{ ex.description }}</td>
                <td class="p-3 text-slate-700">{{ ex.paidTo || '-' }}</td>
                <td class="p-3 text-right font-extrabold text-red-600">₹{{ ex.amount | number:'1.0-0' }}</td>
                <td class="p-3"><span class="bg-slate-100 font-bold px-2 py-0.5 rounded text-[10px]">{{ ex.paymentMode }}</span></td>
                <td class="p-3 text-slate-400">{{ ex.expenseDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div *ngIf="showModal()" class="modal-overlay">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 class="text-lg font-bold text-slate-900">Record General Expense / செலவு பதிவு</h3>
          <button (click)="showModal.set(false)" class="text-slate-400 font-bold">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1">Expense Category *</label>
            <select [(ngModel)]="form.expenseCategory" class="w-full p-2.5 border rounded-lg text-sm">
              <option value="Maintenance">Maintenance / பராமரிப்பு</option>
              <option value="Transport">Transport / போக்குவரத்து</option>
              <option value="Food">Food / உணவு</option>
              <option value="Office">Office / அலுவலகம்</option>
              <option value="Temple">Temple / கோவில்</option>
              <option value="Utilities">Utilities / மின்சாரம், நீர்</option>
              <option value="Other">Other / பிற</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Description *</label>
            <input type="text" [(ngModel)]="form.description" placeholder="Description of expense" class="w-full p-2.5 border rounded-lg text-sm">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Amount (₹) *</label>
            <input type="number" [(ngModel)]="form.amount" placeholder="500" class="w-full p-2.5 border rounded-lg text-sm font-bold">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Paid To</label>
            <input type="text" [(ngModel)]="form.paidTo" placeholder="Vendor / Person name" class="w-full p-2.5 border rounded-lg text-sm">
          </div>

          <button (click)="submitExpense()" class="btn-gold w-full mt-2">Record Expense & Update Ledger →</button>
        </div>
      </div>
    </div>
  `
})
export class ExpensesComponent implements OnInit {
  expenses = signal<any[]>([]);
  showModal = signal(false);

  form = {
    expenseCategory: 'Maintenance',
    description: '',
    amount: 500,
    paidTo: '',
    paymentMode: 'CASH'
  };

  constructor(public i1n: I1nService, public api: ApiService) {}

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.api.get<any>('/expenses').subscribe({
      next: (res) => {
        if (res.success) {
          this.expenses.set(res.data);
        }
      }
    });
  }

  openModal() {
    if (this.api.currentUser()?.role === 'MEMBER') return;
    this.showModal.set(true);
  }

  submitExpense() {
    this.api.post<any>('/expenses', this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.showModal.set(false);
          this.loadExpenses();
        }
      }
    });
  }
}
