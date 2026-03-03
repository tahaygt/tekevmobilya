
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, PaymentMethod, Product } from '../types';
import { Printer, Download, Calendar, Edit3, Filter, Box, TrendingUp, TrendingDown, PieChart, Users, Store, User, Truck, DollarSign, Wallet, UserCheck, CheckCircle, ArrowDownLeft, ArrowUpRight, FileSpreadsheet } from 'lucide-react';

interface DailyReportProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  panelMode?: 'accounting' | 'store';
}

export const DailyReport: React.FC<DailyReportProps> = ({ transactions, customers, products, panelMode = 'accounting' }) => {
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
  
  // 1. All Transactions relevant to this Panel (Store or Accounting)
  const allPanelTransactions = useMemo(() => {
      return (transactions || []).filter(t => (t.section === panelMode || (!t.section && panelMode === 'accounting')));
  }, [transactions, panelMode]);

  // 2. Active Transactions (Filtered by Date & Type for the LIST view)
  const activeTransactions = useMemo(() => {
      let filtered = allPanelTransactions;

      // Filter by Customer Validity
      filtered = filtered.filter(t => t.accId && validCustomerIds.has(t.accId));

      // Filter by Date (Daily vs Monthly)
      if (activeTab === 'daily') {
          filtered = filtered.filter(t => t.date === selectedDate);
          // Günlük ana tabloda alış faturalarını gizle (aşağıda özel tablo var)
          filtered = filtered.filter(t => t.type !== 'purchase');
      } else {
          filtered = filtered.filter(t => t.date && t.date.startsWith(selectedMonth));
      }

      // Filter by Type (Sales/CashIn)
      if (filterType !== 'all') {
          filtered = filtered.filter(t => t.type === filterType);
      }
      return filtered;
  }, [allPanelTransactions, activeTab, selectedDate, selectedMonth, filterType, validCustomerIds]);
  
  const distinctCustIds = Array.from(new Set(activeTransactions.map(t => t.accId))).filter(Boolean) as number[];

  // 3. Helper to Calculate Balance
  const calculateBalance = (transList: Transaction[]) => {
      const balance = { TL: 0, USD: 0, EUR: 0 };
      transList.forEach(t => {
          const isDebt = t.type === 'sales' || t.type === 'cash_out';
          const isCredit = t.type === 'purchase' || t.type === 'cash_in';
          const curr = (t.currency || 'TL') as 'TL'|'USD'|'EUR';
          
          if(curr === 'TL' || curr === 'USD' || curr === 'EUR') {
              if (isDebt) balance[curr] += t.total;
              else if (isCredit) balance[curr] -= t.total;
          }
      });
      return balance;
  };

  // Günlük Alış Faturaları
  const dailyPurchaseInvoices = useMemo(() => {
      if (activeTab !== 'daily') return [];
      return allPanelTransactions.filter(t => t.date === selectedDate && t.type === 'purchase' && t.accId && validCustomerIds.has(t.accId));
  }, [allPanelTransactions, activeTab, selectedDate, validCustomerIds]);

  // Aylık Ürün Satışları (Cari veya Şube Bazlı Gruplama)
  const monthlyGroupedSales = useMemo(() => {
      if (activeTab !== 'monthly') return [];
      
      const sales = activeTransactions.filter(t => t.type === 'sales');
      
      const groupedData: Record<number, { name: string, items: { name: string, qty: number, total: number }[], total: number }> = {};

      sales.forEach(sale => {
          let groupId: number | undefined;
          let groupName: string = 'Bilinmeyen';

          if (panelMode === 'store') {
              if (sale.branchId) {
                  groupId = sale.branchId;
                  const branch = customers.find(c => c.id === groupId);
                  groupName = branch ? branch.name : 'Bilinmeyen Şube';
              }
          } else {
              if (sale.accId) {
                  groupId = Number(sale.accId);
                  const customer = customers.find(c => c.id === groupId);
                  groupName = customer ? customer.name : (sale.accName || 'Bilinmeyen Cari');
              }
          }

          if (!groupId) return;

          if (!groupedData[groupId]) {
              groupedData[groupId] = { name: groupName, items: [], total: 0 };
          }
          
          groupedData[groupId].total += sale.total;

          if(Array.isArray(sale.items)) {
              sale.items.forEach(item => {
                  const existingItem = groupedData[groupId!].items.find(i => i.name === item.name);
                  if (existingItem) {
                      existingItem.qty += Number(item.qty) || 0;
                      existingItem.total += Number(item.total) || 0;
                  } else {
                      groupedData[groupId!].items.push({
                          name: item.name,
                          qty: Number(item.qty) || 0,
                          total: Number(item.total) || 0
                      });
                  }
              });
          }
      });

      return Object.values(groupedData);

  }, [activeTransactions, activeTab, customers, panelMode]);

  // Aylık Toplam Ürün Çıkışları (Muhasebe Modu İçin)
  const monthlyProductSales = useMemo(() => {
      if (activeTab !== 'monthly' || panelMode !== 'accounting') return [];
      
      const sales = activeTransactions.filter(t => t.type === 'sales');
      const productTotals: Record<string, { qty: number, total: number }> = {};

      sales.forEach(sale => {
          if(Array.isArray(sale.items)) {
              sale.items.forEach(item => {
                  if (!productTotals[item.name]) {
                      productTotals[item.name] = { qty: 0, total: 0 };
                  }
                  productTotals[item.name].qty += Number(item.qty) || 0;
                  productTotals[item.name].total += Number(item.total) || 0;
              });
          }
      });

      return Object.entries(productTotals).map(([name, data]) => ({
          name,
          qty: data.qty,
          total: data.total
      })).sort((a, b) => b.qty - a.qty);
  }, [activeTransactions, activeTab, panelMode]);

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
          if (Array.isArray(t.items)) {
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
        let relevant = allPanelTransactions;
        
        // Filtrele: Tarih (Günlük veya Aylık) - Tüm işlem tipleri dahil
        if (activeTab === 'daily') {
            relevant = relevant.filter(t => t.date === selectedDate);
        } else {
            relevant = relevant.filter(t => t.date && t.date.startsWith(selectedMonth));
        }

        // Filtrele: Geçerli Müşteriler
        relevant = relevant.filter(t => t.accId && validCustomerIds.has(t.accId));

        const totals = {
            incoming: { TL: 0, USD: 0, EUR: 0 }, // Gelen (Satış + Tahsilat)
            outgoing: { TL: 0, USD: 0, EUR: 0 },  // Giden (Alış + Ödeme)
            incomingMethods: { nakit: 0, kredi_karti: 0, havale: 0, virman: 0 },
            outgoingMethods: { nakit: 0, kredi_karti: 0, havale: 0, virman: 0 }
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

            // Sadece TL ödemeleri için yöntem kırılımı (veya tüm kurları TL'ye çevirmeden sadece TL'leri toplayalım)
            if (t.type === 'cash_in' && curr === 'TL') {
                const method = t.method || 'nakit';
                if (totals.incomingMethods[method as keyof typeof totals.incomingMethods] !== undefined) {
                    totals.incomingMethods[method as keyof typeof totals.incomingMethods] += t.total;
                } else {
                    totals.incomingMethods.nakit += t.total;
                }
            }
            if (t.type === 'cash_out' && curr === 'TL') {
                const method = t.method || 'nakit';
                if (totals.outgoingMethods[method as keyof typeof totals.outgoingMethods] !== undefined) {
                    totals.outgoingMethods[method as keyof typeof totals.outgoingMethods] += t.total;
                } else {
                    totals.outgoingMethods.nakit += t.total;
                }
            }
        });

        return totals;
  }, [allPanelTransactions, activeTab, selectedDate, selectedMonth, validCustomerIds]);

  // --- GÜNLÜK ÖDEME LİSTESİ ---
  const dailyPaymentsList = useMemo(() => {
      if (activeTab !== 'daily') return { incoming: [], outgoing: [] };
      
      const dailyTrans = allPanelTransactions.filter(t => t.date === selectedDate && t.accId && validCustomerIds.has(t.accId));
      
      return {
          incoming: dailyTrans.filter(t => t.type === 'cash_in'),
          outgoing: dailyTrans.filter(t => t.type === 'cash_out')
      };
  }, [allPanelTransactions, activeTab, selectedDate, validCustomerIds]);

  // --- PRINT FUNCTION ---
  const handlePrintSection = (sectionId: string) => {
      setPrintSection(sectionId);
      setTimeout(() => {
          window.print();
          setPrintSection(null);
      }, 500);
  };
  
  const isHidden = (mySectionId: string) => {
      if (!printSection) return ''; 
      return printSection !== mySectionId ? 'print:hidden' : '';
  };

  // --- EXCEL EXPORT ---
  const handleExportExcel = () => {
      let csvContent = "\uFEFF"; 
      csvContent += `Rapor Türü:;${activeTab === 'daily' ? 'Günlük' : 'Aylık'}\n`;
      csvContent += `Tarih:;${activeTab === 'daily' ? selectedDate : selectedMonth}\n\n`;
      csvContent += "Tarih;Müşteri/Cari;İşlem Türü;Açıklama;Tutar;Para Birimi\n";

      activeTransactions.forEach(t => {
          const accName = customers.find(c => c.id === t.accId)?.name || t.accName || '-';
          const typeStr = t.type === 'sales' ? 'Satış' : t.type === 'cash_in' ? 'Tahsilat' : t.type === 'purchase' ? 'Alış' : 'Ödeme';
          const amountStr = t.total.toString().replace('.', ',');
          csvContent += `${t.date};${accName};${typeStr};${t.desc || ''};${amountStr};${t.currency}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Rapor_${activeTab}_${activeTab === 'daily' ? selectedDate : selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
             
            <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center font-bold text-xs gap-2">
                <FileSpreadsheet size={16}/> Excel
            </button>

            <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center font-bold text-xs gap-2">
                <Printer size={16}/> Yazdır
            </button>
         </div>
      </div>

      {/* Main Report Card */}
      <div className={`rounded-3xl p-8 print:p-0 print:border-none min-h-[600px] relative`}>
        {/* Header - Only visible on print to save space */}
        <div className={`text-center mb-12 hidden print:block ${isHidden('report-header')}`}>
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
                {distinctCustIds.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Bu tarih için kayıt bulunamadı.
                    </div>
                ) : (
                    distinctCustIds.map(custId => {
                        const cust = customers.find(c => c.id === custId);
                        if(!cust) return null;
                        
                        // 1. Customer's transactions for this period
                        const custTrans = activeTransactions.filter(t => t.accId === custId);
                        
                        // 2. Calculate "Old Balance" (Before this period)
                        const historyTransactions = allPanelTransactions.filter(t => {
                            if (!t.accId || t.accId !== custId) return false;
                            
                            // Check date
                            if (activeTab === 'daily') {
                                return new Date(t.date) < new Date(selectedDate);
                            } else {
                                // For monthly, check if date is strictly before the month start
                                const tDate = new Date(t.date);
                                const mDate = new Date(selectedMonth + "-01");
                                return tDate < mDate;
                            }
                        });
                        const oldBalances = calculateBalance(historyTransactions);
                        
                        // 3. Calculate "Current Period Balance Change"
                        const periodBalances = calculateBalance(custTrans);

                        // 4. Calculate Final Display Balance (Old + Period)
                        const finalBalance = {
                            TL: oldBalances.TL + periodBalances.TL,
                            USD: oldBalances.USD + periodBalances.USD,
                            EUR: oldBalances.EUR + periodBalances.EUR
                        };

                        // Determine primary currency for display (based on transaction currency or default to TL)
                        // Note: If multiple currencies are used, this simplifies to just showing non-zero ones or TL.
                        const displayCurrency = custTrans.length > 0 ? custTrans[0].currency : 'TL';
                        const oldBalAmount = oldBalances[displayCurrency as keyof typeof oldBalances];
                        const finalBalAmount = finalBalance[displayCurrency as keyof typeof finalBalance];
                        const isFinalDebt = finalBalAmount > 0;
                        const finalBalLabel = isFinalDebt ? 'BORÇLU' : (finalBalAmount < 0 ? 'ALACAKLI' : '-');

                        return (
                            <div key={custId} className="break-inside-avoid bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* CARD HEADER */}
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                        <div className="font-black text-slate-800 text-base uppercase tracking-wide">
                                            {cust.name}
                                        </div>
                                    </div>
                                    <div className="text-right border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Eski Bakiye</div>
                                        <div className="font-mono font-bold text-slate-600 text-sm">
                                            {formatMoney(oldBalAmount, displayCurrency)}
                                        </div>
                                    </div>
                                </div>

                                {/* TRANSACTIONS LIST */}
                                <div className="divide-y divide-slate-50">
                                    {custTrans.map(t => {
                                        let shippingCost = 0;
                                        let productCost = 0;
                                        if (t.type === 'sales' && Array.isArray(t.items)) {
                                            t.items.forEach(item => {
                                                const product = products.find(p => p.name === item.name);
                                                if (product) {
                                                    shippingCost += (product.shippingCost || 0) * item.qty;
                                                    productCost += (product.purchasePrice || 0) * item.qty;
                                                }
                                            });
                                        }

                                        return (
                                        <div key={t.id} className="grid grid-cols-12 gap-2 px-6 py-5 text-sm items-center hover:bg-slate-50/50">
                                            <div className="col-span-2 text-slate-400 font-mono font-medium text-xs">
                                                {t.date ? t.date.split('-').reverse().join('.') : '-'}
                                            </div>
                                            
                                            <div className="col-span-3 font-bold text-slate-800 uppercase tracking-tight truncate">
                                                {/* İsim veya Açıklama (TURUNCU ALAN - Adet Eklendi) */}
                                                <div className="truncate" title={Array.isArray(t.items) ? t.items.map(i => `${i.qty} ${i.name}`).join(', ') : t.desc}>
                                                    {Array.isArray(t.items) ? t.items.map(i => `${i.qty} ${i.name}`).join(', ') : t.desc}
                                                    {t.invoiceNo && <span className="ml-2 text-slate-400 font-mono text-xs normal-case">#{t.invoiceNo}</span>}
                                                </div>
                                                
                                                {/* EKSTRA AÇIKLAMA */}
                                                {(t.desc || (Array.isArray(t.items) && t.items.some(i => i.description))) && (
                                                    <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1 normal-case truncate">
                                                       <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span> 
                                                       {t.desc || t.items?.map(i => i.description).join(', ')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* MAVİ ALAN: SEVKİYAT ÜCRETİ */}
                                            <div className="col-span-2 text-center">
                                                {shippingCost > 0 && (
                                                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-mono font-bold inline-block">
                                                        SEVK: {formatMoney(shippingCost, 'TL')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-span-1 text-center">
                                                <span className={`px-1.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider whitespace-nowrap
                                                    ${t.type === 'sales' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                                    t.type === 'cash_in' ? 'bg-green-50 text-green-600 border border-green-100' : 
                                                    t.type === 'cash_out' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    'bg-slate-100 text-slate-500 border border-slate-200'}
                                                `}>
                                                    {t.type === 'sales' ? 'Satış' : t.type === 'cash_in' ? 'Tahsilat' : t.type === 'cash_out' ? 'Ödeme' : 'Alış'}
                                                </span>
                                            </div>

                                            {/* KIRMIZI ALAN: ÜRÜN MALİYETİ */}
                                            <div className="col-span-2 text-center">
                                                {productCost > 0 && (
                                                    <div className="bg-red-50 border border-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-mono font-bold inline-block">
                                                        MAL: {formatMoney(productCost, 'TL')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* YEŞİL ALAN (FATURA TUTARI) */}
                                            <div className="col-span-2 text-right font-mono font-black text-slate-900 text-base">
                                                {formatMoney(t.total, t.currency)}
                                            </div>
                                        </div>
                                    )})}
                                </div>

                                {/* CARD FOOTER (MAVİ ALAN - GÜNCEL BAKİYE) */}
                                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end items-center">
                                    <div className="text-right border-2 border-slate-200 bg-white px-4 py-2 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Güncel Tutar</span>
                                            <span className={`font-mono font-black text-xl ${isFinalDebt ? 'text-red-600' : finalBalAmount < 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                                {formatMoney(finalBalAmount, displayCurrency)}
                                            </span>
                                            {finalBalAmount !== 0 && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isFinalDebt ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {finalBalLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
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
                <div className={`border border-red-100 rounded-2xl overflow-hidden bg-white shadow-sm ${isHidden('daily-expenses')}`}>
                    <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 font-bold text-red-700 text-xs uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><Truck size={14}/> Günlük Giderler / Alışlar</div>
                        <button onClick={() => handlePrintSection('daily-expenses')} className="text-red-400 hover:text-red-700 print:hidden"><Printer size={14}/></button>
                    </div>
                    <div className="divide-y divide-red-50">
                        {dailyPurchaseInvoices.map(t => {
                            const totalQty = Array.isArray(t.items) ? t.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0) : 0;
                            
                            // Calculate supplier balance up to selectedDate
                            const supplierTrans = allPanelTransactions.filter(tr => 
                                tr.accId === t.accId && new Date(tr.date) <= new Date(selectedDate)
                            );
                            const supplierBal = calculateBalance(supplierTrans);
                            const balAmount = supplierBal[t.currency as keyof typeof supplierBal] || 0;
                            const isDebt = balAmount > 0;
                            const balLabel = isDebt ? 'BORÇLU' : (balAmount < 0 ? 'ALACAKLI' : '');

                            return (
                                <div key={t.id} className="p-4 flex justify-between items-center text-xs hover:bg-red-50/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-700 flex items-center gap-2 uppercase">
                                            {t.accName}
                                            {t.invoiceNo && <span className="font-mono text-slate-400 normal-case">#{t.invoiceNo}</span>}
                                        </div>
                                        <div className="text-slate-400 mt-1 flex items-center gap-2">
                                            <span>{Array.isArray(t.items) ? t.items.map(i=>i.name).join(', ') : t.desc}</span>
                                            {totalQty > 0 && (
                                                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">
                                                    {totalQty} Adet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Tutar</div>
                                            <div className="font-mono font-bold text-red-600 text-sm">{formatMoney(t.total, t.currency)}</div>
                                        </div>
                                        {t.accId && (
                                            <div className="text-right border-l border-red-100 pl-4">
                                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Kalan Bakiye</div>
                                                <div className={`font-mono font-bold text-sm ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatMoney(Math.abs(balAmount), t.currency)} {balLabel}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Monthly Customer/Branch Sales Detail */}
            {activeTab === 'monthly' && monthlyGroupedSales.length > 0 && (
                <div className={`border border-sky-100 rounded-2xl overflow-hidden bg-white lg:col-span-2 shadow-sm ${isHidden('monthly-sales')}`}>
                    <div className="bg-sky-50/50 px-6 py-4 border-b border-sky-100 font-bold text-sky-700 text-xs uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><Box size={14}/> Aylık {panelMode === 'store' ? 'Şube' : 'Cari'} Bazlı Ürün Satış Listesi</div>
                        <button onClick={() => handlePrintSection('monthly-sales')} className="text-sky-400 hover:text-sky-700 print:hidden"><Printer size={14}/></button>
                    </div>
                    <div className="divide-y divide-sky-50">
                        {monthlyGroupedSales.map((group, idx) => (
                             <div key={idx} className="p-5 hover:bg-sky-50/10 transition-colors">
                                 <div className="flex justify-between items-center mb-3">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">{idx+1}</div>
                                         <span className="font-bold text-slate-800 uppercase">{group.name}</span>
                                     </div>
                                     <div className="font-mono font-black text-slate-800 text-sm">{formatMoney(group.total)}</div>
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
                                             {group.items.map((item, i) => (
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

            {/* Monthly Total Product Sales (Accounting Mode) */}
            {activeTab === 'monthly' && panelMode === 'accounting' && monthlyProductSales.length > 0 && (
                <div className={`border border-indigo-100 rounded-2xl overflow-hidden bg-white lg:col-span-2 shadow-sm mt-8 ${isHidden('monthly-product-sales')}`}>
                    <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 font-bold text-indigo-700 text-xs uppercase flex items-center justify-between">
                        <div className="flex items-center gap-2"><Box size={14}/> Aylık Toplam Ürün Çıkışları</div>
                        <button onClick={() => handlePrintSection('monthly-product-sales')} className="text-indigo-400 hover:text-indigo-700 print:hidden"><Printer size={14}/></button>
                    </div>
                    <div className="p-5">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="text-slate-400">
                                        <th className="pb-2 font-medium">Ürün Adı</th>
                                        <th className="pb-2 font-medium text-center">Toplam Adet</th>
                                        <th className="pb-2 font-medium text-right">Toplam Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {monthlyProductSales.map((item, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="py-2 text-slate-700 font-bold">{item.name}</td>
                                            <td className="py-2 text-center text-slate-600 font-medium">{item.qty}</td>
                                            <td className="py-2 text-right text-indigo-700 font-mono font-bold">{formatMoney(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                        <div className="flex justify-between items-end border-b border-green-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">Euro (EUR)</span>
                            <span className="text-xl font-black text-blue-700 font-mono">{formatMoney(summaryStats.incoming.EUR, 'EUR')}</span>
                        </div>
                    </div>

                    {/* MAVİ ALAN: ÖDEME YÖNTEMLERİ (Sadece TL) */}
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-3 flex items-center gap-1">
                            <Wallet size={12} /> Ödeme Yöntemleri (TL)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Nakit:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.incomingMethods.nakit, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">K.Kartı:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.incomingMethods.kredi_karti, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Havale:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.incomingMethods.havale, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Virman:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.incomingMethods.virman, 'TL')}</span>
                            </div>
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
                        <div className="flex justify-between items-end border-b border-red-100 pb-2">
                            <span className="text-sm font-bold text-slate-500">Euro (EUR)</span>
                            <span className="text-xl font-black text-blue-700 font-mono">{formatMoney(summaryStats.outgoing.EUR, 'EUR')}</span>
                        </div>
                    </div>

                    {/* MAVİ ALAN: ÖDEME YÖNTEMLERİ (Sadece TL) */}
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-3 flex items-center gap-1">
                            <Wallet size={12} /> Ödeme Yöntemleri (TL)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Nakit:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.outgoingMethods.nakit, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">K.Kartı:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.outgoingMethods.kredi_karti, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Havale:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.outgoingMethods.havale, 'TL')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600">Virman:</span>
                                <span className="font-bold text-slate-800 font-mono">{formatMoney(summaryStats.outgoingMethods.virman, 'TL')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* GÜNLÜK ÖDEME LİSTESİ (Gelen ve Giden İşlemler) */}
        {activeTab === 'daily' && (dailyPaymentsList.incoming.length > 0 || dailyPaymentsList.outgoing.length > 0) && (
            <div className={`mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 break-inside-avoid print:break-inside-avoid ${isHidden('daily-payments-list')}`}>
                
                {/* Gelen Ödemeler Listesi */}
                {dailyPaymentsList.incoming.length > 0 && (
                    <div className="border border-green-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-green-50/50 px-6 py-4 border-b border-green-100 font-bold text-green-700 text-xs uppercase flex items-center justify-between">
                            <div className="flex items-center gap-2"><ArrowDownLeft size={14}/> Günlük Gelen Ödemeler</div>
                            <button onClick={() => handlePrintSection('daily-payments-list')} className="text-green-400 hover:text-green-700 print:hidden"><Printer size={14}/></button>
                        </div>
                        <div className="divide-y divide-green-50">
                            {dailyPaymentsList.incoming.map(t => (
                                <div key={t.id} className="p-4 flex justify-between items-center text-xs hover:bg-green-50/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-700 flex items-center gap-2 uppercase">
                                            {t.accName}
                                        </div>
                                        <div className="text-slate-400 mt-1 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase border border-blue-100">
                                                {t.method === 'kredi_karti' ? 'K.Kartı' : t.method || 'Nakit'}
                                            </span>
                                            {t.desc && <span>{t.desc}</span>}
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-green-600 text-sm">{formatMoney(t.total, t.currency)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Giden Ödemeler Listesi */}
                {dailyPaymentsList.outgoing.length > 0 && (
                    <div className="border border-red-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 font-bold text-red-700 text-xs uppercase flex items-center justify-between">
                            <div className="flex items-center gap-2"><ArrowUpRight size={14}/> Günlük Giden Ödemeler</div>
                            <button onClick={() => handlePrintSection('daily-payments-list')} className="text-red-400 hover:text-red-700 print:hidden"><Printer size={14}/></button>
                        </div>
                        <div className="divide-y divide-red-50">
                            {dailyPaymentsList.outgoing.map(t => (
                                <div key={t.id} className="p-4 flex justify-between items-center text-xs hover:bg-red-50/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-700 flex items-center gap-2 uppercase">
                                            {t.accName}
                                        </div>
                                        <div className="text-slate-400 mt-1 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase border border-blue-100">
                                                {t.method === 'kredi_karti' ? 'K.Kartı' : t.method || 'Nakit'}
                                            </span>
                                            {t.desc && <span>{t.desc}</span>}
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-red-600 text-sm">{formatMoney(t.total, t.currency)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        
      </div>
    </div>
  );
};
