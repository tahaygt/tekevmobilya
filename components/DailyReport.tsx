
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod } from '../types';
import { Printer, Download, Calendar, Edit3, Filter, Box, TrendingUp, TrendingDown, PieChart, Users, Store, User, Truck, DollarSign, Wallet } from 'lucide-react';

interface DailyReportProps {
  transactions: Transaction[];
  customers: Customer[];
  panelMode?: 'accounting' | 'store';
}

export const DailyReport: React.FC<DailyReportProps> = ({ transactions, customers, panelMode = 'accounting' }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<string>('all');
  
  const formatDate = (d: string) => d.split('-').reverse().join('.');
  const formatMoney = (amount: number, currency: string = 'TL') => `${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${currency}`;

  // -- DATA PROCESSING --
  const activeTransactions = useMemo(() => {
      let filtered = transactions;
      filtered = filtered.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));

      if (activeTab === 'daily') {
          filtered = filtered.filter(t => t.date === selectedDate);
          // Günlük ana tabloda alış faturalarını gizle (aşağıda özel tablo var)
          filtered = filtered.filter(t => t.type !== 'purchase');
      } else {
          filtered = filtered.filter(t => t.date.startsWith(selectedMonth));
      }

      if (filterType !== 'all') {
          filtered = filtered.filter(t => t.type === filterType);
      }
      return filtered;
  }, [transactions, activeTab, selectedDate, selectedMonth, filterType, panelMode]);
  
  const distinctCustIds = Array.from(new Set(activeTransactions.map(t => t.accId))).filter(Boolean) as number[];

  // Günlük Alış Faturaları
  const dailyPurchaseInvoices = useMemo(() => {
      if (activeTab !== 'daily') return [];
      const relevantTrans = transactions.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));
      return relevantTrans.filter(t => t.date === selectedDate && t.type === 'purchase');
  }, [transactions, activeTab, selectedDate, panelMode]);

  // Aylık Ürün Satışları
  const productSalesSummary = useMemo(() => {
      if (activeTab !== 'monthly') return [];
      const sales = activeTransactions.filter(t => t.type === 'sales' && t.items);
      const productCounts: Record<string, number> = {};
      sales.forEach(sale => {
          sale.items?.forEach(item => {
              productCounts[item.name] = (productCounts[item.name] || 0) + item.qty;
          });
      });
      return Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
  }, [activeTransactions, activeTab]);

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print sticky top-0 z-20">
         <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'daily' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Günlük</button>
            <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'monthly' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Aylık</button>
         </div>
         
         <div className="flex items-center gap-3">
             <div className="relative">
                <Filter size={14} className="absolute left-3 top-3 text-slate-400" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400 appearance-none">
                    <option value="all">Tüm İşlemler</option>
                    <option value="sales">Satış</option>
                    <option value="cash_in">Tahsilat</option>
                </select>
             </div>
             
             {activeTab === 'daily' ? (
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none bg-white" />
            ) : (
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none bg-white" />
            )}
             
            <button onClick={() => window.print()} className="bg-slate-800 text-white p-2.5 rounded-xl hover:bg-slate-700 transition-colors"><Printer size={16}/></button>
         </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 print:p-0 print:border-none shadow-xl print:shadow-none min-h-[600px] relative overflow-hidden">
        {/* Decorative Background for Print */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10 opacity-50 print:opacity-100"></div>

        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">TEKDEMİR</h1>
            <div className={`text-xs font-bold uppercase tracking-[0.3em] ${panelMode === 'store' ? 'text-orange-500' : 'text-sky-500'}`}>
                {panelMode === 'store' ? 'Mağaza Yönetimi' : 'Mobilya & Finans'}
            </div>
            <div className="mt-8 inline-block px-6 py-2 rounded-full border border-slate-100 bg-slate-50/50 backdrop-blur">
                <span className="text-sm font-bold text-slate-600">
                    {activeTab === 'daily' ? `Günlük Rapor • ${formatDate(selectedDate)}` : `Aylık Rapor • ${selectedMonth}`}
                </span>
            </div>
        </div>

        {/* Transactions Grid */}
        <div className="grid grid-cols-1 gap-6">
            {distinctCustIds.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Bu tarih için kayıt bulunamadı.
                </div>
            ) : (
                distinctCustIds.map(custId => {
                    const cust = customers.find(c => c.id === custId);
                    if(!cust) return null;
                    const custTrans = activeTransactions.filter(t => t.accId === custId);
                    return (
                        <div key={custId} className="break-inside-avoid border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                    {cust.name}
                                </div>
                                <div className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                                    Bakiye: {cust.balances.TL.toLocaleString('tr-TR')} TL
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {custTrans.map(t => (
                                    <div key={t.id} className="grid grid-cols-12 gap-4 px-6 py-3 text-xs items-center hover:bg-slate-50/50">
                                        <div className="col-span-2 text-slate-400 font-mono">{t.date.split('-').reverse().join('.')}</div>
                                        <div className="col-span-4 font-bold text-slate-700">
                                            {t.items?.map(i => i.name).join(', ') || t.desc}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold
                                                ${t.type === 'sales' ? 'bg-sky-50 text-sky-600' : 
                                                  t.type === 'cash_in' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}
                                            `}>
                                                {t.type === 'sales' ? 'Satış' : t.type === 'cash_in' ? 'Tahsilat' : t.type}
                                            </span>
                                        </div>
                                        <div className="col-span-4 text-right font-mono font-bold text-slate-800">
                                            {formatMoney(t.total, t.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })
            )}
        </div>
        
        {/* Bottom Sections: Purchase Invoices & Product Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 break-inside-avoid">
            {/* Daily Expenses */}
            {activeTab === 'daily' && dailyPurchaseInvoices.length > 0 && (
                <div className="border border-red-100 rounded-2xl overflow-hidden bg-white">
                    <div className="bg-red-50/50 px-6 py-3 border-b border-red-100 font-bold text-red-700 text-xs uppercase flex items-center gap-2">
                        <Truck size={14}/> Günlük Giderler / Alışlar
                    </div>
                    <div className="divide-y divide-red-50">
                        {dailyPurchaseInvoices.map(t => (
                            <div key={t.id} className="p-4 flex justify-between items-center text-xs">
                                <div>
                                    <div className="font-bold text-slate-700">{t.accName}</div>
                                    <div className="text-slate-400 mt-0.5">{t.items?.map(i=>i.name).join(', ')}</div>
                                </div>
                                <div className="font-mono font-bold text-red-600">{formatMoney(t.total, t.currency)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Monthly Product Stats */}
            {activeTab === 'monthly' && productSalesSummary.length > 0 && (
                <div className="border border-sky-100 rounded-2xl overflow-hidden bg-white lg:col-span-2">
                    <div className="bg-sky-50/50 px-6 py-3 border-b border-sky-100 font-bold text-sky-700 text-xs uppercase flex items-center gap-2">
                        <Box size={14}/> Aylık En Çok Satan Ürünler
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                            {productSalesSummary.map(([name, qty], idx) => (
                                <div key={idx} className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-bold">{idx+1}</div>
                                    <span className="text-xs font-bold text-slate-700">{name}</span>
                                    <span className="text-xs font-mono text-slate-400 border-l border-slate-100 pl-3">{qty} Adet</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
