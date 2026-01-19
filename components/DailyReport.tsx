
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod } from '../types';
import { Printer, Download, Calendar, Edit3, Check, FileText, FileSpreadsheet, Filter, Box } from 'lucide-react';

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
        case 'cash_in': return 'Tahsilat (Giriş)';
        case 'cash_out': return 'Ödeme (Çıkış)';
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
    // Just summing TL for summary view, or we can make a complex summary later.
    // For now assuming summary is TL focused or mixed.
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

  // Helper to get description with product names if invoice
  const getTransactionDesc = (t: Transaction) => {
      let mainDesc = t.desc || getTrType(t.type, !!t.items);
      if (t.items && t.items.length > 0) {
          const productNames = t.items.map(i => i.name).join(', ');
          mainDesc += ` (${productNames})`;
      }
      return mainDesc;
  };

  // -- PER CUSTOMER EXPORT LOGIC --
  const handleCustomerExport = (cust: Customer) => {
      const custTrans = activeTransactions.filter(t => t.accId === cust.id);
      
      // BOM for Excel UTF-8 compatibility
      let csvContent = "\uFEFF"; 
      csvContent += `Firma:;${cust.name}\n`;
      csvContent += `Tarih:;${activeTab === 'daily' ? formatDate(selectedDate) : selectedMonth}\n\n`;
      csvContent += "Tarih;İşlem Türü;Açıklama;Borç (Çıkış);Alacak (Giriş);Tutar;Para Birimi\n";

      custTrans.forEach(t => {
        const isDebt = t.type === 'sales' || t.type === 'cash_out';
        const isCredit = t.type === 'purchase' || t.type === 'cash_in';
        const debtStr = isDebt ? t.total.toString().replace('.', ',') : '';
        const creditStr = isCredit ? t.total.toString().replace('.', ',') : '';
        const totalStr = t.total.toString().replace('.', ',');
        const trType = getTrType(t.type, !!t.items);
        const fullDesc = getTransactionDesc(t).replace(/"/g, '""');
        
        csvContent += `${formatDate(t.date)};${trType};"${fullDesc}";${debtStr};${creditStr};${totalStr};${t.currency}\n`;
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
                    <th class="py-3 px-2 font-bold w-24">Tarih</th>
                    <th class="py-3 px-2 font-bold">Açıklama / İşlem</th>
                    <th class="py-3 px-2 font-bold text-right w-32">Borç</th>
                    <th class="py-3 px-2 font-bold text-right w-32">Alacak</th>
                    <th class="py-3 px-2 font-bold text-center w-24">Birim</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-slate-200">
                 ${custTrans.map(t => {
                    const isDebt = t.type === 'sales' || t.type === 'cash_out';
                    const isCredit = t.type === 'purchase' || t.type === 'cash_in';
                    const trType = getTrType(t.type, !!t.items);
                    // Inline helper for description in HTML
                    let fullDesc = t.desc || trType;
                    if (t.items && t.items.length > 0) fullDesc += ` (${t.items.map(i=>i.name).join(', ')})`;

                    return `
                      <tr>
                        <td class="py-2 px-2 text-slate-500">${formatDate(t.date)}</td>
                        <td class="py-2 px-2 text-slate-800 font-medium">${fullDesc}</td>
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
    let csvContent = "\uFEFFTarih;Cari;Islem;Aciklama;Tutar;Para Birimi\n";
    activeTransactions.forEach(t => {
        const trType = getTrType(t.type, !!t.items);
        const fullDesc = getTransactionDesc(t).replace(/"/g, '""');
        csvContent += `${t.date};${t.accName || '-'};${trType};"${fullDesc}";${t.total.toString().replace('.',',')};${t.currency}\n`;
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-4 no-print">
         <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
             <div className="flex items-center bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                <button 
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                >
                    Günlük
                </button>
                <button 
                    onClick={() => setActiveTab('monthly')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'monthly' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                >
                    Aylık
                </button>
             </div>

             <div className="relative w-full sm:w-64">
                <Filter size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-4 focus:ring-2 focus:ring-primary outline-none text-sm bg-white cursor-pointer hover:border-slate-300"
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
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
            ) : (
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
            )}
            
            <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-lg border ${editMode ? 'bg-orange-50 border-orange-200 text-orange-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`} title="Düzenle">
                {editMode ? <Check size={20}/> : <Edit3 size={20}/>}
            </button>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <button onClick={handleGlobalExport} className="flex items-center text-slate-600 hover:text-green-600 p-2 hover:bg-green-50 rounded-lg" title="Tümünü Excel İndir">
                <Download size={20} />
            </button>
            <button onClick={() => window.print()} className="flex items-center text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg" title="Sayfayı Yazdır">
                <Printer size={20} />
            </button>
         </div>
      </div>

      {/* --- REPORT CONTENT --- */}
      <div className="bg-white p-8 print:p-0 shadow-lg print:shadow-none min-h-[29.7cm] mx-auto max-w-[21cm] print:max-w-none text-xs font-sans">
        
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
            <h1 className="text-3xl font-bold tracking-[0.2em] text-slate-900 uppercase">TEKDEMİR</h1>
            <div className="text-slate-500 text-sm mt-1 uppercase tracking-[0.4em]">KOLTUK</div>
            <div className="mt-4 flex flex-col items-center gap-1">
                <div className="text-xs font-medium bg-slate-100 inline-block px-3 py-1 rounded-full uppercase">
                    {activeTab === 'daily' ? `GÜNLÜK FİNANSAL RAPOR: ${formatDate(selectedDate)}` : `AYLIK FİNANSAL RAPOR: ${selectedMonth}`}
                </div>
                {filterType !== 'all' && (
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Filtre: {filterType === 'sales' ? 'Satış Faturaları' : filterType === 'purchase' ? 'Alış Faturaları' : filterType === 'cash_in' ? 'Tahsilatlar' : 'Ödemeler'}
                     </div>
                )}
            </div>
        </div>

        {/* 1. Transaction Detail Table */}
        <div className="border border-slate-400 mb-8">
            <div className="bg-slate-800 text-white font-bold grid grid-cols-12 text-center py-2 text-[10px] uppercase">
                <div className="col-span-2">Cari</div>
                <div className="col-span-4">Açıklama</div>
                <div className="col-span-2">Ödeme / Tahsilat</div>
                <div className="col-span-2">Fatura Tutar</div>
                <div className="col-span-2">Cari Bakiye</div>
            </div>
            
            {distinctCustIds.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                    <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                    Seçilen kriterlere uygun işlem bulunamadı.
                </div>
            ) : (
                distinctCustIds.map(custId => {
                    const cust = customers.find(c => c.id === custId);
                    if(!cust) return null;
                    const custTrans = activeTransactions.filter(t => t.accId === custId);
                    return (
                        <div key={custId} className="border-b border-slate-300 last:border-b-0 group">
                            {/* Customer Header Row */}
                            <div className="bg-slate-100 px-3 py-1.5 flex justify-between items-center border-b border-slate-200">
                                <div className="font-bold text-[11px] uppercase text-slate-800">{cust.name}</div>
                                <div className="flex gap-2 opacity-100 print:hidden">
                                    <button 
                                        onClick={() => handleCustomerPrint(cust)} 
                                        className="flex items-center gap-1 text-[9px] bg-white border border-slate-300 px-2 py-0.5 rounded hover:bg-slate-50 hover:text-slate-900 text-slate-500 transition-colors"
                                    >
                                        <Printer size={10} /> Yazdır
                                    </button>
                                    <button 
                                        onClick={() => handleCustomerExport(cust)}
                                        className="flex items-center gap-1 text-[9px] bg-white border border-slate-300 px-2 py-0.5 rounded hover:bg-green-50 hover:text-green-700 text-slate-500 transition-colors"
                                    >
                                        <FileSpreadsheet size={10} /> Excel
                                    </button>
                                </div>
                            </div>

                            {/* Transactions */}
                            {custTrans.map((t, idx) => (
                                <div key={t.id} className="grid grid-cols-12 py-1 px-2 border-b border-slate-100 last:border-b-0 text-[10px] items-center hover:bg-yellow-50 transition-colors">
                                    <div className="col-span-2 text-slate-400 pl-1">{formatDate(t.date)}</div>
                                    <div className="col-span-4 truncate px-1 font-medium text-slate-700">
                                        {getTransactionDesc(t)}
                                    </div>
                                    <div className="col-span-2 text-right px-1 font-mono">{(t.type === 'cash_in' || t.type === 'cash_out') ? formatMoney(t.total, t.currency) : ''}</div>
                                    <div className="col-span-2 text-right px-1 font-mono">{(t.type === 'sales' || t.type === 'purchase') ? formatMoney(t.total, t.currency) : ''}</div>
                                    <div className="col-span-2 text-right px-1 font-mono font-bold text-slate-900 truncate" title={getCustBalancesStr(cust)}>
                                        {getCustBalancesStr(cust)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })
            )}
        </div>

        {/* 2. Invoices List (Daily Only) */}
        {activeTab === 'daily' && invoices.length > 0 && (
            <div className="mb-8 break-inside-avoid">
                 <div className="font-bold text-slate-800 border-b border-slate-300 mb-2 pb-1 uppercase text-xs flex items-center">
                    <FileText size={12} className="mr-1"/> Günün Faturaları
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {invoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between border border-slate-200 p-2 rounded text-[10px] bg-slate-50">
                            <div className="flex items-center">
                                <div className="font-bold mr-2 text-slate-700">{inv.accName}</div>
                                <div className="text-slate-400 text-[9px]">{inv.items?.length} Kalem</div>
                            </div>
                            <div className="font-mono font-bold text-slate-900">{formatMoney(inv.total, inv.currency)}</div>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {/* 3. Financial Summary */}
        <div className="border border-slate-400 break-inside-avoid">
             <div className="bg-slate-800 text-white font-bold text-center py-2 uppercase text-xs">
                 {activeTab === 'daily' ? 'Günlük Finans Özeti' : 'Aylık Finans Özeti'} (TL Bazlı)
             </div>
             <div className="grid grid-cols-2 divide-x divide-slate-400">
                 {/* IN */}
                 <div>
                     <div className="bg-green-50 text-green-800 font-bold text-center py-1 text-[10px] uppercase border-b border-green-200">Tahsilat (Giriş)</div>
                     <div className="p-2 space-y-1">
                         {Object.entries(stats.in).map(([key, val]) => (
                             <div key={key} className="flex justify-between text-[10px] border-b border-dashed border-slate-200 last:border-0 pb-1 last:pb-0">
                                 <span className="uppercase text-slate-500 font-semibold text-[9px]">{key.replace('_', ' ')}</span>
                                 {editMode ? (
                                     <input className="text-right w-20 border rounded bg-yellow-50 text-[10px] px-1" defaultValue={val} />
                                 ) : (
                                     <span className="font-mono font-bold text-slate-700">{formatMoney(val)}</span>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
                 {/* OUT */}
                 <div>
                     <div className="bg-red-50 text-red-800 font-bold text-center py-1 text-[10px] uppercase border-b border-red-200">Ödeme (Çıkış)</div>
                      <div className="p-2 space-y-1">
                         {Object.entries(stats.out).map(([key, val]) => (
                             <div key={key} className="flex justify-between text-[10px] border-b border-dashed border-slate-200 last:border-0 pb-1 last:pb-0">
                                 <span className="uppercase text-slate-500 font-semibold text-[9px]">{key.replace('_', ' ')}</span>
                                 {editMode ? (
                                     <input className="text-right w-20 border rounded bg-yellow-50 text-[10px] px-1" defaultValue={val} />
                                 ) : (
                                     <span className="font-mono font-bold text-slate-700">{formatMoney(val)}</span>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
             
             {/* Total Footer */}
             <div className="grid grid-cols-2 divide-x divide-slate-400 border-t border-slate-400 bg-slate-50">
                 <div className="p-2 text-center text-xs font-bold text-green-700">
                     TOPLAM GİRİŞ: {formatMoney(Object.values(stats.in).reduce((a,b)=>a+b,0))}
                 </div>
                 <div className="p-2 text-center text-xs font-bold text-red-700">
                     TOPLAM ÇIKIŞ: {formatMoney(Object.values(stats.out).reduce((a,b)=>a+b,0))}
                 </div>
             </div>
        </div>

        {/* 4. Monthly Product Sales Summary (Only if Monthly Tab is active) */}
        {activeTab === 'monthly' && productSalesSummary.length > 0 && (
             <div className="mt-8 border border-slate-400 break-inside-avoid">
                <div className="bg-slate-800 text-white font-bold text-center py-2 uppercase text-xs flex items-center justify-center">
                    <Box size={14} className="mr-2"/> Aylık Satılan Ürün Özeti
                </div>
                <div className="grid grid-cols-2 bg-slate-100 text-[10px] font-bold uppercase py-1 border-b border-slate-300">
                    <div className="px-4">Ürün Adı</div>
                    <div className="px-4 text-right">Satılan Adet</div>
                </div>
                {productSalesSummary.map(([name, count], index) => (
                    <div key={index} className="grid grid-cols-2 text-[10px] py-1 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <div className="px-4 text-slate-700 font-medium">{name}</div>
                        <div className="px-4 text-right font-mono font-bold text-slate-900">{count}</div>
                    </div>
                ))}
             </div>
        )}
        
        <div className="mt-8 text-[10px] text-slate-300 text-center uppercase tracking-widest font-light">
            Tekdemir Koltuk Yönetim Sistemleri v14
        </div>

      </div>
    </div>
  );
};
