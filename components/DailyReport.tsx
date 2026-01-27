
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod } from '../types';
import { Printer, Download, Calendar, Edit3, Filter, Box, TrendingUp, TrendingDown, PieChart, Users, Store, User, Truck, DollarSign, Wallet, UserCheck, CheckCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

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
  
  // PRINT STATE
  const [printSection, setPrintSection] = useState<string | null>(null);
  
  const formatDate = (d: string) => d ? d.split('-').reverse().join('.') : '-';
  const formatMoney = (amount: number, currency: string = 'TL') => `${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${currency}`;

  // Geçerli Müşteri ID'lerini bir Set içinde tut (Hızlı erişim için)
  const validCustomerIds = useMemo(() => new Set(customers.map(c => c.id)), [customers]);

  // -- DATA PROCESSING --
  const activeTransactions = useMemo(() => {
      let filtered = transactions || [];
      
      // 1. Filter by Panel Mode (Store vs Accounting)
      filtered = filtered.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));

      // 2. ÖNEMLİ DÜZELTME: Sadece geçerli (silinmemiş) müşterilere ait işlemleri dahil et.
      filtered = filtered.filter(t => t.accId && validCustomerIds.has(t.accId));

      // 3. Filter by Date (Daily vs Monthly)
      if (activeTab === 'daily') {
          filtered = filtered.filter(t => t.date === selectedDate);
          // Günlük ana tabloda alış faturalarını gizle (aşağıda özel tablo var)
          filtered = filtered.filter(t => t.type !== 'purchase');
      } else {
          // FIX: Check if date exists before using startsWith
          filtered = filtered.filter(t => t.date && t.date.startsWith(selectedMonth));
      }

      // 4. Filter by Type (Sales/CashIn)
      if (filterType !== 'all') {
          filtered = filtered.filter(t => t.type === filterType);
      }
      return filtered;
  }, [transactions, activeTab, selectedDate, selectedMonth, filterType, panelMode, validCustomerIds]);
  
  const distinctCustIds = Array.from(new Set(activeTransactions.map(t => t.accId))).filter(Boolean) as number[];

  // Günlük Alış Faturaları
  const dailyPurchaseInvoices = useMemo(() => {
      if (activeTab !== 'daily') return [];
      const relevantTrans = (transactions || []).filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));
      // Alış faturalarında da tedarikçi kontrolü yapalım
      return relevantTrans.filter(t => t.date === selectedDate && t.type === 'purchase' && t.accId && validCustomerIds.has(t.accId));
  }, [transactions, activeTab, selectedDate, panelMode, validCustomerIds]);

  // Aylık Ürün Satışları (Cari Bazlı Gruplama)
  const monthlyCustomerSales = useMemo(() => {
      if (activeTab !== 'monthly') return [];
      
      const sales = activeTransactions.filter(t => t.type === 'sales');
      
      // Carilere Göre Grupla
      const groupedByCustomer: Record<number, { customerName: string, items: { name: string, qty: number, total: number }[], total: number }> = {};

      sales.forEach(sale => {
          if(!sale.accId) return;
          const custId = Number(sale.accId);
          // Müşteri ismini customers array'inden al (Garanti olsun)
          const customer = customers.find(c => c.id === custId);
          const custName = customer ? customer.name : (sale.accName || 'Bilinmeyen Cari');
          
          if (!groupedByCustomer[custId]) {
              groupedByCustomer[custId] = { customerName: custName, items: [], total: 0 };
          }
          
          groupedByCustomer[custId].total += sale.total;

          // Ürünleri ekle
          if(sale.items) {
              sale.items.forEach(item => {
                  groupedByCustomer[custId].items.push({
                      name: item.name,
                      qty: item.qty,
                      total: item.total
                  });
              });
          }
      });

      return Object.values(groupedByCustomer);

  }, [activeTransactions, activeTab, customers]);

  // --- SADECE MAĞAZA MODU: SATIŞ TEMSİLCİSİ PERFORMANSI ---
  const salesByRep = useMemo(() => {
      if (panelMode !== 'store') return [];

      const sales = activeTransactions.filter(t => t.type === 'sales');
      const grouped: Record<string, { total: number, count: number, items: Record<string, number> }> = {};

      sales.forEach(t => {
          const rep = t.salesRep || 'Belirtilmemiş';
          if (!grouped[rep]) grouped[rep] = { total: 0, count: 0, items: {} };
          
          grouped[rep].total += t.total;
          grouped[rep].count += 1;
          
          // Ürün kırılımı
          if (t.items) {
              t.items.forEach(i => {
                  if (!grouped[rep].items[i.name]) grouped[rep].items[i.name] = 0;
                  grouped[rep].items[i.name] += i.qty;
              });
          }
      });
      
      return Object.entries(grouped)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total); // Tutara göre sırala
  }, [activeTransactions, panelMode]);

  // --- GENEL TOPLAM İSTATİSTİKLERİ (Gelen/Giden Kutuları İçin) ---
  const summaryStats = useMemo(() => {
        let relevant = transactions || [];
        // Filtrele: Panel Modu
        relevant = relevant.filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));
        
        // Filtrele: Tarih (Günlük veya Aylık) - Tüm işlem tipleri dahil
        if (activeTab === 'daily') {
            relevant = relevant.filter(t => t.date === selectedDate);
        } else {
            // FIX: Check if date exists before using startsWith
            relevant = relevant.filter(t => t.date && t.date.startsWith(selectedMonth));
        }

        // Filtrele: Geçerli Müşteriler
        relevant = relevant.filter(t => t.accId && validCustomerIds.has(t.accId));

        const totals = {
            incoming: { TL: 0, USD: 0, EUR: 0 }, // Gelen (Satış + Tahsilat)
            outgoing: { TL: 0, USD: 0, EUR: 0 }  // Giden (Alış + Ödeme)
        };

        relevant.forEach(t => {
            const curr = (t.currency || 'TL') as 'TL'|'USD'|'EUR';
            
            // Gelen: Satış veya Tahsilat (Nakit Giriş)
            if (t.type === 'sales' || t.type === 'cash_in') {
                totals.incoming[curr] += t.total;
            }
            // Giden: Alış veya Ödeme (Nakit Çıkış)
            if (t.type === 'purchase' || t.type === 'cash_out') {
                totals.outgoing[curr] += t.total;
            }
        });

        return totals;
  }, [transactions, activeTab, selectedDate, selectedMonth, panelMode, validCustomerIds]);


  // --- PRINT FUNCTION ---
  const handlePrintSection = (sectionId: string) => {
      setPrintSection(sectionId);
      // Increased timeout to ensure React renders the class changes before print dialog
      setTimeout(() => {
          window.print();
          setPrintSection(null);
      }, 500);
  };
  
  // Determines if an element should be hidden during print
  const isHidden = (mySectionId: string) => {
      if (!printSection) return ''; // No specific section, show everything (or let standard print rules apply)
      return printSection !== mySectionId ? 'print:hidden' : '';
  };


  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Top Bar */}
      <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 no-print sticky top-0 z-20 ${printSection ? 'print:hidden' : ''}`}>
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
             
            <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center font-bold text-xs gap-2">
                <Printer size={16}/> Yazdır
            </button>
         </div>
      </div>

      {/* Main Report Card */}
      {/* REMOVED isHidden('main-report') from parent wrapper to allow children to be visible when parent is printing */}
      <div className={`bg-white border border-slate-200 rounded-3xl p-8 print:p-0 print:border-none shadow-xl print:shadow-none min-h-[600px] relative overflow-hidden`}>
        {/* Decorative Background for Print - Hide when printing specific sections to keep it clean */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10 opacity-50 print:opacity-100 ${isHidden('bg-decor')}`}></div>

        {/* Header - Hide when printing specific sections if desired, or keep it. Let's hide it for specific lists to save ink/space */}
        <div className={`text-center mb-12 ${isHidden('report-header')}`}>
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

        {/* Transactions Grid (DAILY VIEW) */}
        {activeTab === 'daily' && (
            <div className={`grid grid-cols-1 gap-6 ${isHidden('transactions-grid')}`}>
                 {/* Section Header with Print Button */}
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 print:hidden">
                    <h3 className="text-sm font-bold text-slate-700 uppercase">GÜNLÜK HAREKETLER</h3>
                    <button onClick={() => handlePrintSection('transactions-grid')} className="text-slate-400 hover:text-slate-700 transition-colors p-1" title="Sadece Listeyi Yazdır">
                        <Printer size={14} />
                    </button>
                 </div>

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
                                            {/* FIX: Handle missing date safely */}
                                            <div className="col-span-2 text-slate-400 font-mono">{t.date ? t.date.split('-').reverse().join('.') : '-'}</div>
                                            <div className="col-span-4 font-bold text-slate-700">
                                                {/* İsim veya Açıklama */}
                                                <div>
                                                    {t.items?.map(i => i.name).join(', ') || t.desc}
                                                    {t.invoiceNo && <span className="ml-2 text-blue-500 font-mono">#{t.invoiceNo}</span>}
                                                </div>
                                                
                                                {/* EKSTRA AÇIKLAMA (Eğer hem ürün hem açıklama varsa veya sadece açıklama ise) */}
                                                {t.desc && (
                                                    <div className="text-[10px] text-slate-500 font-medium mt-0.5 italic flex items-center gap-1">
                                                       <span className="w-1 h-1 rounded-full bg-slate-300"></span> {t.desc}
                                                    </div>
                                                )}

                                                {/* MAĞAZA MODU: SATIŞ TEMSİLCİSİ */}
                                                {panelMode === 'store' && t.salesRep && (
                                                    <div className="text-[9px] text-orange-600 uppercase font-bold mt-0.5 flex items-center gap-1">
                                                        <UserCheck size={10} /> {t.salesRep}
                                                    </div>
                                                )}
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
        )}
        
        {/* Bottom Sections: Purchase Invoices & Product Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 break-inside-avoid">
            {/* Daily Expenses */}
            {activeTab === 'daily' && dailyPurchaseInvoices.length > 0 && (
                <div className={`border border-red-100 rounded-2xl overflow-hidden bg-white ${isHidden('daily-expenses')}`}>
                    <div className="bg-red-50/50 px-6 py-3 border-b border-red-100 font-bold text-red-700 text-xs uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><Truck size={14}/> Günlük Giderler / Alışlar</div>
                        <button onClick={() => handlePrintSection('daily-expenses')} className="text-red-400 hover:text-red-700 print:hidden"><Printer size={12}/></button>
                    </div>
                    <div className="divide-y divide-red-50">
                        {dailyPurchaseInvoices.map(t => {
                            const totalQty = t.items?.reduce((sum, i) => sum + (Number(i.qty) || 0), 0) || 0;
                            return (
                                <div key={t.id} className="p-4 flex justify-between items-center text-xs">
                                    <div>
                                        <div className="font-bold text-slate-700 flex items-center gap-2">
                                            {t.accName}
                                            {t.invoiceNo && <span className="font-mono text-slate-400">#{t.invoiceNo}</span>}
                                        </div>
                                        <div className="text-slate-400 mt-0.5 flex items-center gap-2">
                                            <span>{t.items?.map(i=>i.name).join(', ')}</span>
                                            {totalQty > 0 && (
                                                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">
                                                    {totalQty} Adet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-red-600">{formatMoney(t.total, t.currency)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Monthly Customer Sales Detail */}
            {activeTab === 'monthly' && monthlyCustomerSales.length > 0 && (
                <div className={`border border-sky-100 rounded-2xl overflow-hidden bg-white lg:col-span-2 ${isHidden('monthly-sales')}`}>
                    <div className="bg-sky-50/50 px-6 py-3 border-b border-sky-100 font-bold text-sky-700 text-xs uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><Box size={14}/> Aylık Cari Bazlı Ürün Satış Listesi</div>
                        <button onClick={() => handlePrintSection('monthly-sales')} className="text-sky-400 hover:text-sky-700 print:hidden"><Printer size={12}/></button>
                    </div>
                    <div className="divide-y divide-sky-50">
                        {monthlyCustomerSales.map((custSale, idx) => (
                             <div key={idx} className="p-5">
                                 <div className="flex justify-between items-center mb-3">
                                     <div className="flex items-center gap-2">
                                         <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">{idx+1}</div>
                                         <span className="font-bold text-slate-800">{custSale.customerName}</span>
                                     </div>
                                     <div className="font-mono font-black text-slate-800 text-sm">{formatMoney(custSale.total)}</div>
                                 </div>
                                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                     <table className="w-full text-xs text-left">
                                         <thead>
                                             <tr className="text-slate-400">
                                                 <th className="pb-2 font-medium">Ürün</th>
                                                 <th className="pb-2 font-medium text-center">Adet</th>
                                                 <th className="pb-2 font-medium text-right">Tutar</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100">
                                             {custSale.items.map((item, i) => (
                                                 <tr key={i}>
                                                     <td className="py-2 text-slate-600 font-medium">{item.name}</td>
                                                     <td className="py-2 text-center text-slate-500">{item.qty}</td>
                                                     <td className="py-2 text-right text-slate-700 font-mono">{formatMoney(item.total)}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- SADECE MAĞAZA MODU: SATIŞ TEMSİLCİSİ PERFORMANSI --- */}
        {panelMode === 'store' && salesByRep.length > 0 && (
            <div className={`mt-12 break-inside-avoid ${isHidden('sales-rep')}`}>
                 <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-orange-50/50 px-6 py-4 border-b border-orange-100 font-bold text-orange-700 text-sm uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><UserCheck size={16}/> Satış Temsilcisi Performansı ({activeTab === 'daily' ? 'Günlük' : 'Aylık'})</div>
                        <button onClick={() => handlePrintSection('sales-rep')} className="text-orange-400 hover:text-orange-700 print:hidden"><Printer size={14}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {salesByRep.map((rep, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            {rep.name}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">{rep.count} İşlem</div>
                                    </div>
                                    <div className="text-lg font-black text-slate-800 font-mono">
                                        {formatMoney(rep.total)}
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Satılan Ürünler</h4>
                                    <ul className="space-y-1">
                                        {Object.entries(rep.items).map(([prodName, qty], i) => (
                                            <li key={i} className="flex justify-between text-xs text-slate-600">
                                                <span className="truncate pr-2">{prodName}</span>
                                                <span className="font-bold">{qty} Adet</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        )}
        
        {/* --- YENİ: Gelen ve Giden Ödeme Toplamları (ÖZET KUTULARI) --- */}
        <div className={`mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid print:break-inside-avoid ${isHidden('summary-boxes')}`}>
            
            {/* GELEN ÖDEME TOPLAMLARI (YEŞİL KUTU) */}
            <div className="border-[3px] border-green-400 rounded-3xl p-6 bg-white relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0"></div>
                <div className="relative z-10">
                    <h3 className="text-green-700 font-black uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                        <ArrowDownLeft size={20} className="stroke-[3px]" /> Gelen Ödeme Toplamları
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-green-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">Türk Lirası (TL)</span>
                            <span className="text-2xl font-black text-slate-800 font-mono">{formatMoney(summaryStats.incoming.TL, 'TL')}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-green-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">ABD Doları (USD)</span>
                            <span className="text-xl font-black text-green-700 font-mono">{formatMoney(summaryStats.incoming.USD, 'USD')}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-500">Euro (EUR)</span>
                            <span className="text-xl font-black text-blue-700 font-mono">{formatMoney(summaryStats.incoming.EUR, 'EUR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* GİDEN ÖDEME TOPLAMLARI (KIRMIZI KUTU) */}
            <div className="border-[3px] border-red-400 rounded-3xl p-6 bg-white relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0"></div>
                <div className="relative z-10">
                    <h3 className="text-red-700 font-black uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                        <ArrowUpRight size={20} className="stroke-[3px]" /> Giden Ödeme Toplamları
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-red-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">Türk Lirası (TL)</span>
                            <span className="text-2xl font-black text-slate-800 font-mono">{formatMoney(summaryStats.outgoing.TL, 'TL')}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-red-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">ABD Doları (USD)</span>
                            <span className="text-xl font-black text-green-700 font-mono">{formatMoney(summaryStats.outgoing.USD, 'USD')}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-500">Euro (EUR)</span>
                            <span className="text-xl font-black text-blue-700 font-mono">{formatMoney(summaryStats.outgoing.EUR, 'EUR')}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};
