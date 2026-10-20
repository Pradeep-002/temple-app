import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface ReceiptData {
  receiptNumber: string;
  sangamName: string;
  slogan?: string;
  sangamSlogan?: string;
  sangamAddress?: string;
  sangamMobile?: string;
  memberName: string;
  memberCode?: string;
  monthName?: string;
  year?: number;
  amountPaid: number;
  expectedAmount?: number;
  paymentMode: string;
  paymentDate?: string | Date | null;
  collectedBy?: string;
  referenceNumber?: string;
  purpose?: string;
}

export const buildReceiptHtml = (receipt: ReceiptData, fallbackSlogan?: string, fallbackSangam?: string): string => {
  const sloganText = (
    receipt.sangamSlogan ||
    receipt.slogan ||
    fallbackSlogan ||
    '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️'
  ).trim();

  const sangamNameText = (
    receipt.sangamName ||
    fallbackSangam ||
    'Oor Nithi Sangam'
  ).trim();

  const sangamAddressText = (receipt.sangamAddress || '').trim();
  const sangamMobileText = (receipt.sangamMobile || '').trim();

  const paymentDateStr = receipt.paymentDate
    ? new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN');

  const periodStr = receipt.monthName && receipt.year
    ? `${receipt.monthName} ${receipt.year}`
    : (receipt.purpose || 'General Contribution');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${receipt.receiptNumber || 'Payment'}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .receipt-container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #d4af37;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .header-banner {
      background: linear-gradient(135deg, #0b3c2d 0%, #166534 100%);
      color: #ffffff;
      padding: 24px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .slogan {
      font-size: 13px;
      color: #fde047;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      text-align: center;
      width: 100%;
    }
    .sangam-name {
      font-size: 22px;
      font-weight: 900;
      margin: 0;
      letter-spacing: 0.5px;
      text-align: center;
      width: 100%;
    }
    .sangam-address {
      font-size: 11px;
      color: #e2e8f0;
      margin-top: 6px;
      line-height: 1.4;
      text-align: center;
      width: 100%;
    }
    .title-ribbon {
      background: #fef3c7;
      border-bottom: 1.5px dashed #d4af37;
      padding: 8px 12px;
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      color: #b45309;
      letter-spacing: 1px;
    }
    .content-body {
      padding: 24px;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 800;
      color: #0b3c2d;
      margin-top: 2px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .info-table tr td {
      padding: 9px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .col-label {
      color: #64748b;
      font-weight: 500;
      width: 45%;
    }
    .col-val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }
    .amount-highlight {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .amount-label {
      font-size: 11px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-num {
      font-size: 26px;
      font-weight: 900;
      color: #14532d;
      margin-top: 4px;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      margin-top: 10px;
    }
    .sig-box {
      width: 42%;
      text-align: center;
    }
    .sig-line {
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .paid-stamp {
      border: 2px solid #16a34a;
      color: #16a34a;
      font-weight: 900;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
      letter-spacing: 1px;
      transform: rotate(-5deg);
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header-banner">
      <div class="slogan">${sloganText}</div>
      <h1 class="sangam-name">${sangamNameText}</h1>
      ${sangamAddressText ? `<div class="sangam-address">${sangamAddressText} ${sangamMobileText ? ' • Ph: ' + sangamMobileText : ''}</div>` : ''}
    </div>

    <div class="title-ribbon">
      OFFICIAL PAYMENT RECEIPT / அதிகாரப்பூர்வ ரசீது
    </div>

    <div class="content-body">
      <div class="meta-box">
        <div class="meta-item">
          <span class="meta-label">Receipt Number</span>
          <span class="meta-val">${receipt.receiptNumber || '—'}</span>
        </div>
        <div class="meta-item" style="text-align: right;">
          <span class="meta-label">Payment Date</span>
          <span class="meta-val">${paymentDateStr}</span>
        </div>
      </div>

      <table class="info-table">
        <tr>
          <td class="col-label">Member Name / பெயர்</td>
          <td class="col-val">${receipt.memberName}</td>
        </tr>
        ${receipt.memberCode ? `<tr><td class="col-label">Member ID / உறுப்பினர் எண்</td><td class="col-val">${receipt.memberCode}</td></tr>` : ''}
        <tr>
          <td class="col-label">Contribution / விவரம்</td>
          <td class="col-val">${periodStr}</td>
        </tr>
        <tr>
          <td class="col-label">Payment Mode / செலுத்திய முறை</td>
          <td class="col-val">${receipt.paymentMode || 'CASH'}</td>
        </tr>
        ${receipt.referenceNumber ? `<tr><td class="col-label">Reference No / குறிப்பு எண்</td><td class="col-val">${receipt.referenceNumber}</td></tr>` : ''}
        <tr>
          <td class="col-label">Collected By / வசூலித்தவர்</td>
          <td class="col-val">${receipt.collectedBy || 'Admin'}</td>
        </tr>
      </table>

      <div class="amount-highlight">
        <div class="amount-label">AMOUNT PAID / வசூலான தொகை</div>
        <div class="amount-num">₹${Number(receipt.amountPaid).toFixed(2)}</div>
      </div>

      <div class="signatures-row">
        <div class="sig-box">
          <div style="height: 30px;"></div>
          <div class="sig-line">உறுப்பினர் கையொப்பம்</div>
        </div>
        <div style="text-align: center;">
          <span class="paid-stamp">✓ PAID</span>
        </div>
        <div class="sig-box">
          <div style="height: 30px;"></div>
          <div class="sig-line">நிர்வாகி கையொப்பம்</div>
        </div>
      </div>

      <div class="footer-note">
        இது கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது • Powered by Oor Nithi
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const printOrShareReceipt = async (receipt: ReceiptData, action: 'print' | 'share' | 'download' = 'share') => {
  try {
    const html = buildReceiptHtml(receipt);

    // On Web, Print.printToFileAsync is not supported; Print.printAsync opens the browser's print/PDF dialog
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    if (action === 'print') {
      await Print.printAsync({ html });
      return;
    }

    if (action === 'download') {
      if (Platform.OS === 'android') {
        // On Android, Print.printAsync activates the native Android Print Spooler with "Save as PDF"
        // allowing direct saving to phone Downloads / Internal Storage without requiring external apps
        await Print.printAsync({ html });
      } else {
        // On iOS, Sharing.shareAsync opens the native Activity sheet with "Save to Files"
        try {
          const { uri } = await Print.printToFileAsync({ html });
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Receipt_${receipt.receiptNumber || 'Payment'}.pdf`,
              UTI: 'com.adobe.pdf'
            });
          } else {
            await Print.printAsync({ html });
          }
        } catch {
          await Print.printAsync({ html });
        }
      }
      return;
    }

    // action === 'share'
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Receipt ${receipt.receiptNumber || ''}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      // If sharing fails on this device, fall back to native print/save as PDF
      await Print.printAsync({ html });
    }
  } catch (error: any) {
    Alert.alert('Error', error?.message || 'Failed to generate PDF');
  }
};
