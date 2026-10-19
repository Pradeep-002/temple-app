import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ParsedMemberRow {
  rowNumber: number;
  name: string;
  mobileNumber: string;
  role: string;
  address: string;
  isValid: boolean;
  errorReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  /**
   * Generates and downloads a formatted Excel (.xlsx) template for adding members.
   */
  downloadMemberTemplateXlsx(): void {
    const wb = XLSX.utils.book_new();

    // 1. Data Sheet with headers & sample entries
    const sampleData = [
      {
        'Member Name *': 'S. Murugan / முருகன்',
        'Mobile Number *': '9876543210',
        'Role *': 'MEMBER',
        'Address / Village': 'South Street, Valavallan'
      },
      {
        'Member Name *': 'K. Ramasamy / ராமசாமி',
        'Mobile Number *': '9876543211',
        'Role *': 'COLLECTOR',
        'Address / Village': 'East Street, Valavallan'
      },
      {
        'Member Name *': 'M. Rajesh / ராஜேஷ்',
        'Mobile Number *': '9876543212',
        'Role *': 'MEMBER',
        'Address / Village': 'North Street, Valavallan'
      }
    ];

    const wsData = XLSX.utils.json_to_sheet(sampleData, {
      header: ['Member Name *', 'Mobile Number *', 'Role *', 'Address / Village']
    });

    // Column widths
    wsData['!cols'] = [
      { wch: 28 }, // Member Name
      { wch: 18 }, // Mobile Number
      { wch: 16 }, // Role
      { wch: 32 }  // Address
    ];

    XLSX.utils.book_append_sheet(wb, wsData, 'Members');

    // 2. Instructions Sheet
    const instructions = [
      { 'Field': 'Member Name *', 'Required': 'YES', 'Allowed Values': 'Text (English or Tamil)', 'Notes': 'Full name of the Sangam member.' },
      { 'Field': 'Mobile Number *', 'Required': 'YES', 'Allowed Values': '10-digit number (e.g. 9876543210)', 'Notes': 'Must be unique. Used as login username & default password.' },
      { 'Field': 'Role *', 'Required': 'OPTIONAL (Defaults to MEMBER)', 'Allowed Values': 'MEMBER, COLLECTOR, SANGAM_ADMIN', 'Notes': 'Member type. Default is MEMBER.' },
      { 'Field': 'Address / Village', 'Required': 'OPTIONAL', 'Allowed Values': 'Text (e.g. Street name, Village)', 'Notes': 'Residential or village address.' },
      { 'Field': 'Member Code', 'Required': 'DO NOT ENTER', 'Allowed Values': 'Auto-generated (e.g. SGM001)', 'Notes': 'System will automatically assign member codes.' }
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [
      { wch: 22 },
      { wch: 30 },
      { wch: 35 },
      { wch: 55 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Trigger download
    const filename = 'OorNithi_Members_Template.xlsx';
    this.saveWorkbook(wb, filename);
  }

  /**
   * Generates and downloads a CSV template for adding members.
   */
  downloadMemberTemplateCsv(): void {
    const csvContent =
      'Member Name,Mobile Number,Role,Address\n' +
      'S. Murugan / முருகன்,9876543210,MEMBER,South Street Valavallan\n' +
      'K. Ramasamy / ராமசாமி,9876543211,COLLECTOR,East Street Valavallan\n' +
      'M. Rajesh / ராஜேஷ்,9876543212,MEMBER,North Street Valavallan\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'OorNithi_Members_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exports existing members to an Excel (.xlsx) file.
   */
  exportMembersToXlsx(members: any[], sangamName?: string): void {
    const wb = XLSX.utils.book_new();

    const data = members.map((m, index) => ({
      'S.No': index + 1,
      'Member Code': m.memberCode || '—',
      'Name': m.name || '',
      'Mobile Number': m.mobileNumber || '',
      'Role': m.role || 'MEMBER',
      'Sangam': m.sangamName || sangamName || '—',
      'Address': m.address || '—',
      'Join Date': m.joinDate || '—',
      'Status': m.status || 'ACTIVE'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 25 },
      { wch: 16 },
      { wch: 16 },
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
      { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sangam Members');
    const safeSangam = (sangamName || 'Sangam').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    this.saveWorkbook(wb, `${safeSangam}_Members_${dateStr}.xlsx`);
  }

  /**
   * Reads an uploaded Excel (.xlsx, .xls) or CSV file and extracts raw row records.
   */
  async parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Normalizes and validates rows parsed from an uploaded file.
   * Compares with existing Sangam members to flag duplicate mobile numbers.
   */
  validateParsedRows(rawRows: any[], existingMembers: any[] = []): ParsedMemberRow[] {
    const existingMobiles = new Set(
      existingMembers.map(m => String(m.mobileNumber || '').trim())
    );
    const seenMobilesInFile = new Set<string>();

    const validated: ParsedMemberRow[] = [];

    rawRows.forEach((row, idx) => {
      // Find matching keys flexibly
      const nameKey = Object.keys(row).find(k => /name|பெயர்/i.test(k));
      const mobileKey = Object.keys(row).find(k => /mobile|phone|contact|அலைபேசி|cell/i.test(k));
      const roleKey = Object.keys(row).find(k => /role|பங்கு|type/i.test(k));
      const addressKey = Object.keys(row).find(k => /address|village|street|முகவரி|ஊர்/i.test(k));

      const rawName = nameKey ? String(row[nameKey]).trim() : '';
      let rawMobile = mobileKey ? String(row[mobileKey]).trim() : '';
      // Clean mobile number (strip spaces, hyphens, +91)
      rawMobile = rawMobile.replace(/\s+/g, '').replace(/^(\+91|91)/, '');

      let rawRole = roleKey ? String(row[roleKey]).trim().toUpperCase() : 'MEMBER';
      if (!rawRole || (rawRole !== 'MEMBER' && rawRole !== 'COLLECTOR' && rawRole !== 'SANGAM_ADMIN')) {
        rawRole = 'MEMBER';
      }

      const rawAddress = addressKey ? String(row[addressKey]).trim() : '';

      // Skip completely empty rows
      if (!rawName && !rawMobile && !rawAddress) {
        return;
      }

      let isValid = true;
      let errorReason = '';

      if (!rawName) {
        isValid = false;
        errorReason = 'Member Name is missing';
      } else if (!rawMobile) {
        isValid = false;
        errorReason = 'Mobile Number is missing';
      } else if (!/^\d{10}$/.test(rawMobile)) {
        isValid = false;
        errorReason = `Invalid mobile number "${rawMobile}" (must be 10 digits)`;
      } else if (seenMobilesInFile.has(rawMobile)) {
        isValid = false;
        errorReason = `Duplicate mobile number in this file (${rawMobile})`;
      } else if (existingMobiles.has(rawMobile)) {
        isValid = false;
        errorReason = `Mobile number already registered in Sangam (${rawMobile})`;
      }

      if (rawMobile && /^\d{10}$/.test(rawMobile)) {
        seenMobilesInFile.add(rawMobile);
      }

      validated.push({
        rowNumber: idx + 2, // 1-based, considering header as row 1
        name: rawName,
        mobileNumber: rawMobile,
        role: rawRole,
        address: rawAddress,
        isValid,
        errorReason
      });
    });

    return validated;
  }

  private saveWorkbook(wb: XLSX.WorkBook, filename: string): void {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
