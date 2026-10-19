import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ i1n.t('ledger') }} • Immutable Double-Entry Audit</h1>
          <p class="text-xs text-slate-500">Every rupee in and out is verified and recorded here as the single source of financial truth.</p>
        </div>

        <div class="glass-card px-4 py-2 border-orange-500/50 border">
          <span class="text-xs text-slate-500 font-bold block">CURRENT BALANCE</span>
          <span class="text-xl font-extrabold text-slate-900">₹{{ currentBalance() | number:'1.2-2' }}</span>
        </div>
      </div>

      <div class="glass-card p-6 shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="theme-table-header">
                <th class="p-3 rounded-l-lg">DATE & TIME</th>
                <th class="p-3">TRANSACTION TYPE</th>
                <th class="p-3">DESCRIPTION</th>
                <th class="p-3 text-right text-emerald-300">CREDIT (+)</th>
                <th class="p-3 text-right text-red-300">DEBIT (-)</th>
                <th class="p-3 text-right text-amber-300 font-bold">BALANCE AFTER</th>
                <th class="p-3 rounded-r-lg">RECORDED BY</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of transactions()" class="border-b hover:bg-slate-50 transition">
                <td class="p-3 text-slate-500">{{ txn.transactionDate | date:'medium' }}</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded font-bold text-[10px]"
                        [class.bg-emerald-100]="txn.creditAmount > 0"
                        [class.text-emerald-800]="txn.creditAmount > 0"
                        [class.bg-red-100]="txn.debitAmount > 0"
                        [class.text-red-800]="txn.debitAmount > 0">
                    {{ txn.transactionType }}
                  </span>
                </td>
                <td class="p-3 font-medium text-slate-800">{{ txn.description }}</td>
                <td class="p-3 text-right font-bold text-emerald-700">
                  {{ txn.creditAmount > 0 ? '+₹' + (txn.creditAmount | number:'1.0-0') : '-' }}
                </td>
                <td class="p-3 text-right font-bold text-red-600">
                  {{ txn.debitAmount > 0 ? '-₹' + (txn.debitAmount | number:'1.0-0') : '-' }}
                </td>
                <td class="p-3 text-right font-extrabold text-blue-900 bg-slate-50">
                  ₹{{ txn.balanceAfter | number:'1.2-2' }}
                </td>
                <td class="p-3 text-slate-500">{{ txn.createdBy || 'System' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class LedgerComponent implements OnInit {
  transactions = signal<any[]>([]);
  currentBalance = signal<number>(0);

  constructor(public i1n: I1nService, private api: ApiService) {}

  ngOnInit() {
    this.loadLedger();
  }

  loadLedger() {
    this.api.get<any>('/ledger').subscribe({
      next: (res) => {
        if (res.success) {
          this.transactions.set(res.data);
        }
      }
    });

    this.api.get<any>('/ledger/balance').subscribe({
      next: (res) => {
        if (res.success) {
          this.currentBalance.set(res.data);
        }
      }
    });
  }
}
