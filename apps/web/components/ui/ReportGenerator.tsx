'use client';

import { useRef } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { useTransactions, useSummary } from '@/lib/hooks';
import { usePreferences } from '@/lib/PreferencesContext';
import { useTranslation } from '@/lib/translations';

export function ReportGenerator() {
    const { language, formatCurrency } = usePreferences();
    const { t } = useTranslation(language);
    const { data: transactions } = useTransactions();
    const { data: summary } = useSummary();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const generatePDF = () => {
        if (!transactions || !summary) return;

        const now = new Date();
        const monthName = now.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Create HTML content for PDF
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Finansal Rapor - ${monthName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; }
          h2 { color: #4a4a4a; margin-top: 30px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { 
            flex: 1; padding: 20px; border-radius: 8px; 
            background: #f9fafb; border: 1px solid #e5e7eb;
          }
          .summary-card.income { border-left: 4px solid #10B981; }
          .summary-card.expense { border-left: 4px solid #EF4444; }
          .summary-card.balance { border-left: 4px solid #8B5CF6; }
          .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
          .summary-card .value { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; }
          .income { color: #10B981; }
          .expense { color: #EF4444; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>ğŸ“Š Finansal Rapor</h1>
        <p style="color: #666;">${monthName}</p>
        
        <h2>Ã–zet</h2>
        <div class="summary">
          <div class="summary-card income">
            <h3>${language === 'tr' ? 'Toplam Gelir' : 'Total Income'}</h3>
            <div class="value income">${formatCurrency(summary.totals.income)}</div>
          </div>
          <div class="summary-card expense">
            <h3>${language === 'tr' ? 'Toplam Gider' : 'Total Expense'}</h3>
            <div class="value expense">${formatCurrency(summary.totals.expense)}</div>
          </div>
          <div class="summary-card balance">
            <h3>${language === 'tr' ? 'Net Bakiye' : 'Net Balance'}</h3>
            <div class="value">${formatCurrency(summary.totals.balance)}</div>
          </div>
        </div>
        
        <h2>${language === 'tr' ? 'Ä°ÅŸlem Listesi' : 'Transaction List'}</h2>
        <table>
          <thead>
            <tr>
              <th>${language === 'tr' ? 'Tarih' : 'Date'}</th>
              <th>${language === 'tr' ? 'AÃ§Ä±klama' : 'Description'}</th>
              <th>${language === 'tr' ? 'Kategori' : 'Category'}</th>
              <th>${language === 'tr' ? 'Tutar' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 50).map(tx => `
              <tr>
                <td>${new Date(tx.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</td>
                <td>${tx.description}</td>
                <td>${tx.categoryLabel}</td>
                <td class="${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(tx.amount))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${transactions.length > 50 ? `<p style="color: #666; font-style: italic;">... ve ${transactions.length - 50} iÅŸlem daha</p>` : ''}
        
        <div class="footer">
          <p>Bu rapor otomatik olarak oluÅŸturulmuÅŸtur.</p>
          <p>Gelir-Gider Takip UygulamasÄ± - ${now.toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

        // Open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!transactions || !summary) {
        return null;
    }

    return (
        <button
            onClick={generatePDF}
            className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted/40 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
        >
            <FileText className="w-4 h-4" />
            {language === 'tr' ? 'PDF Rapor' : 'PDF Report'}
        </button>
    );
}


