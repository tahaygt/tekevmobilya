
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod } from '../types';
import { Printer, Download, Calendar, Edit3, Check, FileText, FileSpreadsheet, Filter, Box, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface DailyReportProps {
  transactions: Transaction[];
  customers: Customer[];
}

// Helper to get day invoices
const getDailyInvoices = (transactions: Transaction[], date: string) => {
    return transactions.filter(t => t.date === date && (t.type === 'sales' || t.type === 'purchase'));
};

const getTrType = (type: string, hasItems: boolean) => {
    if (hasItems) return type === 'sales' ? 'Satış Faturası' : 'Alış Faturası';
    switch(type) {
        case 'cash_in': return 'Tahsilat';
        case 'cash_out': return 'Ödeme';
        default: return type;
    }
};

export const DailyReport: React.FC<DailyReportProps> = ({ transactions, customers }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);
  
  // -- DATA PROCESSING --
  const activeTransactions = useMemo(() => {
      let filtered = transactions;

      // Date Filter
      if (activeTab === 'daily') {
          filtered = filtered.filter(t => t.date === selectedDate);
      } else {
          filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
      }

      // Type Filter
      if (filterType !== 'all') {
          filtered = filtered.filter(t => t.type === filterType);
      }

      return filtered;
  }, [transactions, activeTab, selectedDate, selectedMonth, filterType]);
  
  // Group by Customer for main table
  const distinctCustIds = Array.from(new Set(activeTransactions.map(t => t.accId))).filter(Boolean) as number[];
  
  // Calculate Summaries
  const calculateMethodTotal = (list: Transaction[], type: 'in' | 'out', method: PaymentMethod) => {
    const direction = type === 'in' ? 'cash_in' : 'cash_out';
    return list
      .filter(t => t.type === direction && t.method === method)
      .reduce((acc, t) => acc + (t.currency === 'TL' ? t.total : 0), 0);
  };

  const stats = {
      in: {
          nakit: calculateMethodTotal(activeTransactions, 'in', 'nakit'),
          havale: calculateMethodTotal(activeTransactions, 'in', 'havale'),
          cek: calculateMethodTotal(activeTransactions, 'in', 'cek'),
          kredi_karti: calculateMethodTotal(activeTransactions, 'in', 'kredi_karti'),
          virman: calculateMethodTotal(activeTransactions, 'in', 'virman'),
      },
      out: {
          nakit: calculateMethodTotal(activeTransactions, 'out', 'nakit'),
          havale: calculateMethodTotal(activeTransactions, 'out', 'havale'),
          cek: calculateMethodTotal(activeTransactions, 'out', 'cek'),
          kredi_karti: calculateMethodTotal(activeTransactions, 'out', 'kredi_karti'),
          virman: calculateMethodTotal(activeTransactions, 'out', 'virman'),
      }
  };

  const invoices = activeTab === 'daily' ? getDailyInvoices(transactions, selectedDate) : [];

  // Monthly Product Sales Count Logic
  const productSalesSummary = useMemo(() => {
      if (activeTab !== 'monthly') return [];
      
      const sales = activeTransactions.filter(t => t.type === 'sales' && t.items);
      const productCounts: Record<string, number> = {};

      sales.forEach(sale => {
          sale.items?.forEach(item => {
              if (productCounts[item.name]) {
                  productCounts[item.name] += item.qty;
              } else {
                  productCounts[item.name] = item.qty;
              }
          });
      });

      return Object.entries(productCounts).sort((a, b) => b[1] - a[1]); // Sort by count desc
  }, [activeTransactions, activeTab]);


  // -- FORMATTERS --
  const formatDate = (d: string) => d.split('-').reverse().join('.');
  const formatMoney = (amount: number, currency: string = 'TL') => `${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${currency}`;

  // Helper to show customer balances string
  const getCustBalancesStr = (c: Customer) => {
      const parts = [];
      if(c.balances.TL !== 0) parts.push(formatMoney(c.balances.TL, 'TL'));
      if(c.balances.USD !== 0) parts.push(formatMoney(c.balances.USD, 'USD'));
      if(c.balances.EUR !== 0) parts.push(formatMoney(c.balances.EUR, 'EUR'));
      return parts.length > 0 ? parts.join(' | ') : '0.00';
  };

  // Helper: Just the description/type (No products)
  const getTransactionDesc = (t: Transaction) => {
      return t.desc || getTrType(t.type, !!t.items);
  };

  // Helper: Just the product names
  const getProductNames = (t: Transaction) => {
      if (t.items && t.items.length > 0) {
          return t.items.map(i => i.name).join(', ');
      }
      return '-';
  };

  // -- PRINT FUNCTIONS --

  // 1. Print Specific Invoice
  const printSingleInvoice = (t: Transaction) => {
      if (!t.items || !t.accId) return;
      const cust = customers.find(c => c.id === t.accId);
      const custName = cust ? cust.name : t.accName;
      const custAddress = cust ? cust.address : '';
      const custPhone = cust ? cust.phone : '';

      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fatura - ${t.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style> body { font-family: 'Inter', sans-serif; padding: 40px; } </style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto border border-slate-200 p-8 bg-white min-h-[900px] relative">
            <div class="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
               <div>
                  <h1 class="text-4xl font-black text-slate-900 tracking-widest">TEKDEMİR</h1>
                  <div class="text-sm text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">KOLTUK & MOBİLYA</div>
               </div>
               <div class="text-right">
                  <div class="text-3xl font-light text-slate-400 uppercase tracking-wide">Fatura</div>
                  <div class="text-sm font-bold text-slate-800 mt-2">#${t.id}</div>
                  <div class="text-sm text-slate-600 mt-1">${formatDate(t.date)}</div>
               </div>
            </div>
            <div class="mb-12 bg-slate-50 p-6 rounded-lg">
                <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Sayın</div>
                <h2 class="text-2xl font-bold text-slate-800">${custName}</h2>
                <div class="text-slate-600 mt-2 text-sm">${custAddress || ''}<br>${custPhone || ''}</div>
            </div>
            <table class="w-full text-sm mb-12">
                <thead>
                    <tr class="border-b-2 border-slate-800">
                        <th class="text-left py-3 font-bold text-slate-900">Ürün</th>
                        <th class="text-center py-3 font-bold text-slate-900">Miktar</th>
                        <th class="text-right py-3 font-bold text-slate-900">Fiyat</th>
                        <th class="text-right py-3 font-bold text-slate-900">Tutar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${t.items.map(item => `
                        <tr>
                            <td class="py-4 font-medium text-slate-800">${item.name}</td>
                            <td class="py-4 text-center text-slate-600">${item.qty} ${item.unit}</td>
                            <td class="py-4 text-right font-mono">${item.price.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                            <td class="py-4 text-right font-bold font-mono">${item.total.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="flex justify-end pt-4 border-t-2 border-slate-900">
                <span class="text-2xl font-black text-slate-900 font-mono">${t.total.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${t.currency}</span>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // 2. Print Monthly Product Summary
  const printProductSummary = () => {
      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aylık Satış Özeti - ${selectedMonth}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style> body { font-family: 'Inter', sans-serif; padding: 40px; } </style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto">
             <div class="text-center mb-10">
                <h1 class="text-3xl font-black text-slate-900 tracking-widest uppercase">TEKDEMİR</h1>
                <div class="text-sm text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">KOLTUK & MOBİLYA</div>
                <div class="mt-6 bg-slate-100 inline-block px-4 py-1 rounded-full text-sm font-bold text-slate-700">AYLIK SATILAN ÜRÜN ÖZETİ</div>
                <div class="mt-2 text-lg font-mono">${selectedMonth}</div>
             </div>
             
             <table class="w-full text-sm border-collapse border border-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="border border-slate-200 px-4 py-2 text-left w-16 text-slate-400">#</th>
                        <th class="border border-slate-200 px-4 py-2 text-left text-slate-800">Ürün Adı</th>
                        <th class="border border-slate-200 px-4 py-2 text-right text-slate-800">Satılan Adet</th>
                    </tr>
                </thead>
                <tbody>
                    ${productSalesSummary.map(([name, count], index) => `
                        <tr>
                            <td class="border border-slate-200 px-4 py-2 font-mono text-slate-400">${index + 1}</td>
                            <td class="border border-slate-200 px-4 py-2 font-bold text-slate-700">${name}</td>
                            <td class="border border-slate-200 px-4 py-2 text-right font-mono font-bold text-slate-900">${count}</td>
                        </tr>
                    `).join('')}
                </tbody>
             </table>
             <div class="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest">Rapor Sonu</div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // 3. Print Daily Invoices List
  const printDailyInvoicesList = () => {
      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;
      
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.currency === 'TL' ? inv.total : 0), 0);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Günlük Fatura Listesi - ${formatDate(selectedDate)}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style> body { font-family: 'Inter', sans-serif; padding: 40px; } </style>
        </head>
        <body>
          <div class="max-w-3xl mx-auto">
             <div class="text-center mb-10">
                <h1 class="text-3xl font-black text-slate-900 tracking-widest uppercase">TEKDEMİR</h1>
                <div class="mt-6 bg-slate-100 inline-block px-4 py-1 rounded-full text-sm font-bold text-slate-700">GÜNLÜK FATURA LİSTESİ</div>
                <div class="mt-2 text-lg font-mono">${formatDate(selectedDate)}</div>
             </div>
             
             <table class="w-full text-sm border-collapse border border-slate-200 mb-8">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="border border-slate-200 px-4 py-2 text-left">Fatura ID</th>
                        <th class="border border-slate-200 px-4 py-2 text-left">Cari Adı</th>
                        <th class="border border-slate-200 px-4 py-2 text-center">Kalem</th>
                        <th class="border border-slate-200 px-4 py-2 text-right">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map((inv) => `
                        <tr>
                            <td class="border border-slate-200 px-4 py-2 font-mono text-slate-500">#${inv.id}</td>
                            <td class="border border-slate-200 px-4 py-2 font-bold text-slate-700">${inv.accName}</td>
                            <td class="border border-slate-200 px-4 py-2 text-center text-slate-500">${inv.items?.length || 0}</td>
                            <td class="border border-slate-200 px-4 py-2 text-right font-mono font-bold">${formatMoney(inv.total, inv.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
             </table>
             
             <div class="flex justify-end">
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div class="text-xs uppercase font-bold text-slate-500">Toplam Tutar (TL Bazlı)</div>
                    <div class="text-xl font-black text-slate-900 font-mono">${formatMoney(totalAmount)}</div>
                </div>
             </div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // -- PER CUSTOMER EXPORT LOGIC --
  const handleCustomerExport = (cust: Customer) => {
      const custTrans = activeTransactions.filter(t => t.accId === cust.id);
      
      // BOM for Excel UTF-8 compatibility
      let csvContent = "\uFEFF"; 
      csvContent += `Firma:;${cust.name}\n`;
      csvContent += `Tarih:;${activeTab === 'daily' ? formatDate(selectedDate) : selectedMonth}\n\n`;
      // Added "Ürün" column
      csvContent += "Tarih;İşlem Türü;Ürün;Açıklama;Borç (Çıkış);Alacak (Giriş);Tutar;Para Birimi\n";

      custTrans.forEach(t => {
        const isDebt = t.type === 'sales' || t.type === 'cash_out';
        const isCredit = t.type === 'purchase' || t.type === 'cash_in';
        const debtStr = isDebt ? t.total.toString().replace('.', ',') : '';
        const creditStr = isCredit ? t.total.toString().replace('.', ',') : '';
        const totalStr = t.total.toString().replace('.', ',');
        const trType = getTrType(t.type, !!t.items);
        const desc = getTransactionDesc(t).replace(/"/g, '""');
        const products = getProductNames(t).replace(/"/g, '""');
        
        csvContent += `${formatDate(t.date)};${trType};"${products}";"${desc}";${debtStr};${creditStr};${totalStr};${t.currency}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Ekstre_${cust.name.replace(/\s+/g, '_')}_${activeTab}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCustomerPrint = (cust: Customer) => {
      const custTrans = activeTransactions.filter(t => t.accId === cust.id);
      
      const printWindow = window.open('', '', 'width=900,height=800');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cari Ekstre - ${cust.name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
             body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; padding: 40px; }
             @page { size: A4; margin: 10mm; }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-end">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-widest">TEKDEMİR</h1>
                  <div class="text-sm text-slate-500 font-medium tracking-[0.4em] uppercase mt-1">KOLTUK</div>
               </div>
               <div class="text-right">
                  <div class="text-xl font-bold text-slate-800">${cust.name}</div>
                  <div class="text-slate-500 text-sm mt-1">
                    ${activeTab === 'daily' ? `Günlük Rapor: ${formatDate(selectedDate)}` : `Aylık Rapor: ${selectedMonth}`}
                  </div>
               </div>
            </div>

            <!-- Table -->
            <table class="w-full text-sm text-left border-collapse">
               <thead>
                 <tr class="bg-slate-100 text-slate-600 border-b border-slate-300">
                    <th class="py-3 px-2 font-bold w-20">Tarih</th>
                    <th class="py-3 px-2 font-bold w-32">Ürün</th>
                    <th class="py-3 px-2 font-bold">Açıklama</th>
                    <th class="py-3 px-2 font-bold text-right w-24">Borç</th>
                    <th class="py-3 px-2 font-bold text-right w-24">Alacak</th>
                    <th class="py-3 px-2 font-bold text-center w-16">Birim</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-slate-200">
                 ${custTrans.map(t => {
                    const isDebt = t.type === 'sales' || t.type === 'cash_out';
                    const isCredit = t.type === 'purchase' || t.type === 'cash_in';
                    const trType = getTrType(t.type, !!t.items);
                    const desc = t.desc || trType;
                    const products = t.items ? t.items.map(i=>i.name).join(', ') : '-';

                    return `
                      <tr>
                        <td class="py-2 px-2 text-slate-500 text-xs">${formatDate(t.date)}</td>
                        <td class="py-2 px-2 text-slate-800 font-bold text-xs">${products}</td>
                        <td class="py-2 px-2 text-slate-600 font-medium text-xs">${desc}</td>
                        <td class="py-2 px-2 text-right font-mono ${isDebt ? 'text-red-600' : ''}">
                           ${isDebt ? t.total.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}
                        </td>
                        <td class="py-2 px-2 text-right font-mono ${isCredit ? 'text-green-600' : ''}">
                           ${isCredit ? t.total.toLocaleString('tr-TR', {minimumFractionDigits:2}) : '-'}
                        </td>
                        <td class="py-2 px-2 text-center text-slate-400 text-xs">${t.currency}</td>
                      </tr>
                    `;
                 }).join('')}
               </tbody>
            </table>

            <!-- Summary Footer -->
            <div class="mt-8 flex justify-end">
               <div class="bg-slate-50 rounded p-4 border border-slate-200 w-auto min-w-[200px]">
                  <div class="text-xs text-slate-500 uppercase font-bold mb-1">Mevcut Bakiyeler</div>
                  <div class="text-lg font-bold text-slate-800">
                    ${getCustBalancesStr(cust)}
                  </div>
               </div>
            </div>

            <div class="mt-12 text-center text-xs text-slate-300">
               Tekdemir Koltuk Yönetim Sistemi Tarafından Oluşturulmuştur.
            </div>
          </div>
          <script>
             window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // -- GLOBAL EXPORT --
  const handleGlobalExport = () => {
    let csvContent = "\uFEFFTarih;Cari;Islem;Ürün;Aciklama;Tutar;Para Birimi\n";
    activeTransactions.forEach(t => {
        const trType = getTrType(t.type, !!t.items);
        const desc = getTransactionDesc(t).replace(/"/g, '""');
        const products = getProductNames(t).replace(/"/g, '""');
        csvContent += `${t.date};${t.accName || '-'};${trType};"${products}";"${desc}";${t.total.toString().replace('.',',')};${t.currency}\n`;
    });
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Genel_Rapor_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
        
      {/* Controls */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4 no-print">
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
             <div className="flex items-center bg-slate-100/80 rounded-xl p-1 w-full sm:w-auto">
                <button 
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily' ? 'bg-white shadow-md text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Günlük Rapor
                </button>
                <button 
                    onClick={() => setActiveTab('monthly')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'monthly' ? 'bg-white shadow-md text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Aylık Rapor
                </button>
             </div>

             <div className="relative w-full sm:w-64 group">
                <Filter size={16} className="absolute left-3 top-3 text-slate-400 group-hover:text-primary transition-colors" />
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs font-medium bg-white cursor-pointer hover:border-slate-300 transition-all appearance-none"
                >
                    <option value="all">Tüm İşlemler</option>
                    <option value="sales">Satış Faturaları</option>
                    <option value="purchase">Alış Faturaları</option>
                    <option value="cash_in">Tahsilatlar (Giriş)</option>
                    <option value="cash_out">Ödemeler (Çıkış)</option>
                </select>
             </div>
         </div>

         <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeTab === 'daily' ? (
                <div className="relative">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs font-bold text-slate-600 bg-white shadow-sm"
                    />
                </div>
            ) : (
                <div className="relative">
                     <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs font-bold text-slate-600 bg-white shadow-sm"
                    />
                </div>
            )}
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <button onClick={() => setEditMode(!editMode)} className={`p-2.5 rounded-xl border transition-all ${editMode ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-orange-100' : 'border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`} title="Rakamları Düzenle">
                {editMode ? <Check size={18}/> : <Edit3 size={18}/>}
            </button>
            <button onClick={handleGlobalExport} className="flex items-center text-slate-600 hover:text-green-600 p-2.5 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-100 transition-colors" title="Excel İndir">
                <Download size={18} />
            </button>
            <button onClick={() => window.print()} className="flex items-center text-slate-600 hover:text-slate-900 p-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors" title="Yazdır">
                <Printer size={18} />
            </button>
         </div>
      </div>

      {/* --- REPORT CONTENT (PAPER VIEW) --- */}
      <div className="bg-white rounded-3xl p-10 print:p-0 shadow-xl print:shadow-none min-h-[29.7cm] mx-auto max-w-[21cm] print:max-w-none text-xs font-sans border border-slate-100/50 print:border-none relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-900 via-primary to-slate-900 print:hidden"></div>

        {/* Header */}
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-[0.2em] text-slate-900 uppercase">TEKDEMİR</h1>
            <div className="text-primary text-[10px] font-bold mt-1 uppercase tracking-[0.6em]">Koltuk & Mobilya</div>
            
            <div className="mt-6 inline-flex flex-col items-center">
                <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {activeTab === 'daily' ? 'GÜNLÜK FİNANS RAPORU' : 'AYLIK FİNANS RAPORU'}
                    </div>
                </div>
                <div className="mt-2 text-xl font-mono font-bold text-slate-800">
                    {activeTab === 'daily' ? formatDate(selectedDate) : selectedMonth}
                </div>
                {filterType !== 'all' && (
                     <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded">
                        Filtre: {filterType === 'sales' ? 'Satış' : filterType === 'purchase' ? 'Alış' : filterType === 'cash_in' ? 'Tahsilat' : 'Ödeme'}
                     </div>
                )}
            </div>
        </div>

        {/* 1. Transaction Detail Table */}
        <div className="mb-10">
            {/* Table Header */}
            <div className="bg-slate-900 text-white rounded-xl mb-3 shadow-lg shadow-slate-200">
                <div className="grid grid-cols-12 text-center py-3 text-[10px] uppercase font-bold tracking-wider">
                    <div className="col-span-2">Cari Bilgisi</div>
                    <div className="col-span-2">Ürün</div>
                    <div className="col-span-2">Açıklama</div>
                    <div className="col-span-2">Giriş / Çıkış</div>
                    <div className="col-span-2">Fatura Tutar</div>
                    <div className="col-span-2">Güncel Bakiye</div>
                </div>
            </div>
            
            {distinctCustIds.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                         <Calendar size={32} className="text-slate-300" />
                    </div>
                    <div className="text-slate-400 font-medium">Seçilen kriterlere uygun işlem bulunamadı.</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {distinctCustIds.map(custId => {
                        const cust = customers.find(c => c.id === custId);
                        if(!cust) return null;
                        const custTrans = activeTransactions.filter(t => t.accId === custId);
                        return (
                            <div key={custId} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid">
                                {/* Customer Header Row */}
                                <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        <div className="font-bold text-[11px] uppercase text-slate-800 tracking-wide">{cust.name}</div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 print:hidden transition-opacity">
                                        <button onClick={() => handleCustomerPrint(cust)} className="text-slate-400 hover:text-slate-700" title="Yazdır"><Printer size={12}/></button>
                                        <button onClick={() => handleCustomerExport(cust)} className="text-slate-400 hover:text-green-600" title="Excel"><FileSpreadsheet size={12}/></button>
                                    </div>
                                </div>

                                {/* Transactions */}
                                <div className="divide-y divide-slate-50">
                                    {custTrans.map((t, idx) => (
                                        <div key={t.id} className="grid grid-cols-12 py-2.5 px-2 text-[10px] items-center hover:bg-slate-50/50 transition-colors">
                                            <div className="col-span-2 text-center">
                                                <div className="font-mono text-slate-500 bg-slate-100 inline-block px-1.5 rounded">{formatDate(t.date)}</div>
                                            </div>
                                            <div className="col-span-2 px-2 font-bold text-slate-700 break-words leading-tight">
                                                {getProductNames(t)}
                                            </div>
                                            <div className="col-span-2 px-2 font-medium text-slate-500 leading-tight truncate">
                                                {getTransactionDesc(t)}
                                            </div>
                                            <div className="col-span-2 text-right px-4 font-mono font-medium">
                                                {(t.type === 'cash_in' || t.type === 'cash_out') ? (
                                                    <span className={t.type === 'cash_in' ? 'text-green-600' : 'text-red-600'}>
                                                        {formatMoney(t.total, t.currency)}
                                                    </span>
                                                ) : <span className="text-slate-200">-</span>}
                                            </div>
                                            <div className="col-span-2 text-right px-4 font-mono font-medium text-slate-700">
                                                {(t.type === 'sales' || t.type === 'purchase') ? formatMoney(t.total, t.currency) : <span className="text-slate-200">-</span>}
                                            </div>
                                            <div className="col-span-2 text-right px-4 font-mono font-bold text-slate-900 truncate" title={getCustBalancesStr(cust)}>
                                                {getCustBalancesStr(cust)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* 2. Invoices List (Daily Only) */}
        {activeTab === 'daily' && invoices.length > 0 && (
            <div className="mb-10 break-inside-avoid">
                 <div className="flex justify-between items-center mb-4">
                     <div className="font-bold text-slate-800 uppercase text-xs flex items-center tracking-wider">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg mr-2"><FileText size={14}/></div>
                        Günün Faturaları
                     </div>
                     <button 
                        onClick={printDailyInvoicesList}
                        className="text-[10px] font-bold flex items-center gap-1 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                     >
                         <Printer size={12} /> Listeyi Yazdır
                     </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {invoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl text-[10px] bg-white shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center">
                                <div className="font-bold mr-2 text-slate-700">{inv.accName}</div>
                                <div className="text-slate-400 text-[9px] bg-slate-50 px-1.5 py-0.5 rounded-md">{inv.items?.length} Kalem</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="font-mono font-bold text-slate-900">{formatMoney(inv.total, inv.currency)}</div>
                                <button 
                                    onClick={() => printSingleInvoice(inv)}
                                    className="text-slate-300 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors print:hidden"
                                    title="Faturayı Yazdır"
                                >
                                    <Printer size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 3. Financial Summary Cards */}
        <div className="mb-10 break-inside-avoid">
             <div className="flex items-center justify-center mb-6">
                 <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase text-slate-500 tracking-wide">
                     {activeTab === 'daily' ? 'Günlük Finans Özeti' : 'Aylık Finans Özeti'} (TL)
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-8">
                 {/* IN Card */}
                 <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-3xl p-6 relative overflow-hidden">
                     <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold uppercase text-xs tracking-wide">
                         <div className="p-1.5 bg-emerald-100 rounded-lg"><TrendingUp size={16} /></div>
                         Tahsilat (Giriş)
                     </div>
                     <div className="space-y-2 relative z-10">
                         {Object.entries(stats.in).map(([key, val]) => (
                             <div key={key} className="flex justify-between items-center text-[10px]">
                                 <span className="uppercase text-slate-500 font-semibold text-[9px]">{key.replace('_', ' ')}</span>
                                 <div className="flex-1 border-b border-dotted border-emerald-200 mx-2 relative top-1"></div>
                                 {editMode ? (
                                     <input className="text-right w-20 border border-emerald-200 rounded bg-white text-[10px] px-1 font-mono" defaultValue={val} />
                                 ) : (
                                     <span className="font-mono font-bold text-slate-700">{formatMoney(val)}</span>
                                 )}
                             </div>
                         ))}
                     </div>
                     <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-600 opacity-70">TOPLAM GİRİŞ</span>
                        <span className="text-lg font-black font-mono text-emerald-600">{formatMoney(Object.values(stats.in).reduce((a,b)=>a+b,0))}</span>
                     </div>
                 </div>

                 {/* OUT Card */}
                 <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-3xl p-6 relative overflow-hidden">
                     <div className="flex items-center gap-2 mb-4 text-rose-700 font-bold uppercase text-xs tracking-wide">
                         <div className="p-1.5 bg-rose-100 rounded-lg"><TrendingDown size={16} /></div>
                         Ödeme (Çıkış)
                     </div>
                      <div className="space-y-2 relative z-10">
                         {Object.entries(stats.out).map(([key, val]) => (
                             <div key={key} className="flex justify-between items-center text-[10px]">
                                 <span className="uppercase text-slate-500 font-semibold text-[9px]">{key.replace('_', ' ')}</span>
                                 <div className="flex-1 border-b border-dotted border-rose-200 mx-2 relative top-1"></div>
                                 {editMode ? (
                                     <input className="text-right w-20 border border-rose-200 rounded bg-white text-[10px] px-1 font-mono" defaultValue={val} />
                                 ) : (
                                     <span className="font-mono font-bold text-slate-700">{formatMoney(val)}</span>
                                 )}
                             </div>
                         ))}
                     </div>
                     <div className="mt-4 pt-4 border-t border-rose-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-rose-600 opacity-70">TOPLAM ÇIKIŞ</span>
                        <span className="text-lg font-black font-mono text-rose-600">{formatMoney(Object.values(stats.out).reduce((a,b)=>a+b,0))}</span>
                     </div>
                 </div>
             </div>
             
             {/* Total Bar */}
             <div className="mt-6 bg-slate-900 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-slate-200 text-white">
                 <div className="text-xs font-bold uppercase tracking-widest opacity-60">Net Nakit Akışı</div>
                 <div className="text-xl font-mono font-black">
                     {formatMoney(Object.values(stats.in).reduce((a,b)=>a+b,0) - Object.values(stats.out).reduce((a,b)=>a+b,0))}
                 </div>
             </div>
        </div>

        {/* 4. Monthly Product Sales Summary (Only if Monthly Tab is active) */}
        {activeTab === 'monthly' && productSalesSummary.length > 0 && (
             <div className="mt-10 border border-slate-100 rounded-2xl overflow-hidden break-inside-avoid shadow-sm">
                <div className="bg-slate-50 text-slate-700 font-bold py-3 px-6 uppercase text-xs flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center">
                        <PieChart size={14} className="mr-2 text-primary"/> Aylık Satılan Ürün Özeti
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={printProductSummary}
                            className="text-[10px] font-bold flex items-center gap-1 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1 rounded-lg transition-colors border border-slate-200 shadow-sm"
                        >
                            <Printer size={12} /> Listeyi Yazdır
                        </button>
                        <div className="text-[9px] text-slate-400 font-normal">Miktar Bazlı Sıralama</div>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-50 bg-white">
                    {productSalesSummary.map(([name, count], index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-6 text-[10px] hover:bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="text-slate-300 font-mono text-[9px] w-4">{(index + 1).toString().padStart(2, '0')}</div>
                                <div className="text-slate-700 font-bold">{name}</div>
                            </div>
                            <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{count}</div>
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        <div className="mt-12 text-[9px] text-slate-300 text-center uppercase tracking-[0.3em] font-medium">
            Tekdemir Koltuk Yönetim Sistemleri v14.2
        </div>

      </div>
    </div>
  );
};
