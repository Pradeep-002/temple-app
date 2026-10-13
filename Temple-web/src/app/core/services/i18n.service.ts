import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'ta';

@Injectable({
  providedIn: 'root'
})
export class I1nService {
  currentLang = signal<Language>('en');

  private translations: Record<Language, Record<string, string>> = {
    en: {
      appName: 'Oor Nithi',
      tamilAppName: 'ஊர் நிதி',
      tagline: 'Sangam Collection & Community Finance Management',
      heroTitle: 'Manage Your Sangam. Track Every Rupee.',
      heroSub: 'Manage Sangam members, monthly collections, temple festivals, donations, expenses and financial reports in one place.',
      registerSangamBtn: 'Register Your Sangam',
      loginBtn: 'Login',
      dashboard: 'Dashboard',
      members: 'Members',
      collections: 'Monthly Collections',
      agents: 'Collection Agents',
      events: 'Temple & Sangam Events',
      donations: 'Donations',
      expenses: 'Expenses',
      ledger: 'Financial Ledger',
      reports: 'Reports',
      pricing: 'Pricing & Plans',
      support: 'Support & Help',
      totalMembers: 'Total Members',
      thisMonthCollection: 'This Month Collection',
      pendingAmount: 'Pending Amount',
      totalDonations: 'Total Donations',
      totalExpenses: 'Total Expenses',
      availableBalance: 'Available Balance',
      memberCode: 'Member Code',
      memberName: 'Member Name',
      mobileNumber: 'Mobile Number',
      status: 'Status',
      paid: 'PAID',
      pending: 'PENDING',
      partial: 'PARTIAL',
      collectPayment: 'Collect Payment',
      amount: 'Amount',
      paymentMode: 'Payment Mode',
      cash: 'Cash',
      upi: 'UPI / Online',
      bankTransfer: 'Bank Transfer',
      receiptNo: 'Receipt No',
      date: 'Date',
      save: 'Save',
      cancel: 'Cancel',
      language: 'Language / மொழி'
    },
    ta: {
      appName: 'ஊர் நிதி',
      tamilAppName: 'ஊர் நிதி',
      tagline: 'சங்க வசூல் மற்றும் சமுதாய நிதி நிர்வாகம்',
      heroTitle: 'உங்கள் சங்கத்தை நிர்வகிக்கவும். ஒவ்வொரு ரூபாயையும் கண்காணிக்கவும்.',
      heroSub: 'சங்க உறுப்பினர்கள், மாதாந்திர வசூல், கோவில் திருவிழாக்கள், நன்கொடைகள், செலவுகள் மற்றும் நிதி அறிக்கைகளை ஒரே இடத்தில் நிர்வகிக்கவும்.',
      registerSangamBtn: 'உங்கள் சங்கத்தை பதிவு செய்க',
      loginBtn: 'உள்நுழைக',
      dashboard: 'டாஷ்போர்டு',
      members: 'உறுப்பினர்கள்',
      collections: 'மாதாந்திர வசூல்',
      agents: 'வசூல் முகவர்கள்',
      events: 'திருவிழாக்கள் & நிகழ்வுகள்',
      donations: 'நன்கொடை',
      expenses: 'செலவுகள்',
      ledger: 'நிதி பேரேடு (Ledger)',
      reports: 'அறிக்கைகள்',
      pricing: 'கட்டண திட்டங்கள்',
      support: 'உதவி & ஆதரவு',
      totalMembers: 'மொத்த உறுப்பினர்கள்',
      thisMonthCollection: 'இந்த மாத வசூல்',
      pendingAmount: 'நிலுவை தொகை',
      totalDonations: 'மொத்த நன்கொடை',
      totalExpenses: 'மொத்த செலவு',
      availableBalance: 'இருப்பு தொகை',
      memberCode: 'உறுப்பினர் குறியீடு',
      memberName: 'உறுப்பினர் பெயர்',
      mobileNumber: 'அலைபேசி எண்',
      status: 'நிலை',
      paid: 'செலுத்தப்பட்டது',
      pending: 'நிலுவை',
      partial: 'பகுதி செலுத்தியது',
      collectPayment: 'பணம் வசூலிக்க',
      amount: 'தொகை',
      paymentMode: 'செலுத்தும் முறை',
      cash: 'ரொக்கம் (Cash)',
      upi: 'UPI / ஆன்லைன்',
      bankTransfer: 'வங்கி பரிமாற்றம்',
      receiptNo: 'ரசீது எண்',
      date: 'தேதி',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      language: 'Language / மொழி'
    }
  };

  constructor() {
    const saved = localStorage.getItem('oor_nithi_lang') as Language;
    if (saved) {
      this.currentLang.set(saved);
    }
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem('oor_nithi_lang', lang);
  }

  t(key: string): string {
    const lang = this.currentLang();
    return this.translations[lang]?.[key] || this.translations['en']?.[key] || key;
  }
}
