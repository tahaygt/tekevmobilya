
import React, { useState, useMemo } from 'react';
import { Customer, Transaction, Safe, PaymentMethod } from '../types';
import { ArrowLeft, ArrowRight, Wallet, Edit2, Trash2, Calendar, FileText, Search, Printer, ArrowUpRight, ArrowDownLeft, FileDown, Link as LinkIcon, FileImage, X, User, CornerDownRight, Users, Plus, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface CustomerDetailProps {
  customer: Customer;
  allCustomers: Customer[];
  transactions: Transaction[];
  safes: Safe[];
  onBack: () => void;
  onPayment: (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string, date: string, linkedTransactionId?: number) => void;
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (transaction: Transaction) => void; 
  onSelectCustomer: (id: number) => void; 
  onAddCustomer: (data: Omit<Customer, 'id' | 'balances'>) => Promise<Customer>;
  onDeleteCustomer?: (id: number) => Promise<void>;
  panelMode?: 'accounting' | 'store';
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ 
  customer, allCustomers, transactions, safes, onBack, onPayment, onDeleteTransaction, onEditTransaction, onSelectCustomer, onAddCustomer, onDeleteCustomer, panelMode
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'subcustomers'>('transactions');
  const [modalMode, setModalMode] = useState<'in' | 'out' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<number | null>(null);
  const [showSubAdd, setShowSubAdd] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');

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
     return allCustomers.filter(c => Number(c.parentId) === Number(customer.id));
  }, [customer, allCustomers, panelMode]);

  const relatedCustomerIds = useMemo(() => {
     if (customer.parentId) return [Number(customer.id)];
     const ids = [Number(customer.id)];
     subCustomers.forEach(c => ids.push(Number(c.id)));
     return ids;
  }, [customer, subCustomers]);

  // Determine if this is a sub-customer view
  const isSubCustomerView = Boolean(customer.parentId);

  // İŞLEM HESAPLAMA VE SIRALAMA (ESKİDEN -> YENİYE)
  const processedTransactions = useMemo(() => {
    // 1. İlgili cariye ait işlemleri filtrele
    let filtered = transactions.filter(t => t.accId && relatedCustomerIds.includes(Number(t.accId)));
    
    // 2. Arama filtresi
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(t => 
            (t.desc || '').toLowerCase().includes(searchLower) ||
            t.total.toString().includes(searchLower) ||
            t.items?.some(i => (i.name || '').toLowerCase().includes(searchLower)) ||
            (t.retailName || '').toLowerCase().includes(searchLower)
        );
    }

    // 3. Tarihe göre ESKİDEN -> YENİYE sırala (En son işlem en altta)
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. Kümülatif Bakiye Hesapla
    const runningBalances = { TL: 0, USD: 0, EUR: 0 };
    
    return filtered.map(t => {
        const isDebt = t.type === 'sales' || t.type === 'cash_out';   // Borç (Müşteriye mal verdik veya para ödedik)
        const isCredit = t.type === 'purchase' || t.type === 'cash_in'; // Alacak (Mal aldık veya para tahsil ettik)
        
        let amount = t.total;
        if (isDebt) runningBalances[t.currency] += amount;
        else if (isCredit) runningBalances[t.currency] -= amount;
        
        return { 
            ...t, 
            snapshotBalance: runningBalances[t.currency] 
        };
    });
  }, [transactions, relatedCustomerIds, searchTerm]);

  // Son Bakiye (Listenin en sonundaki bakiye değil, carinin güncel bakiyesi)
  // Ancak tabloda listenin son satırı o anki durumu gösterir.
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedSafe) return;
    onPayment(parseFloat(amount), modalMode!, selectedSafe, selectedCurrency, paymentMethod, desc, selectedDate);
    setModalMode(null);
    setAmount('');
    setDesc('');
    setPaymentMethod('nakit');
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
      window.print();
  };

  const renderBalanceBox = (currency: 'TL' | 'USD' | 'EUR') => {
     const bal = customer.balances[currency];
     const isPositive = bal > 0; // Borçlu
     const isNegative = bal < 0; // Alacaklı

      return (
        <div className="relative group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex-1 min-w-[200px]">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 transition-colors ${isPositive ? 'bg-red-500' : isNegative ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{currency} BAKİYESİ</span>
                    {bal !== 0 && (
                        <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            {isPositive ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                    )}
                </div>
                <div className={`text-3xl font-black font-mono tracking-tighter mb-1 ${isPositive ? 'text-red-600' : isNegative ? 'text-green-600' : 'text-slate-400'}`}>
                    {Math.abs(bal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {isPositive ? 'Müşteri Borçlu' : isNegative ? 'Müşteri Alacaklı' : 'Bakiye Yok'}
                </div>
            </div>
        </div>
      );
  };

  // If viewing a sub-customer, force active tab to transactions
  const currentTab = isSubCustomerView ? 'transactions' : activeTab;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Transaction Delete Modal */}
      <ConfirmationModal isOpen={!!deleteId} title="İşlemi Sil" message="Bu işlemi silmek istediğinize emin misiniz?" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      
      {/* Sub Customer Delete Modal */}
      <ConfirmationModal isOpen={!!deleteSubId} title="Alt Cariyi Sil" message="Bu cariyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz." onConfirm={confirmDeleteSub} onCancel={() => setDeleteSubId(null)} />
      
      {viewingImage && (
          <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur flex items-center justify-center p-4 animate-in fade-in zoom-in-95 no-print">
              <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                  <button onClick={() => setViewingImage(null)} className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2"><X size={32} /></button>
                  <img src={viewingImage} alt="İrsaliye" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white" />
              </div>
          </div>
      )}

      {/* Header Area */}
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
                 <button onClick={handlePrint} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold transition-all flex items-center">
                     <Printer size={18} className="mr-2"/> Yazdır
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
      
      {/* Printable Header - Visible only when printing */}
      <div className="hidden print-only mb-8 text-center border-b pb-4">
          <h1 className="text-2xl font-bold">{customer.name} - Hesap Ekstresi</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] print:shadow-none print:border-none">
          {/* Sadece Ana Cari ise Sekmeleri Göster */}
          {!isSubCustomerView && (
              <div className="flex items-center gap-8 px-8 border-b border-slate-100 no-print">
                 <button onClick={() => setActiveTab('transactions')} className={`py-6 text-sm font-bold border-b-2 transition-all ${activeTab === 'transactions' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                     Hesap Hareketleri
                 </button>
                 {panelMode === 'store' && !customer.parentId && (
                     <button onClick={() => setActiveTab('subcustomers')} className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center ${activeTab === 'subcustomers' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                         Alt Cariler <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{subCustomers.length}</span>
                     </button>
                 )}
              </div>
          )}
          
          {/* Alt Cari ise veya 'transactions' seçiliyse tabloyu göster */}
          {currentTab === 'transactions' ? (
              <div className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 print:bg-gray-100">
                            <tr>
                                <th className="px-8 py-4 w-32">Tarih</th>
                                <th className="px-8 py-4">Açıklama / Ürünler</th>
                                <th className="px-8 py-4 text-center w-32">Tür</th>
                                <th className="px-8 py-4 text-right w-32">Borç</th>
                                <th className="px-8 py-4 text-right w-32">Alacak</th>
                                <th className="px-8 py-4 text-right w-32 bg-slate-100/50">Bakiye</th>
                                <th className="px-8 py-4 text-center w-16 no-print">Sil</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {processedTransactions.map(t => {
                                const isDebt = t.type === 'sales' || t.type === 'cash_out';
                                const isCredit = t.type === 'purchase' || t.type === 'cash_in';
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4 font-mono text-slate-500 text-xs">{formatDate(t.date)}</td>
                                        <td className="px-8 py-4">
                                            <div className="font-bold text-slate-700">{t.desc || (t.items ? 'Fatura' : 'İşlem')}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[300px]">{t.items?.map(i => i.name).join(', ')}</div>
                                            {t.deliveryNoteUrl && (
                                                <button onClick={() => setViewingImage(t.deliveryNoteUrl || null)} className="mt-1 text-[10px] flex items-center text-blue-500 hover:underline no-print">
                                                    <FileImage size={10} className="mr-1"/> İrsaliye
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border print:border-none print:px-0
                                                ${t.type === 'sales' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                  t.type === 'purchase' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                  t.type === 'cash_in' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                {t.type === 'sales' ? 'Satış' : t.type === 'purchase' ? 'Alış' : t.type === 'cash_in' ? 'Tahsilat' : 'Ödeme'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-mono font-bold text-red-600 text-xs">{isDebt ? t.total.toLocaleString() : '-'}</td>
                                        <td className="px-8 py-4 text-right font-mono font-bold text-green-600 text-xs">{isCredit ? t.total.toLocaleString() : '-'}</td>
                                        <td className="px-8 py-4 text-right font-mono font-bold text-slate-800 text-xs bg-slate-50/50">{(t as any).snapshotBalance.toLocaleString()} {t.currency}</td>
                                        <td className="px-8 py-4 text-center no-print">
                                            <button onClick={() => setDeleteId(t.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {processedTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Bu cariye ait kayıtlı hareket bulunamadı.</td>
                                </tr>
                            )}
                        </tbody>
                        {/* TABLE FOOTER FOR FINAL BALANCE */}
                        <tfoot className="bg-slate-100 border-t border-slate-200">
                             <tr>
                                 <td colSpan={5} className="px-8 py-4 text-right font-bold text-slate-600 uppercase text-xs">Genel Toplam Bakiye</td>
                                 <td className="px-8 py-4 text-right">
                                     <div className="flex flex-col items-end gap-1">
                                         {customer.balances.TL !== 0 && <span className="font-mono font-black text-slate-800">{customer.balances.TL.toLocaleString()} TL</span>}
                                         {customer.balances.USD !== 0 && <span className="font-mono font-black text-slate-800">{customer.balances.USD.toLocaleString()} USD</span>}
                                         {customer.balances.EUR !== 0 && <span className="font-mono font-black text-slate-800">{customer.balances.EUR.toLocaleString()} EUR</span>}
                                         {customer.balances.TL === 0 && customer.balances.USD === 0 && customer.balances.EUR === 0 && <span className="text-slate-400 font-mono text-xs">0.00</span>}
                                     </div>
                                 </td>
                                 <td className="no-print"></td>
                             </tr>
                        </tfoot>
                    </table>
                  </div>
              </div>
          ) : (
              <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      <button onClick={() => setShowSubAdd(true)} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all hover:bg-slate-50 group">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all"><Plus size={24}/></div>
                          <span className="font-bold text-sm">Yeni Alt Cari Ekle</span>
                      </button>
                      
                      {/* Sub Add Form Inline */}
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

                      {subCustomers.map(sc => (
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
