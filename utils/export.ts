import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { TenderData, BidCalculationResult, Expense } from '../types';
import { t as translate } from './i18n';
import type { Language } from '../contexts/SettingsContext';

const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    // Use a simple string format for Excel to ensure it's treated as a number
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatCurrencyWithSymbol = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount);
}


export const exportToExcel = (tender: TenderData, bidResult: BidCalculationResult, expenses: Expense[], bankPercent: string, taxPercent: string, transportCost: string, lang: Language) => {
    const t = (key: string) => translate(lang, key);
    const wb = XLSX.utils.book_new();

    // Main Info Sheet
    const mainInfo = [
        [t('export.title')],
        [],
        [t('export.tenderName'), tender.tenderName],
        [t('export.lotNumber'), tender.lotNumber],
        [t('export.brokerLabel'), tender.brokerName || ''],
        ['Tahlil sanasi', format(new Date(tender.analysisDate), 'dd.MM.yyyy')],
    ];
    const wsMain = XLSX.utils.aoa_to_sheet(mainInfo);
    XLSX.utils.book_append_sheet(wb, wsMain, 'Asosiy Ma\'lumot');

    // Products Sheet
    const productsData = tender.products.map(p => ({
        [t('export.productName')]: p.name,
        [t('export.productQuantity')]: p.quantity,
        [t('export.productMarketPrice')]: p.foundMarketPrice || 0,
        [t('export.productFinalPrice')]: p.finalBidPrice || 0,
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productsData, { cellStyles: true });
    wsProducts['!cols'] = [{ wch: 60 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Mahsulotlar');

    // Expenses Sheet
    const allExpenses = [
        { name: t('tenderDetails.bankFee'), amount: `${bankPercent}%` },
        { name: t('tenderDetails.tax'), amount: `${taxPercent}%` },
        { name: t('tenderDetails.transportCost'), amount: formatCurrency(Number(transportCost)) },
        ...expenses.map(e => ({ name: e.name, amount: e.isPercentage ? `${e.amount}%` : formatCurrency(Number(e.amount)) }))
    ];
    const expensesData = allExpenses.map(e => ({
        [t('export.expenseName')]: e.name,
        [t('export.expenseAmount')]: e.amount,
    }));
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
    wsExpenses['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Xarajatlar');

    // Results Sheet
    const resultsData = [
        [t('export.totalMarketPrice'), bidResult.totalMarketPrice],
        [t('export.totalExpenses'), bidResult.totalExpenses],
        [t('export.totalCost'), bidResult.totalCost],
        [t('export.finalBid'), bidResult.finalBidPrice],
    ];
    const wsResults = XLSX.utils.aoa_to_sheet(resultsData);
     wsResults['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResults, 'Natijalar');

    XLSX.writeFile(wb, `${tender.lotNumber || 'tender'}-tahlili.xlsx`);
};

export const exportToPdf = (tender: TenderData, bidResult: BidCalculationResult, expenses: Expense[], bankPercent: string, taxPercent: string, transportCost: string, lang: Language) => {
    const t = (key: string) => translate(lang, key);
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.text(t('export.title'), 14, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const mainInfo = [
        [t('export.tenderName'), tender.tenderName],
        [t('export.lotNumber'), tender.lotNumber],
        [t('export.brokerLabel'), tender.brokerName || ''],
    ];
    
    autoTable(doc, {
        startY: 30,
        head: [['Parametr', 'Qiymat']],
        body: mainInfo,
        theme: 'grid'
    });
    
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.text(t('export.productsTitle'), 14, 20);
    autoTable(doc, {
        startY: 30,
        head: [[t('export.productName'), t('export.productQuantity'), t('export.productMarketPrice'), t('export.productFinalPrice')]],
        body: tender.products.map(p => [
            p.name,
            p.quantity,
            formatCurrencyWithSymbol(p.foundMarketPrice),
            formatCurrencyWithSymbol(p.finalBidPrice)
        ]),
        theme: 'grid'
    });

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.text(t('export.expensesTitle'), 14, 20);
    const allExpenses = [
        { name: t('tenderDetails.bankFee'), amount: `${bankPercent}%` },
        { name: t('tenderDetails.tax'), amount: `${taxPercent}%` },
        { name: t('tenderDetails.transportCost'), amount: formatCurrencyWithSymbol(Number(transportCost)) },
        ...expenses.map(e => ({ name: e.name, amount: e.isPercentage ? `${e.amount}%` : formatCurrencyWithSymbol(Number(e.amount)) }))
    ];
    autoTable(doc, {
        startY: 30,
        head: [[t('export.expenseName'), t('export.expenseAmount')]],
        body: allExpenses.map(e => [e.name, e.amount]),
        theme: 'grid'
    });

    doc.setFont('helvetica', 'bold');
    doc.text(t('export.resultsTitle'), 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        body: [
            [t('export.totalMarketPrice'), formatCurrencyWithSymbol(bidResult.totalMarketPrice)],
            [t('export.totalExpenses'), formatCurrencyWithSymbol(bidResult.totalExpenses)],
            [t('export.totalCost'), formatCurrencyWithSymbol(bidResult.totalCost)],
            [{ content: t('export.finalBid'), styles: { fontStyle: 'bold' } }, { content: formatCurrencyWithSymbol(bidResult.finalBidPrice), styles: { fontStyle: 'bold' } }],
        ],
        theme: 'striped'
    });


    doc.save(`${tender.lotNumber || 'tender'}-tahlili.pdf`);
};

export const exportToWord = (tender: TenderData, bidResult: BidCalculationResult, expenses: Expense[], bankPercent: string, taxPercent: string, transportCost: string, lang: Language) => {
    const t = (key: string) => translate(lang, key);

    const html = `
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${t('export.title')}</h1>
                <p><strong>${t('export.tenderName')}:</strong> ${tender.tenderName}</p>
                <p><strong>${t('export.lotNumber')}:</strong> ${tender.lotNumber}</p>
                <hr/>
                <h3>${t('export.productsTitle')}</h3>
                <table>
                    <thead><tr>
                        <th>${t('export.productName')}</th>
                        <th>${t('export.productQuantity')}</th>
                        <th>${t('export.productFinalPrice')}</th>
                    </tr></thead>
                    <tbody>
                        ${tender.products.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td>${p.quantity}</td>
                                <td>${formatCurrencyWithSymbol(p.finalBidPrice)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <h3>${t('export.resultsTitle')}</h3>
                <table style="width:50%;">
                    <tbody>
                        <tr><td>${t('export.totalMarketPrice')}</td><td>${formatCurrencyWithSymbol(bidResult.totalMarketPrice)}</td></tr>
                        <tr><td>${t('export.totalExpenses')}</td><td>${formatCurrencyWithSymbol(bidResult.totalExpenses)}</td></tr>
                        <tr><td><strong>${t('export.finalBid')}</strong></td><td><strong>${formatCurrencyWithSymbol(bidResult.finalBidPrice)}</strong></td></tr>
                    </tbody>
                </table>
            </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const filename = `${tender.lotNumber || 'tender'}-tahlili.doc`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};