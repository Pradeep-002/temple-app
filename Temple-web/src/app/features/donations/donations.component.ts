import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { I1nService } from '../../core/services/i18n.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../layout/navbar.component';

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="app-content-container p-6 sm:p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">{{ i1n.t('donations') }} Management</h1>
          <p class="text-xs text-slate-500">Track Special & General Donations with Auto Receipt Generation</p>
        </div>

        <button *ngIf="api.currentUser()?.role !== 'MEMBER'" (click)="openDonationModal()" class="btn-gold text-xs font-bold">+ Record New Donation</button>
      </div>

      <div class="glass-card p-6 shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="theme-table-header">
                <th class="p-3 rounded-l-lg">RECEIPT NO</th>
                <th class="p-3">DONOR NAME</th>
                <th class="p-3">PURPOSE</th>
                <th class="p-3 text-right">AMOUNT</th>
                <th class="p-3">MODE</th>
                <th class="p-3 rounded-r-lg">DATE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of donations()" class="border-b hover:bg-slate-50 transition">
                <td class="p-3 font-mono font-bold text-amber-700">{{ d.receiptNumber }}</td>
                <td class="p-3 font-bold text-slate-800">{{ d.donorName }}</td>
                <td class="p-3 text-slate-600 font-medium">{{ d.donationPurpose }}</td>
                <td class="p-3 text-right font-extrabold text-emerald-700">₹{{ d.amount | number:'1.0-0' }}</td>
                <td class="p-3"><span class="bg-slate-100 font-bold px-2 py-0.5 rounded text-[10px]">{{ d.paymentMode }}</span></td>
                <td class="p-3 text-slate-400">{{ d.donationDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- RECORD DONATION MODAL -->
    <div *ngIf="showModal()" class="modal-overlay">
      <div class="modal-content">
        <div class="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 class="text-lg font-bold text-slate-900">Record New Donation / நன்கொடை பதிவு</h3>
          <button (click)="showModal.set(false)" class="text-slate-400 font-bold">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1">Donor Name *</label>
            <input type="text" [(ngModel)]="form.donorName" placeholder="Donor Name" class="w-full p-2.5 border rounded-lg text-sm">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Donation Purpose *</label>
            <input type="text" [(ngModel)]="form.donationPurpose" placeholder="e.g. Annadhanam, Temple Maintenance, Melam" class="w-full p-2.5 border rounded-lg text-sm">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Amount (₹) *</label>
            <input type="number" [(ngModel)]="form.amount" placeholder="1000" class="w-full p-2.5 border rounded-lg text-sm font-bold">
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">Payment Mode</label>
            <select [(ngModel)]="form.paymentMode" class="w-full p-2.5 border rounded-lg text-sm">
              <option value="CASH">Cash / ரொக்கம்</option>
              <option value="UPI">UPI / Online</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <button (click)="submitDonation()" class="btn-gold w-full mt-2">Record Donation & Generate Receipt →</button>
        </div>
      </div>
    </div>
  `
})
export class DonationsComponent implements OnInit {
  donations = signal<any[]>([]);
  showModal = signal(false);

  form = {
    donorName: '',
    donationPurpose: 'Annadhanam',
    amount: 1000,
    paymentMode: 'CASH'
  };

  constructor(public i1n: I1nService, public api: ApiService) {}

  ngOnInit() {
    this.loadDonations();
  }

  loadDonations() {
    this.api.get<any>('/donations').subscribe({
      next: (res) => {
        if (res.success) {
          this.donations.set(res.data);
        }
      }
    });
  }

  openDonationModal() {
    if (this.api.currentUser()?.role === 'MEMBER') return;
    this.showModal.set(true);
  }

  submitDonation() {
    this.api.post<any>('/donations', this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.showModal.set(false);
          this.loadDonations();
        }
      }
    });
  }
}
