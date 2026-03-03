
import React, { useState, useMemo } from 'react';
import { Transaction, Safe } from '../types';
import { Plus, Filter, Search, Trash2, Calendar, FileText, ArrowUpRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface ExpensesProps {
  transactions: Transaction[];
  safes: Safe[];
  onAddExpense: (amount: number, category: string, desc: string, safeId: number, date: string, currency: 'TL' | 'USD' | 'EUR') => void;
  onDeleteTransaction: (id: number) => void;
}

const EXPENSE_CATEGORIES = [
    "Personel (Maaş/Avans)",
    "Kira",
    "Fatura (Elektrik/Su/Net)",
    "Yemek",
    "Ulaşım/Yakıt",
    "Tedarik/Malzeme",
    "Reklam/Pazarlama",
    "Vergi/Resmi",
    "Diğer"
];

export const Expenses: React.FC<ExpensesProps> = ({ transactions, safes, onAddExpense, onDeleteTransaction }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [selectedSafe, setSelectedSafe] = useState(safes[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');

  const filteredExpenses = useMemo(() => {
      return transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
            const matchesSearch = (t.desc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterCategory]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!amount || !selectedSafe) return;
      onAddExpense(parseFloat(amount), category, desc, selectedSafe, date, currency);
      setAmount('');
      setDesc('');
      setShowForm(false);
  };

  const confirmDelete = () => {
      if(deleteId) {
          onDeleteTransaction(deleteId);
          setDeleteId(null);
      }
  };

  const totalExpense = filteredExpenses.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
        <ConfirmationModal 
            isOpen={!!deleteId}
            title="Gideri Sil"
            message="Bu gider kaydını silmek istediğinize emin misiniz? Bakiye kasaya geri eklenecektir."
            onConfirm={confirmDelete}
            onCancel={() => setDeleteId(null)}
        />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Gider Yönetimi</h2>
            <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all active:scale-95"
            >
                <Plus size={20} className="mr-2" /> Yeni Gider Ekle
            </button>
        </div>

        {/* Expense Form */}
        {showForm && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100 animate-in slide-in-from-top-4">
                <h3 className="text-lg font-bold text-red-700 mb-6 flex items-center border-b border-red-50 pb-2">
                    <ArrowUpRight className="mr-2" /> Gider Detayları
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Kategori</label>
                        <select className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tutar</label>
                        <div className="flex">
                            <input type="number" step="0.01" className="w-full border border-slate-200 rounded-l-xl px-4 py-3 outline-none font-bold" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                            <select className="border border-slate-200 border-l-0 rounded-r-xl px-2 bg-slate-50 font-bold text-sm outline-none" value={currency} onChange={e => setCurrency(e.target.value as any)}>
                                <option value="TL">TL</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ödenen Kasa</label>
                        <select className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none" value={selectedSafe} onChange={e => setSelectedSafe(Number(e.target.value))}>
                            {safes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Açıklama</label>
                        <input type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none" placeholder="Örn: Mart Ayı Kirası..." value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tarih</label>
                        <input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    
                    <div className="lg:col-span-3 flex justify-end gap-3 mt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">İptal</button>
                        <button type="submit" className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700">Kaydet</button>
                    </div>
                </form>
            </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                <button 
                    onClick={() => setFilterCategory('all')} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    Tümü
                </button>
                {EXPENSE_CATEGORIES.slice(0, 4).map(c => (
                    <button 
                        key={c} 
                        onClick={() => setFilterCategory(c)} 
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterCategory === c ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        {c.split(' ')[0]}
                    </button>
                ))}
                <div className="relative">
                    <select 
                        className={`px-4 py-2 rounded-lg text-xs font-bold appearance-none outline-none cursor-pointer ${['all', ...EXPENSE_CATEGORIES.slice(0,4)].includes(filterCategory) ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-white'}`}
                        value={['all', ...EXPENSE_CATEGORIES.slice(0,4)].includes(filterCategory) ? '' : filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="" disabled>Diğer...</option>
                        {EXPENSE_CATEGORIES.slice(4).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Gider Ara..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase font-bold">
                    <tr>
                        <th className="px-6 py-4">Tarih</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4">Açıklama</th>
                        <th className="px-6 py-4 text-right">Tutar</th>
                        <th className="px-6 py-4 text-center">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredExpenses.map(t => (
                        <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">{t.date.split('-').reverse().join('.')}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{t.category}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">{t.desc}</td>
                            <td className="px-6 py-4 text-right font-bold font-mono text-red-600">
                                {t.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {t.currency}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => setDeleteId(t.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Kayıtlı gider bulunamadı.</td>
                        </tr>
                    )}
                </tbody>
                {filteredExpenses.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-600">TOPLAM (Filtrelenen)</td>
                            <td className="px-6 py-4 text-right font-black text-red-700 text-lg">
                                {totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                <span className="block text-[9px] font-normal text-slate-400">Diğer para birimleri hariç</span>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    </div>
  );
};
