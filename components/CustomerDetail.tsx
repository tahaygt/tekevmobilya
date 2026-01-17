import React, { useState } from 'react';
import { Customer, Transaction, Safe, PaymentMethod } from '../types';
import { ArrowLeft, PlusCircle, MinusCircle, Wallet, Edit2, Trash2 } from 'lucide-react';

interface CustomerDetailProps {
  customer: Customer;
  transactions: Transaction[];
  safes: Safe[];
  onBack: () => void;
  onPayment: (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string) => void;
  onDeleteTransaction: (id: number) => void;
  onEditTransaction: (transaction: Transaction) => void; 
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ 
  customer, transactions, safes, onBack, onPayment, onDeleteTransaction
}) => {
  const [modalMode, setModalMode] = useState<'in' | 'out' | null>(null);
  
  // Payment Form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedSafe, setSelectedSafe] = useState(safes[0]?.id || 0);
  const [selectedCurrency, setSelectedCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nakit');

  const customerTransactions = transactions
    .filter(t => t.accId === customer.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = () => {
    if (!amount || !selectedSafe) return;
    onPayment(parseFloat(amount), modalMode!, selectedSafe, selectedCurrency, paymentMethod, desc);
    setModalMode(null);
    setAmount('');
    setDesc('');
    setPaymentMethod('nakit');
  };

  const formatDate = (isoString: string) => {
    if(!isoString) return '-';
    return isoString.split('-').reverse().join('.');
  };

  const renderBalanceBox = (currency: 'TL' | 'USD' | 'EUR') => {
      const bal = customer.balances[currency];
      return (
        <div className={`p-4 rounded-xl border flex-1 text-center min-w-[120px] shadow-sm
             ${bal > 0 ? 'bg-green-50 border-green-100' : bal < 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}
        `}>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1
               ${bal > 0 ? 'text-green-600' : bal < 0 ? 'text-red-600' : 'text-slate-400'}
            `}>
                {currency}
            </div>
            <div className={`text-xl font-bold font-mono ${bal >= 0 ? 'text-green-700' : 'text-red-700'} ${bal === 0 ? 'text-slate-400' : ''}`}>
              {Math.abs(bal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <button 
          onClick={onBack}
          className="mb-6 text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Listeye Dön
        </button>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{customer.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase font-semibold text-xs tracking-wider">
                 {customer.type === 'both' ? 'MÜŞTERİ & TEDARİKÇİ' : customer.type}
              </span>
              {customer.phone && <span>{customer.phone}</span>}
              {customer.address && <span className="truncate max-w-xs">{customer.address}</span>}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
             {renderBalanceBox('TL')}
             {renderBalanceBox('USD')}
             {renderBalanceBox('EUR')}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => { setModalMode('in'); }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all shadow-md active:scale-95"
          >
            <PlusCircle className="mr-2" /> Tahsilat Al
          </button>
          <button 
            onClick={() => { setModalMode('out'); }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl flex items-center justify-center font-bold text-lg transition-all shadow-md active:scale-95"
          >
            <MinusCircle className="mr-2" /> Ödeme Yap
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700 bg-slate-50">
          Hesap Hareketleri
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium w-32">Tarih</th>
                <th className="px-6 py-3 font-medium">İşlem / Açıklama</th>
                <th className="px-6 py-3 font-medium">Tür</th>
                <th className="px-6 py-3 font-medium text-right text-red-600">Borç</th>
                <th className="px-6 py-3 font-medium text-right text-green-600">Alacak</th>
                <th className="px-6 py-3 font-medium text-center w-24">Birim</th>
                <th className="px-6 py-3 font-medium text-center w-24">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customerTransactions.map(t => {
                const isDebt = t.type === 'sales' || t.type === 'cash_out';
                const isCredit = t.type === 'purchase' || t.type === 'cash_in';
                
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-600 whitespace-nowrap font-mono">{formatDate(t.date)}</td>
                    <td className="px-6 py-3 text-slate-800">
                      <div className="font-medium">
                         {t.items ? 'Fatura' : (t.type === 'cash_in' ? 'Tahsilat' : 'Ödeme')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.items ? t.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ') : t.desc}
                      </div>
                    </td>
                     <td className="px-6 py-3 text-xs text-slate-500 uppercase">
                        {t.items ? 'FATURA' : t.method}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-red-600 font-mono">
                      {isDebt ? t.total.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-green-600 font-mono">
                      {isCredit ? t.total.toLocaleString('tr-TR', {minimumFractionDigits: 2}) : '-'}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-500 text-xs font-bold">
                        {t.currency}
                    </td>
                    <td className="px-6 py-3 text-center">
                        <button 
                            onClick={() => { if(window.confirm('Bu işlemi silmek bakiyeleri etkileyecektir. Emin misiniz?')) onDeleteTransaction(t.id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Sil"
                        >
                            <Trash2 size={14} />
                        </button>
                    </td>
                  </tr>
                );
              })}
              {customerTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Henüz işlem yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold mb-6 flex items-center text-slate-800">
              <Wallet className="mr-2 text-primary" /> 
              {modalMode === 'in' ? 'Tahsilat Girişi' : 'Ödeme Çıkışı'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Kasa</label>
                    <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-slate-50 text-sm"
                    value={selectedSafe}
                    onChange={e => setSelectedSafe(Number(e.target.value))}
                    >
                    {safes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Yöntem</label>
                    <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none bg-slate-50 text-sm"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                    <option value="nakit">Nakit</option>
                    <option value="havale">Havale / EFT</option>
                    <option value="cek">Çek / Senet</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                    <option value="virman">Virman</option>
                    </select>
                </div>
              </div>

              <div className="flex gap-2">
                 <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Tutar</label>
                    <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none text-xl font-bold font-mono"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    autoFocus
                    />
                 </div>
                 <div className="w-24">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Birim</label>
                    <select 
                     className="w-full border rounded-lg p-2 h-[46px] focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold"
                     value={selectedCurrency}
                     onChange={e => setSelectedCurrency(e.target.value as any)}
                    >
                        <option value="TL">TL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Açıklama</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Örn: Elden ödeme alındı..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setModalMode(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-200"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSubmit}
                  className={`flex-1 py-3 rounded-lg font-medium text-white shadow-lg shadow-blue-500/20 ${modalMode === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};