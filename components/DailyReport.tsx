
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod } from '../types';
import { Printer, Download, Calendar, Edit3, Check, FileText, FileSpreadsheet, Filter, Box, TrendingUp, TrendingDown, PieChart, Users, Store } from 'lucide-react';

interface DailyReportProps {
  transactions: Transaction[];
  customers: Customer[];
  panelMode?: 'accounting' | 'store';
}

// Helper to get day invoices (ONLY PURCHASE INVOICES AS REQUESTED FOR BOTTOM SECTION)
const getDailyPurchaseInvoices = (transactions: Transaction[], date: string) => {
    return transactions.filter(t => t.date === date && t.type === 'purchase');
};

const getTrType = (type: string, hasItems: boolean) => {
    if (hasItems) return type === 'sales' ? 'Satış Faturası' : 'Alış Faturası';
    switch(type) {
        case 'cash_in': return 'Tahsilat';
        case 'cash_out': return 'Ödeme';
        default: return type;
    }
};

export const DailyReport: React.FC<DailyReportProps> = ({ transactions, customers, panelMode = 'accounting' }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);
  
  // -- DATA PROCESSING --
  const activeTransactions = useMemo(() => {
      let filtered = transactions;

      // Filter by SECTION (Store vs Accounting)
      filtered = filtered.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));

      // Date Filter
      if (activeTab === 'daily') {
          filtered = filtered.filter(t => t.date === selectedDate);
          // İSTEK: Alış faturaları üst kısımda detaylı çıkmasın (Sadece günlük raporda)
          filtered = filtered.filter(t => t.type !== 'purchase');
      } else {
          filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
      }

      // Type Filter
      if (filterType !== 'all') {
          filtered = filtered.filter(t => t.type === filterType);
      }

      return filtered;
  }, [transactions, activeTab, selectedDate, selectedMonth, filterType, panelMode]);
  
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

  // İSTEK: Sadece alış faturaları listelensin (Günlük Rapor - Alt Kısım)
  const invoices = activeTab === 'daily' ? getDailyPurchaseInvoices(transactions.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting'))), selectedDate) : [];

  // Monthly Product Sales Count Logic (Overall)
  const productSalesSummary = useMemo(() => {
      // Show monthly summary always if explicitly requested, but usually on monthly tab
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

  // New Feature: Customer based Product Sales (Monthly)
  const customerProductSummary = useMemo(() => {
    if (activeTab !== 'monthly') return [];

    const sales = activeTransactions.filter(t => t.type === 'sales' && t.items && t.accId);
    const summary: Record<string, Record<string, number>> = {};

    sales.forEach(sale => {
        if (!sale.accId) return;
        const custName = customers.find(c => c.id === sale.accId)?.name || 'Bilinmeyen Cari';
        
        if (!summary[custName]) summary[custName] = {};

        sale.items?.forEach(item => {
            if (summary[custName][item.name]) {
                summary[custName][item.name] += item.qty;
            } else {
                summary[custName][item.name] = item.qty;
            }
        });
    });

    return summary;
  }, [activeTransactions, activeTab, customers]);

  // Formatters
  const formatDate = (d: string) => d.split('-').reverse().join('.');
  const formatMoney = (amount: number, currency: string = 'TL') => `${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${currency}`;
  const getCustBalancesStr = (c: Customer) => {
      const parts = [];
      if(c.balances.TL !== 0) parts.push(formatMoney(c.balances.TL, 'TL'));
      if(c.balances.USD !== 0) parts.push(formatMoney(c.balances.USD, 'USD'));
      if(c.balances.EUR !== 0) parts.push(formatMoney(c.balances.EUR, 'EUR'));
      return parts.length > 0 ? parts.join(' | ') : '0.00';
  };
  const getTransactionDesc = (t: Transaction) => t.desc || getTrType(t.type, !!t.items);
  const getProductNames = (t: Transaction) => t.items && t.items.length > 0 ? t.items.map(i => i.name).join(', ') : '-';

  // Placeholder functions for prints
  const printSingleInvoice = (t: Transaction) => { /* Logic hidden for brevity */ };
  const printProductSummary = () => { /* Logic hidden for brevity */ };
  const printDailyInvoicesList = () => { /* Logic hidden for brevity */ };
  const handleCustomerPrint = (cust: Customer) => { /* Logic hidden for brevity */ };
  
  const handleGlobalExport = () => {
    // CSV Header: Added 'Bölüm' and 'Bağlı Fatura'
    let csvContent = "\uFEFFTarih;Bölüm;Cari;Islem;Bağlı Fatura;Ürün;Aciklama;Tutar;Para Birimi\n";
    
    activeTransactions.forEach(t => {
        const trType = getTrType(t.type, !!t.items);
        const desc = getTransactionDesc(t).replace(/"/g, '""');
        const products = getProductNames(t).replace(/"/g, '""');
        const linkedId = t.linkedTransactionId ? `#${t.linkedTransactionId}` : '-';
        const sectionName = t.section === 'store' ? 'Mağaza' : 'Muhasebe';
        
        csvContent += `${t.date};${sectionName};${t.accName || '-'};${trType};${linkedId};"${products}";"${desc}";${t.total.toString().replace('.',',')};${t.currency}\n`;
    });
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Filename differentiates store vs accounting
    const filenamePrefix = panelMode === 'store' ? 'Magaza_Satis_Raporu' : 'Muhasebe_Finans_Raporu';
    link.setAttribute("download", `${filenamePrefix}_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none" />
            ) : (
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none" />
            )}
            <button onClick={() => setEditMode(!editMode)} className="p-2.5 rounded-xl border transition-all text-slate-500 hover:bg-slate-50"><Edit3 size={18}/></button>
            <button onClick={handleGlobalExport} className="p-2.5 rounded-xl border text-green-600 hover:bg-green-50" title="Excel Olarak İndir"><Download size={18} /></button>
            <button onClick={() => window.print()} className="p-2.5 rounded-xl border text-slate-600 hover:bg-slate-100"><Printer size={18} /></button>
         </div>
      </div>

      {/* --- REPORT CONTENT --- */}
      <div className="bg-white rounded-3xl p-10 print:p-0 shadow-xl print:shadow-none mx-auto print:max-w-none text-xs font-sans border border-slate-100/50 print:border-none relative overflow-hidden print:overflow-visible">
        
        {/* Header */}
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-[0.2em] text-slate-900 uppercase">TEKDEMİR</h1>
            <div className={`text-[10px] font-bold mt-1 uppercase tracking-[0.6em] ${panelMode === 'store' ? 'text-orange-500' : 'text-primary'}`}>
                {panelMode === 'store' ? 'MAĞAZA RAPORU' : 'KOLTUK & MOBİLYA'}
            </div>
            
            <div className="mt-6 inline-flex flex-col items-center">
                <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {activeTab === 'daily' ? 'GÜNLÜK FİNANS RAPORU' : 'AYLIK FİNANS RAPORU'}
                    </div>
                </div>
                <div className="mt-2 text-xl font-mono font-bold text-slate-800">
                    {activeTab === 'daily' ? formatDate(selectedDate) : selectedMonth}
                </div>
            </div>
        </div>

        {/* 1. Transaction Detail Table */}
        <div className="mb-10">
            {distinctCustIds.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                     <span className="text-slate-400 font-medium">İşlem bulunamadı.</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {distinctCustIds.map(custId => {
                        const cust = customers.find(c => c.id === custId);
                        if(!cust) return null;
                        const custTrans = activeTransactions.filter(t => t.accId === custId);
                        return (
                            <div key={custId} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid">
                                <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-center border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${panelMode === 'store' ? 'bg-orange-500' : 'bg-primary'}`}></div>
                                        <div className="font-bold text-[11px] uppercase text-slate-800 tracking-wide">{cust.name}</div>
                                    </div>
                                    {/* Print Button */}
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {custTrans.map((t) => (
                                        <div key={t.id} className="grid grid-cols-12 py-2.5 px-2 text-[10px] items-center hover:bg-slate-50/50 transition-colors">
                                            <div className="col-span-2 text-center"><div className="font-mono text-slate-500 bg-slate-100 inline-block px-1.5 rounded">{formatDate(t.date)}</div></div>
                                            <div className="col-span-2 px-2 font-bold text-slate-700 break-words leading-tight">{getProductNames(t)}</div>
                                            <div className="col-span-2 px-2 font-medium text-slate-500 leading-tight truncate">{getTransactionDesc(t)}</div>
                                            <div className="col-span-2 text-right px-4 font-mono font-medium">{(t.type === 'cash_in' || t.type === 'cash_out') ? formatMoney(t.total, t.currency) : '-'}</div>
                                            <div className="col-span-2 text-right px-4 font-mono font-medium text-slate-700">{(t.type === 'sales' || t.type === 'purchase') ? formatMoney(t.total, t.currency) : '-'}</div>
                                            <div className="col-span-2 text-right px-4 font-mono font-bold text-slate-900 truncate">{getCustBalancesStr(cust)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* 2. Monthly Product Sales Summary (For Store Section mostly) */}
        {activeTab === 'monthly' && productSalesSummary.length > 0 && (
             <div className="mt-10 border border-slate-100 rounded-2xl overflow-hidden break-inside-avoid shadow-sm">
                <div className="bg-slate-50 text-slate-700 font-bold py-3 px-6 uppercase text-xs flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center">
                        <Store size={14} className="mr-2 text-orange-500"/> Aylık Mağaza Satış Raporu (Adet)
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
      </div>
    </div>
  );
};
