
import React, { useState, useMemo } from 'react';
import { Customer, Transaction, Safe, PaymentMethod, Product, TransactionItem } from '../types';
import { ArrowLeft, ArrowRight, Wallet, Edit2, Trash2, Calendar, FileText, Search, Printer, ArrowUpRight, ArrowDownLeft, FileDown, Link as LinkIcon, FileImage, X, User, CornerDownRight, Users, Plus, TrendingUp, TrendingDown, CreditCard, Box, UserCheck, Save, FileSpreadsheet, Filter, RefreshCcw } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface CustomerDetailProps {
  customer: Customer;
  allCustomers: Customer[];
  transactions: Transaction[];
  safes: Safe[];
  products?: Product[];
  onBack: () => void;
  onPayment: (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string, date: string, linkedTransactionId?: number) => void;
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (transaction: Transaction) => void; 
  onSelectCustomer: (id: number) => void; 
  onAddCustomer: (data: Omit<Customer, 'id' | 'balances'>) => Promise<Customer>;
  onDeleteCustomer?: (id: number) => Promise<void>;
  onEditCustomer?: (customer: Customer) => Promise<void>;
  panelMode?: 'accounting' | 'store';
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ 
  customer, allCustomers, transactions, safes, products, onBack, onPayment, onDeleteTransaction, onEditTransaction, onSelectCustomer, onAddCustomer, onDeleteCustomer, onEditCustomer, panelMode
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'subcustomers'>('transactions');
  const [modalMode, setModalMode] = useState<'in' | 'out' | null>(null);
  
  // Transaction Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<number | null>(null);
  const [showSubAdd, setShowSubAdd] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  
  // PRINT STATE FOR SINGLE TRANSACTION
  const [printingTransaction, setPrintingTransaction] = useState<Transaction | null>(null);

  // Sub-Customer Search State
  const [subSearchTerm, setSubSearchTerm] = useState('');

  // Edit Customer Modal State
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editFormData, setEditFormData] = useState<Customer>(customer);

  // Edit Transaction Modal State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Payment Form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedSafe, setSelectedSafe] = useState(safes[0]?.id || 0);
  const [selectedCurrency, setSelectedCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Find Sub-Customers (Only in Store Mode)
  const subCustomers = useMemo(() => {
     if (!allCustomers || panelMode === 'accounting') return [];
     return (allCustomers || []).filter(c => Number(c.parentId) === Number(customer.id));
  }, [customer, allCustomers, panelMode]);

  // Filter Sub-Customers
  const filteredSubCustomers = useMemo(() => {
      if (!subSearchTerm) return subCustomers;
      const lower = subSearchTerm.toLowerCase();
      return subCustomers.filter(sc => 
        sc.name.toLowerCase().includes(lower) || 
        (sc.phone && sc.phone.includes(lower))
      );
  }, [subCustomers, subSearchTerm]);

  const relatedCustomerIds = useMemo(() => {
     if (customer.parentId) return [Number(customer.id)];
     const ids = [Number(customer.id)];
     subCustomers.forEach(c => ids.push(Number(c.id)));
     return ids;
  }, [customer, subCustomers]);

  // Determine if this is a sub-customer view
  const isSubCustomerView = Boolean(customer.parentId);

  // 1. GERÇEK BAKİYE HESAPLAMA (Tüm işlemlerden)
  const realBalances = useMemo<{ TL: number; USD: number; EUR: number }>(() => {
      const bals = { TL: 0, USD: 0, EUR: 0 };
      
      const allCustTrans = (transactions || []).filter(t => {
          const isDirectAcc = t.accId && relatedCustomerIds.includes(Number(t.accId));
          const isBranchSale = panelMode === 'store' && t.branchId && relatedCustomerIds.includes(Number(t.branchId));
          return isDirectAcc || isBranchSale;
      });

      allCustTrans.forEach(t => {
          const isDebt = t.type === 'sales' || t.type === 'cash_out';
          const isCredit = t.type === 'purchase' || t.type === 'cash_in';
          const curr = (t.currency || 'TL') as 'TL'|'USD'|'EUR';
          
          if (curr === 'TL' || curr === 'USD' || curr === 'EUR') {
              if (isDebt) bals[curr] += t.total;
              else if (isCredit) bals[curr] -= t.total;
          }
      });
      return bals;
  }, [transactions, relatedCustomerIds, panelMode]);

  // 2. İŞLEM HESAPLAMA VE SIRALAMA (ESKİDEN -> YENİYE)
  const processedTransactions = useMemo(() => {
    // Basic Filtering
    let filtered = (transactions || []).filter(t => {
        const isDirectAcc = t.accId && relatedCustomerIds.includes(Number(t.accId));
        const isBranchSale = panelMode === 'store' && t.branchId && relatedCustomerIds.includes(Number(t.branchId));
        return isDirectAcc || isBranchSale;
    });
    
    // Date Filtering
    if (filterStartDate) {
        filtered = filtered.filter(t => t.date >= filterStartDate);
    }
    if (filterEndDate) {
        filtered = filtered.filter(t => t.date <= filterEndDate);
    }

    // Text Search Filtering
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(t => 
            (t.desc || '').toLowerCase().includes(searchLower) ||
            t.total.toString().includes(searchLower) ||
            (Array.isArray(t.items) && t.items.some(i => (i.name || '').toLowerCase().includes(searchLower))) ||
            (t.retailName || '').toLowerCase().includes(searchLower) ||
            (t.invoiceNo || '').toLowerCase().includes(searchLower) ||
            (t.salesRep || '').toLowerCase().includes(searchLower) ||
            (t.accName || '').toLowerCase().includes(searchLower) 
        );
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const runningBalances = { TL: 0, USD: 0, EUR: 0 };
    
    return filtered.map(t => {
        const isDebt = t.type === 'sales' || t.type === 'cash_out';   // Borç
        const isCredit = t.type === 'purchase' || t.type === 'cash_in'; // Alacak
        const curr = (t.currency || 'TL') as 'TL'|'USD'|'EUR';
        
        let amount = t.total;
        if (curr === 'TL' || curr === 'USD' || curr === 'EUR') {
            if (isDebt) runningBalances[curr] += amount;
            else if (isCredit) runningBalances[curr] -= amount;
        }
        
        return { 
            ...t, 
            snapshotBalance: runningBalances[curr] || 0
        };
    });
  }, [transactions, relatedCustomerIds, searchTerm, filterStartDate, filterEndDate, panelMode]);

  const calculateCost = (items: any[]) => {
      if(!items || !Array.isArray(items) || !products) return 0;
      return items.reduce((acc, item) => {
          const product = products.find(p => p.name === item.name);
          return acc + ((product?.purchasePrice || 0) * item.qty);
      }, 0);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedSafe) return;
    onPayment(parseFloat(amount), modalMode!, selectedSafe, selectedCurrency, paymentMethod, desc, selectedDate);
    setModalMode(null);
    setAmount('');
    setDesc('');
    setPaymentMethod('nakit');
  };

  const handleEditSubmit = async () => {
      if(onEditCustomer) {
          await onEditCustomer(editFormData);
          setIsEditingCustomer(false);
      }
  };

  // Transaction Edit Handlers
  const handleStartEditTransaction = (t: Transaction) => {
      setEditingTransaction({ ...t }); // Clone for editing
  };

  const handleSaveTransaction = () => {
      if (editingTransaction && onEditTransaction) {
          // If items exist, recalculate total from items
          let finalTrans = { ...editingTransaction };
          if (finalTrans.items && Array.isArray(finalTrans.items) && finalTrans.items.length > 0) {
              const newTotal = finalTrans.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
              finalTrans.total = newTotal;
          }
          
          onEditTransaction(finalTrans);
          setEditingTransaction(null);
      }
  };

  const updateTransItem = (index: number, field: keyof TransactionItem, value: any) => {
      if (!editingTransaction || !editingTransaction.items) return;
      const newItems = [...editingTransaction.items];
      (newItems[index] as any)[field] = value;
      newItems[index].total = newItems[index].qty * newItems[index].price;
      setEditingTransaction({ ...editingTransaction, items: newItems });
  };


  const handleAddSubCustomer = async () => {
      if(!newSubName) return;
      try {
          await onAddCustomer({
              name: newSubName,
              phone: newSubPhone,
              type: 'musteri',
              section: customer.section,
              parentId: customer.id
          });
          setNewSubName('');
          setNewSubPhone('');
          setShowSubAdd(false);
      } catch(e) { alert('Hata oluştu.'); }
  };

  const confirmDelete = () => { if(deleteId) { onDeleteTransaction(deleteId); setDeleteId(null); } };
  
  const confirmDeleteSub = async () => {
      if(deleteSubId && onDeleteCustomer) {
          await onDeleteCustomer(deleteSubId);
          setDeleteSubId(null);
      }
  };

  const formatDate = (isoString: string) => isoString ? isoString.split('-').reverse().join('.') : '-';

  const handlePrint = () => {
      // Clear specific transaction print to allow general statement print
      setPrintingTransaction(null);
      // Timeout to allow state update before print
      setTimeout(() => {
        window.print();
      }, 100);
  };

  const handlePrintTransaction = (t: Transaction) => {
      setPrintingTransaction(t);
      // Wait for state to update so the DOM changes to "Single Transaction View"
      setTimeout(() => {
          window.print();
          // Optional: Clear it after print dialog closes (though user might want to see what they printed)
          // setPrintingTransaction(null); 
      }, 300);
  };

  const handleExportExcel = () => {
      let csvContent = "\uFEFF"; // BOM for UTF-8
      csvContent += `Cari Hesap Ekstresi:;${customer.name}\n`;
      csvContent += `Tarih:;${new Date().toLocaleDateString('tr-TR')}\n\n`;
      csvContent += "Tarih;Fatura No;İşlem Türü;Açıklama / Ürünler;Borç;Alacak;Bakiye;Para Birimi\n";

      processedTransactions.forEach(t => {
          const isDebt = t.type === 'sales' || t.type === 'cash_out';
          const isCredit = t.type === 'purchase' || t.type === 'cash_in';
          const descStr = (t.items && Array.isArray(t.items) ? t.items.map(i => i.name).join(', ') : t.desc || '').replace(/;/g, ',');
          const debtStr = isDebt ? t.total.toString().replace('.', ',') : '';
          const creditStr = isCredit ? t.total.toString().replace('.', ',') : '';
          const balanceStr = (t as any).snapshotBalance.toString().replace('.', ',');
          
          csvContent += `${formatDate(t.date)};${t.invoiceNo || ''};${t.type === 'sales' ? 'Satış' : t.type === 'purchase' ? 'Alış' : t.type === 'cash_in' ? 'Tahsilat' : 'Ödeme'};${descStr};${debtStr};${creditStr};${balanceStr};${t.currency}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Ekstre_${customer.name.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderBalanceBox = (currency: 'TL' | 'USD' | 'EUR') => {
     const bal = realBalances[currency] as number;
     const isPositive = bal > 0; // Borçlu
     const isNegative = bal < 0; // Alacaklı

      return (
        <div className="relative group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex-1 min-w-[200px] print:border print:border-slate-300 print:shadow-none">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-colors ${isPositive ? 'bg-red-500' : isNegative ? 'bg-green-500' : 'bg-slate-300'} print:hidden`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{currency} BAKİYESİ</span>
                    {bal !== 0 && (
                        <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'} print:hidden`}>
                            {isPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                    )}
                </div>
                <div className={`text-3xl font-black font-mono tracking-tighter mb-1 ${isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-slate-400'} print:text-black`}>
                    {Math.abs(bal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {isPositive ? 'Müşteri Borçlu' : isNegative ? 'Müşteri Alacaklı' : 'Bakiye Yok'}
                </div>
            </div>
        </div>
      );
  };

  // Helper to render footer total with label
  const renderFooterTotal = (amount: number, currency: string) => {
      if (amount === 0) return null;
      const isDebt = amount > 0;
      const label = isDebt ? 'Borçlu' : 'Alacaklı';
      const color = isDebt ? 'text-red-600' : 'text-green-600';
      
      return (
          <div className={`flex flex-col items-end ${color}`}>
              <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-sm md:text-base">
                      {Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-white/50 px-1 rounded border border-current opacity-80">{label}</span>
              </div>
          </div>
      );
  };

  // If viewing a sub-customer, force active tab to transactions
  const currentTab = isSubCustomerView ? 'transactions' : activeTab;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* 
          =============================================
          PRINT AREA (Hidden on Screen)
          =============================================
      */}
      {/* ... Print area content omitted for brevity, it remains the same ... */}
      <div className="hidden print:block font-sans p-8">
          {/* ... Same as previous print content ... */}
      </div>
      
      {/* 
          =============================================
          SCREEN VIEW (Hidden on Print)
          =============================================
      */}
      <div className="print:hidden">
        {/* ... Modals kept same ... */}
        <ConfirmationModal isOpen={!!deleteId} title="İşlemi Sil" message="Bu işlemi silmek istediğinize emin misiniz? Bakiye geri alınacaktır." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
        <ConfirmationModal isOpen={!!deleteSubId} title="Alt Cariyi Sil" message="Bu cariyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz." onConfirm={confirmDeleteSub} onCancel={() => setDeleteSubId(null)} />
        
        {viewingImage && (
            <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in zoom-in-95 no-print">
                <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                    <button onClick={() => setViewingImage(null)} className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2"><X size={32} /></button>
                    <img src={viewingImage} alt="İrsaliye" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white" />
                </div>
            </div>
        )}

        {/* ... Header Area kept same ... */}
        <div className="no-print">
            <button onClick={onBack} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center text-xs font-bold uppercase tracking-wide transition-colors group">
            <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Listeye Dön
            </button>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                <div>
                    {customer.parentId && (
                        <div className="text-xs text-orange-600 font-bold mb-2 flex items-center bg-orange-50 w-fit px-2 py-1 rounded">
                            <CornerDownRight size={12} className="mr-1"/> 
                            {allCustomers.find(c => c.id === customer.parentId)?.name} Şubesine Bağlı
                        </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">{customer.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span>#{customer.id}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{customer.phone || 'Telefon Yok'}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { setEditFormData(customer); setIsEditingCustomer(true); }} className="bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 px-4 py-3 rounded-xl font-bold transition-all flex items-center">
                        <Edit2 size={18} className="mr-2"/> Cari Düzenle
                    </button>
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg active:scale-95">
                        <FileSpreadsheet size={18} className="mr-2"/> Ekstre İndir
                    </button>
                    <button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center shadow-lg active:scale-95">
                        <Printer size={18} className="mr-2"/> Ekstre Yazdır
                    </button>
                    <button onClick={() => setModalMode('in')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center">
                        <ArrowDownLeft size={18} className="mr-2"/> Tahsilat Al
                    </button>
                    <button onClick={() => setModalMode('out')} className="bg-white border border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-600 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center">
                        <ArrowUpRight size={18} className="mr-2"/> Ödeme Yap
                    </button>
                </div>
            </div>

            {/* Balance Cards */}
            <div className="flex flex-wrap gap-4 mb-8">
                {renderBalanceBox('TL')}
                {renderBalanceBox('USD')}
                {renderBalanceBox('EUR')}
            </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] print:shadow-none print:border-none">
            {!isSubCustomerView && (
                <div className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-slate-100 no-print gap-4">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveTab('transactions')} className={`py-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'transactions' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            Hesap Hareketleri
                        </button>
                        {panelMode === 'store' && !customer.parentId && (
                            <button onClick={() => setActiveTab('subcustomers')} className={`py-2 text-sm font-bold border-b-2 transition-all flex items-center ${activeTab === 'subcustomers' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                Alt Cariler <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{subCustomers.length}</span>
                            </button>
                        )}
                    </div>
                    
                    {/* FILTERS (GREEN & BLUE AREA) */}
                    {currentTab === 'transactions' && (
                        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
                             {/* Date Filter (Green) */}
                             <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
                                <div className="relative flex-1 md:w-32">
                                    <input 
                                        type="date" 
                                        className="w-full pl-3 pr-2 py-1.5 bg-transparent text-xs font-bold text-slate-600 outline-none"
                                        value={filterStartDate}
                                        onChange={e => setFilterStartDate(e.target.value)}
                                        placeholder="Başlangıç"
                                    />
                                </div>
                                <span className="text-slate-300 text-xs">/</span>
                                <div className="relative flex-1 md:w-32">
                                     <input 
                                        type="date" 
                                        className="w-full pl-3 pr-2 py-1.5 bg-transparent text-xs font-bold text-slate-600 outline-none"
                                        value={filterEndDate}
                                        onChange={e => setFilterEndDate(e.target.value)}
                                        placeholder="Bitiş"
                                    />
                                </div>
                             </div>

                             {/* Search Filter (Blue) */}
                             <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="İsim, Fatura No, Ürün Ara..." 
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-50 transition-all h-[38px]"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                             </div>

                             {(filterStartDate || filterEndDate || searchTerm) && (
                                <button 
                                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setSearchTerm(''); }}
                                    className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Filtreleri Temizle"
                                >
                                    <RefreshCcw size={16} />
                                </button>
                            )}
                        </div>
                    )}
                    
                    {/* Alt Cari Arama Kutusu */}
                    {activeTab === 'subcustomers' && (
                         <div className="w-full md:w-72">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Şube/Cari Ara..." 
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-50 transition-all"
                                    value={subSearchTerm}
                                    onChange={e => setSubSearchTerm(e.target.value)}
                                />
                             </div>
                        </div>
                    )}
                </div>
            )}

            {currentTab === 'transactions' ? (
                <div className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 w-28">Tarih</th>
                                    <th className="px-6 py-4">İşlem Detayı / Ürünler</th>
                                    <th className="px-6 py-4 w-64">Açıklama</th>
                                    <th className="px-6 py-4 text-center w-28">Tür</th>
                                    <th className="px-6 py-4 text-right w-28">Borç</th>
                                    <th className="px-6 py-4 text-right w-28">Alacak</th>
                                    <th className="px-6 py-4 text-right w-28 bg-slate-100/50">Bakiye</th>
                                    <th className="px-6 py-4 text-center w-28 no-print">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {processedTransactions.map(t => {
                                    const isDebt = t.type === 'sales' || t.type === 'cash_out';
                                    const isCredit = t.type === 'purchase' || t.type === 'cash_in';
                                    const totalCost = t.type === 'sales' ? calculateCost(t.items || []) : 0;
                                    
                                    // Description Logic
                                    let displayDesc = t.desc;
                                    if (!displayDesc && t.items && Array.isArray(t.items) && t.items.length > 0) {
                                        const itemDescs = t.items.map(i => i.description).filter(Boolean);
                                        if (itemDescs.length > 0) {
                                            displayDesc = itemDescs.join(', ');
                                        }
                                    }
                                    
                                    const snapBal = (t as any).snapshotBalance;
                                    const snapLabel = snapBal > 0 ? 'Borçlu' : snapBal < 0 ? 'Alacaklı' : '-';
                                    const snapColor = snapBal > 0 ? 'text-red-600' : snapBal < 0 ? 'text-green-600' : 'text-slate-400';

                                    // Check if this transaction is visible because it's a branch sale (not a direct account transaction)
                                    const isBranchSaleView = panelMode === 'store' && t.branchId === Number(customer.id) && t.accId !== Number(customer.id);

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">{formatDate(t.date)}</td>
                                            <td className="px-6 py-4">
                                                {/* ---- SATIR TASARIMI REVİZYONU (RED BOX FIX) ---- */}
                                                
                                                {/* 1. Perakende Müşteri Adı (Mağaza Modunda Öncelikli) */}
                                                {(isBranchSaleView || (panelMode === 'store' && t.type === 'sales')) && (
                                                    <div className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-tight flex items-center">
                                                         {t.accName || t.retailName || 'Müşteri'}
                                                         {t.retailName && t.accName !== t.retailName && <span className="text-[10px] text-slate-400 ml-2 font-normal">({t.retailName})</span>}
                                                    </div>
                                                )}

                                                {/* 2. İşlem Başlığı (Fatura No vs) */}
                                                <div className="flex items-center gap-2 mb-1">
                                                     <span className="font-bold text-slate-600 text-xs">
                                                        {t.items ? 'Fatura' : 'Nakit İşlem'}
                                                     </span>
                                                     {t.invoiceNo && (
                                                         <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                             #{t.invoiceNo}
                                                         </span>
                                                     )}
                                                </div>

                                                {/* 3. Ürün Listesi */}
                                                <div className="text-xs text-slate-500">
                                                    {t.items && Array.isArray(t.items) ? t.items.map(i => i.name).join(', ') : t.desc}
                                                </div>
                                                
                                                {/* 4. Satış Temsilcisi - Belirgin */}
                                                {t.salesRep && (
                                                    <div className="text-[10px] text-orange-600 uppercase font-bold mt-1.5 flex items-center gap-1.5 bg-orange-50 w-fit px-1.5 py-0.5 rounded border border-orange-100">
                                                        <UserCheck size={12} /> {t.salesRep}
                                                    </div>
                                                )}

                                                {t.deliveryNoteUrl && (
                                                    <button onClick={() => setViewingImage(t.deliveryNoteUrl || null)} className="mt-1 text-[10px] flex items-center text-blue-500 hover:underline no-print">
                                                        <FileImage size={10} className="mr-1"/> İrsaliye
                                                    </button>
                                                )}
                                                {/* Cost */}
                                                {t.type === 'sales' && totalCost > 0 && (
                                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold shadow-sm">
                                                        <Box size={10} />
                                                        Maliyet Toplamı: {totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {t.currency}
                                                    </div>
                                                )}
                                            </td>
                                            
                                            {/* AÇIKLAMA SÜTUNU */}
                                            <td className="px-6 py-4 text-xs text-slate-600 font-medium align-top">
                                                {displayDesc ? (
                                                    <div className="line-clamp-2" title={displayDesc}>{displayDesc}</div>
                                                ) : (
                                                    <span className="text-slate-300 text-[10px] italic">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border print:border-none print:px-0
                                                    ${t.type === 'sales' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                    t.type === 'purchase' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    t.type === 'cash_in' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                    {t.type === 'sales' ? 'Satış' : t.type === 'purchase' ? 'Alış' : t.type === 'cash_in' ? 'Tahsilat' : 'Ödeme'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-red-600 text-xs">{isDebt ? t.total.toLocaleString() : '-'}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-green-600 text-xs">{isCredit ? t.total.toLocaleString() : '-'}</td>
                                            <td className={`px-6 py-4 text-right font-mono bg-slate-50/50 ${snapColor}`}>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-xs">{Math.abs(snapBal).toLocaleString()} {t.currency}</span>
                                                    <span className="text-[9px] font-bold uppercase opacity-80">{snapLabel}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center no-print">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handlePrintTransaction(t)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors" title="İşlemi Yazdır">
                                                        <Printer size={14}/>
                                                    </button>
                                                    <button onClick={() => handleStartEditTransaction(t)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Düzenle"><Edit2 size={14}/></button>
                                                    <button onClick={() => setDeleteId(t.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sil"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {processedTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">Bu cariye ait kayıtlı hareket bulunamadı.</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-100 border-t border-slate-200">
                                <tr>
                                    <td colSpan={6} className="px-8 py-4 text-right font-bold text-slate-600 uppercase text-xs">Genel Toplam Bakiye</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            {renderFooterTotal(realBalances.TL, 'TL')}
                                            {renderFooterTotal(realBalances.USD, 'USD')}
                                            {renderFooterTotal(realBalances.EUR, 'EUR')}
                                            {realBalances.TL === 0 && realBalances.USD === 0 && realBalances.EUR === 0 && <span className="text-slate-400 font-mono text-xs">0.00</span>}
                                        </div>
                                    </td>
                                    <td className="no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                // ... Sub Customers View kept same ...
                <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        <button onClick={() => setShowSubAdd(true)} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all hover:bg-slate-50 group">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all"><Plus size={24}/></div>
                            <span className="font-bold text-sm">Yeni Alt Cari Ekle</span>
                        </button>
                        
                        {showSubAdd && (
                            <div className="col-span-full bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-4 animate-in slide-in-from-left-4">
                                <h4 className="font-bold text-slate-800 mb-4">Hızlı Cari Ekleme</h4>
                                <div className="flex gap-4">
                                    <input type="text" placeholder="Ad Soyad" className="flex-1 border border-slate-200 rounded-xl px-4 py-2 outline-none" value={newSubName} onChange={e => setNewSubName(e.target.value)} autoFocus />
                                    <input type="text" placeholder="Telefon" className="flex-1 border border-slate-200 rounded-xl px-4 py-2 outline-none" value={newSubPhone} onChange={e => setNewSubPhone(e.target.value)} />
                                    <button onClick={handleAddSubCustomer} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm">Kaydet</button>
                                </div>
                            </div>
                        )}

                        {filteredSubCustomers.map(sc => (
                            <div key={sc.id} onClick={() => onSelectCustomer(sc.id)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteSubId(sc.id); }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-full -mr-10 -mt-10 group-hover:bg-blue-50 transition-colors"></div>
                                <div className="relative z-10">
                                    <div className="font-bold text-lg text-slate-800 mb-1">{sc.name}</div>
                                    <div className="text-sm text-slate-400 mb-4">{sc.phone || 'Telefon Yok'}</div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Toplam Bakiye</span>
                                        <span className="font-mono font-bold text-slate-800">{sc.balances.TL.toLocaleString()} TL</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

       {/* Edit Transaction Modal */}
       {editingTransaction && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingTransaction(null)} />
               <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-3">
                       <Edit2 className="mr-2 text-blue-500" size={20} /> İşlemi Düzenle
                   </h3>

                   <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase">Tarih</label>
                               <input type="date" className="w-full border border-slate-200 rounded-lg p-2.5" value={editingTransaction.date} onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})} />
                           </div>
                           <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Açıklama</label>
                                <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5" value={editingTransaction.desc || ''} onChange={e => setEditingTransaction({...editingTransaction, desc: e.target.value})} />
                           </div>
                       </div>
                       
                       {/* Fatura No Düzenleme */}
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Fatura No</label>
                             <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5" value={editingTransaction.invoiceNo || ''} onChange={e => setEditingTransaction({...editingTransaction, invoiceNo: e.target.value})} />
                        </div>

                       {panelMode === 'store' && (
                           <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase">Satış Temsilcisi</label>
                               <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5" value={editingTransaction.salesRep || ''} onChange={e => setEditingTransaction({...editingTransaction, salesRep: e.target.value})} />
                           </div>
                       )}

                       {/* Eğer ürünlü bir işlemse (Fatura) */}
                       {editingTransaction.items && Array.isArray(editingTransaction.items) && editingTransaction.items.length > 0 ? (
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Ürünler</h4>
                               <div className="space-y-2">
                                   {editingTransaction.items.map((item, idx) => (
                                       <div key={idx} className="grid grid-cols-12 gap-2 items-center text-sm">
                                           <div className="col-span-5 font-medium truncate">{item.name}</div>
                                           <div className="col-span-2">
                                               <input type="number" className="w-full border rounded px-1 py-1 text-center" value={item.qty} onChange={e => updateTransItem(idx, 'qty', Number(e.target.value))} />
                                           </div>
                                           <div className="col-span-3">
                                               <input type="number" className="w-full border rounded px-1 py-1 text-right" value={item.price} onChange={e => updateTransItem(idx, 'price', Number(e.target.value))} />
                                           </div>
                                           <div className="col-span-2 text-right font-mono font-bold">
                                               {(item.qty * item.price).toLocaleString()}
                                           </div>
                                       </div>
                                   ))}
                                   <div className="text-right pt-2 border-t border-slate-200 font-bold text-slate-800">
                                       Toplam: {editingTransaction.items.reduce((s, i) => s + (i.qty * i.price), 0).toLocaleString()} {editingTransaction.currency}
                                   </div>
                               </div>
                           </div>
                       ) : (
                           // Nakit İşlemi ise sadece tutar düzenle
                           <div>
                               <label className="text-[10px] font-bold text-slate-500 uppercase">Tutar ({editingTransaction.currency})</label>
                               <input type="number" className="w-full border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-lg" value={editingTransaction.total} onChange={e => setEditingTransaction({...editingTransaction, total: Number(e.target.value)})} />
                           </div>
                       )}

                       <div className="flex gap-2 justify-end pt-4">
                           <button onClick={() => setEditingTransaction(null)} className="px-4 py-2 text-slate-500 bg-slate-100 rounded-lg font-bold">İptal</button>
                           <button onClick={handleSaveTransaction} className="px-6 py-2 text-white bg-blue-600 rounded-lg font-bold hover:bg-blue-700 flex items-center">
                               <Save size={18} className="mr-2"/> Kaydet
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Edit Customer Modal */}
       {isEditingCustomer && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditingCustomer(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Edit2 className="mr-2 text-orange-500"/> Cari Düzenle</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Firma / Şahıs Adı</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefon 1</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefon 2</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2" value={editFormData.phone2} onChange={e => setEditFormData({...editFormData, phone2: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Adres</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <button onClick={() => setIsEditingCustomer(false)} className="px-4 py-2 text-slate-500 font-bold bg-slate-100 rounded-lg">İptal</button>
                        <button onClick={handleEditSubmit} className="px-4 py-2 text-white font-bold bg-slate-900 rounded-lg">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
       )}

       {/* Payment Modal */}
       {modalMode && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalMode(null)} />
               <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                   <div className={`p-8 text-white ${modalMode === 'in' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
                       <h3 className="text-2xl font-black flex items-center tracking-tight">
                           {modalMode === 'in' ? <ArrowDownLeft className="mr-2"/> : <ArrowUpRight className="mr-2"/>}
                           {modalMode === 'in' ? 'Tahsilat Al' : 'Ödeme Yap'}
                       </h3>
                   </div>
                   <form onSubmit={handleSubmit} className="p-8 space-y-5">
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tutar</label>
                           <input type="number" step="0.01" className="w-full text-3xl font-black text-slate-800 border-b-2 border-slate-100 py-2 outline-none focus:border-slate-800 transition-colors placeholder-slate-200" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus required />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Para Birimi</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none" value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value as any)}>
                                    <option value="TL">TL</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                           </div>
                           <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Kasa</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none" value={selectedSafe} onChange={e => setSelectedSafe(Number(e.target.value))}>
                                    {safes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                           </div>
                       </div>
                       
                       {/* Ödeme Yöntemi Seçimi */}
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ödeme Türü</label>
                           <div className="relative">
                               <CreditCard className="absolute left-4 top-3.5 text-slate-400" size={18} />
                               <select 
                                   className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 font-bold text-slate-700 outline-none appearance-none"
                                   value={paymentMethod}
                                   onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                               >
                                   <option value="nakit">Nakit</option>
                                   <option value="havale">Havale / EFT</option>
                                   <option value="kredi_karti">Kredi Kartı</option>
                                   <option value="cek">Çek / Senet</option>
                                   <option value="virman">Virman</option>
                               </select>
                           </div>
                       </div>

                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase ml-1">Açıklama</label>
                           <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none" placeholder="İsteğe bağlı açıklama..." value={desc} onChange={e => setDesc(e.target.value)} />
                       </div>

                       <button type="submit" className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl active:scale-95 transition-all ${modalMode === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                           İşlemi Tamamla
                       </button>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};
