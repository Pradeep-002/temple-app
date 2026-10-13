import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  receiptNumber: string;
  sangamName: string;
  sangamAddress?: string;
  sangamMobile?: string;
  memberName: string;
  memberCode: string;
  monthName: string;
  year: number | string;
  amountPaid: number;
  paymentMode: string;
  paymentDate?: string | Date;
  referenceNumber?: string;
  collectedBy?: string;
  slogan?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptPdfService {

  /**
   * Generates and downloads an authentic, beautifully styled Temple/Sangam PDF receipt.
   */
  async downloadReceiptPdf(data: ReceiptData): Promise<void> {
    const element = this.createReceiptDomElement(data);
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();   // 148 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

      // 8mm margins on left & right
      const marginX = 8;
      const printWidth = pageWidth - (marginX * 2); // 132 mm
      const printHeight = (canvas.height * printWidth) / canvas.width;

      // Center vertically on A5 page
      let posY = marginX;
      if (printHeight < pageHeight - (marginX * 2)) {
        posY = (pageHeight - printHeight) / 2;
      }

      pdf.addImage(imgData, 'PNG', marginX, posY, printWidth, printHeight);

      const safeMemberCode = (data.memberCode || 'MEMBER').replace(/[^a-zA-Z0-9]/g, '_');
      const safePeriod = `${data.monthName}_${data.year}`.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Receipt_${safeMemberCode}_${safePeriod}.pdf`;

      pdf.save(filename);
    } finally {
      document.body.removeChild(element);
    }
  }

  /**
   * Opens the print dialog for this receipt.
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    const element = this.createReceiptDomElement(data);
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${data.receiptNumber}</title>
              <style>
                @page { size: A5 portrait; margin: 10mm; }
                body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
                img { max-width: 100%; height: auto; display: block; }
                @media print {
                  body { padding: 0; min-height: auto; }
                  img { width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } finally {
      document.body.removeChild(element);
    }
  }

  /**
   * Builds the HTML element representation of the receipt for rasterization.
   * Proper padding, generous element spacing, and clean signature layout.
   */
  private createReceiptDomElement(data: ReceiptData): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '540px';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = "'Noto Sans Tamil', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    container.style.boxSizing = 'border-box';

    // Format payment date
    let formattedDate = '';
    if (data.paymentDate) {
      try {
        const d = new Date(data.paymentDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } else {
          formattedDate = String(data.paymentDate);
        }
      } catch {
        formattedDate = String(data.paymentDate);
      }
    } else {
      formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    const sangamTitle = data.sangamName || 'பெருந்தலைவர் நற்பணி மன்றம்';
    const slogan = data.slogan || '🕉️ ஸ்ரீ முத்தாரம்மன் துணை 🕉️';
    const amountInWords = this.numberToWords(data.amountPaid);

    container.innerHTML = `
      <div style="border: 2.5px double #ea580c; border-radius: 12px; padding: 22px 24px; background: #fffdf9; box-sizing: border-box;">
        <!-- Top Auspicious Invocation -->
        <div style="text-align: center; margin-bottom: 6px;">
          <span style="font-size: 13px; color: #ea580c; font-weight: 700; letter-spacing: 2px;">
            ${slogan}
          </span>
        </div>

        <!-- Sangam Name Header -->
        <div style="text-align: center; padding-bottom: 4px;">
          <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #9a3412; line-height: 1.3;">
            ${sangamTitle}
          </h1>
          ${data.sangamAddress ? `
            <p style="margin: 3px 0 0; font-size: 11px; color: #64748b; font-weight: 500;">
              📍 ${data.sangamAddress}
            </p>
          ` : ''}
          ${data.sangamMobile ? `
            <p style="margin: 2px 0 0; font-size: 11px; color: #64748b; font-weight: 500;">
              📞 அலைபேசி: ${data.sangamMobile}
            </p>
          ` : ''}
        </div>

        <!-- Title (No background color, themed text color) -->
        <div style="text-align: center; margin: 8px 0 10px;">
          <span style="display: inline-block; color: #ea580c; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;">
            மாதாந்திர சந்தா ரசீது • COLLECTION RECEIPT
          </span>
        </div>

        <!-- Divider Line -->
        <div style="border-bottom: 1.5px solid #fed7aa; margin-bottom: 14px;"></div>

        <!-- Receipt Meta Information (2 columns with generous padding) -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 14px; background: #fff7ed; padding: 8px 14px; border-radius: 8px; border: 1px solid #fed7aa;">
          <div>
            <span style="color: #64748b; font-size: 10px; font-weight: 600;">ரசீது எண் / RECEIPT NO: </span>
            <span style="font-weight: 800; font-family: monospace; color: #9a3412; font-size: 12px; margin-left: 4px;">${data.receiptNumber || 'REC-' + Date.now()}</span>
          </div>
          <div style="text-align: right;">
            <span style="color: #64748b; font-size: 10px; font-weight: 600;">வசூல் தேதி / DATE: </span>
            <span style="font-weight: 700; color: #1e293b; margin-left: 4px;">${formattedDate}</span>
          </div>
        </div>

        <!-- Details Grid / Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 14px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 6px; color: #64748b; font-weight: 600; width: 44%;">உறுப்பினர் பெயர் (Member Name)</td>
              <td style="padding: 6px 6px; font-weight: 800; color: #0f172a; font-size: 12.5px;">${data.memberName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 6px; color: #64748b; font-weight: 600;">உறுப்பினர் எண் (Member Code)</td>
              <td style="padding: 6px 6px; font-weight: 700; font-family: monospace; color: #047857;">${data.memberCode || '—'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 6px; color: #64748b; font-weight: 600;">வசூல் மாதம் (Period)</td>
              <td style="padding: 6px 6px; font-weight: 800; color: #ea580c;">${data.monthName} ${data.year}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 6px; color: #64748b; font-weight: 600;">செலுத்தும் முறை (Payment Mode)</td>
              <td style="padding: 6px 6px; font-weight: 700; color: #1e293b;">${data.paymentMode || 'CASH'}</td>
            </tr>
            ${data.referenceNumber ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 6px; color: #64748b; font-weight: 600;">குறிப்பு எண் (Ref / Remarks)</td>
                <td style="padding: 6px 6px; font-weight: 600; color: #475569;">${data.referenceNumber}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 6px 6px; color: #64748b; font-weight: 600;">வசூலித்தவர் (Collected By)</td>
              <td style="padding: 6px 6px; font-weight: 600; color: #475569;">${data.collectedBy || 'Sangam Admin'}</td>
            </tr>
          </tbody>
        </table>

        <!-- Prominent Amount Box -->
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 12px 16px; margin-bottom: 18px; text-align: center;">
          <div style="font-size: 10px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px;">
            வசூலான தொகை / AMOUNT PAID
          </div>
          <div style="font-size: 24px; font-weight: 900; color: #14532d; margin: 3px 0;">
            ₹ ${Number(data.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style="font-size: 10.5px; font-weight: 600; color: #15803d; font-style: italic;">
            (${amountInWords})
          </div>
        </div>

        <!-- Footer Signatures (Clean 3-column layout without overlapping lines) -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px; margin-bottom: 14px;">
          <!-- Member Signature -->
          <div style="text-align: center; width: 36%;">
            <div style="height: 28px;"></div>
            <div style="border-top: 1.5px dashed #94a3b8; padding-top: 6px;">
              <div style="font-size: 10.5px; font-weight: 700; color: #475569;">உறுப்பினர் கையொப்பம்</div>
              <div style="font-size: 9px; color: #94a3b8;">(Member Signature)</div>
            </div>
          </div>

          <!-- Center Paid Stamp -->
          <div style="text-align: center; width: 26%; padding-bottom: 4px;">
            <div style="display: inline-block; border: 1.5px solid #059669; background: #ecfdf5; color: #047857; font-size: 10px; font-weight: 800; border-radius: 8px; padding: 5px 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              ✓ PAID<br>
              <span style="font-size: 9px; font-weight: 700;">பெறப்பட்டது</span>
            </div>
          </div>

          <!-- Authorized Signatory -->
          <div style="text-align: center; width: 36%;">
            <div style="height: 28px;"></div>
            <div style="border-top: 1.5px dashed #94a3b8; padding-top: 6px;">
              <div style="font-size: 10.5px; font-weight: 700; color: #475569;">நிர்வாகி / முகவர் கையொப்பம்</div>
              <div style="font-size: 9px; color: #94a3b8;">(Authorized Signatory)</div>
            </div>
          </div>
        </div>

        <!-- Disclaimer with ample bottom margin -->
        <div style="text-align: center; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 8px;">
          இது கணினி மூலம் உருவாக்கப்பட்ட அதிகாரப்பூர்வ ரசீது • Powered by Oor Nithi
        </div>
      </div>
    `;

    return container;
  }

  private numberToWords(amount: number): string {
    const num = Math.floor(amount);
    if (num === 0) return 'Rupees Zero Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertChunk = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    };

    let result = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    if (crore > 0) result += convertChunk(crore) + ' Crore ';
    if (lakh > 0) result += convertChunk(lakh) + ' Lakh ';
    if (thousand > 0) result += convertChunk(thousand) + ' Thousand ';
    if (remainder > 0) result += convertChunk(remainder);

    return `Rupees ${result.trim()} Only`;
  }
}
