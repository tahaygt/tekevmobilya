import React, { useState } from 'react';
import { Safe, Transaction } from '../types';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Save, X } from 'lucide-react';

interface CashProps {
  safes: Safe[];
  transactions: Transaction[];
  onAddSafe: (name: string) => void;
  onEditSafe: (safe: Safe) => void;
  onDeleteSafe: (id: number) => void;
}

export const Cash: React.FC<CashProps> = ({ safes, transactions, onAddSafe, onEditSafe, onDeleteSafe }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const cashTransactions = transactions.filter(t => 
    t.type === 'cash_in' || t.type === 'cash_out'
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddSafe = () => {
      const name = prompt("Yeni Kasa Adı:");
      if(name) onAddSafe(name);
  };

  const startEdit = (s: Safe) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const saveEdit = (s: Safe) => {
    onEditSafe({ ...s, name: editName });
    setEditingId(null);
  };

  const formatDate = (isoString: string) => {
      if(!isoString) return '-';
      return isoString.split('-').reverse().join('.');
  };

  return (
    <div className="space-y-6">
      
      {/* Safes Grid */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Kasalar</h3>
        <button 
            onClick={handleAddSafe} 
            className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center shadow-md transition-all active:scale-95"
        >
            <Plus size={16} className="mr-1" /> Kasa Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {safes.map(safe => (
            <div key={safe.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    {editingId === safe.id ? (
                        <div className="flex gap-2 w-full">
                            <input className="border rounded px-2 py-1 flex-1 text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                            <button onClick={() => saveEdit(safe)} className="text-green-500"><Save size={16}/></button>
                        </div>
                    ) : (
                        <div className="font-bold text-slate-700 text-lg">{safe.name}</div>
                    )}
                    
                    {!editingId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(safe)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Edit2 size={14}/></button>
                            <button onClick={() => { if(window.confirm('Kasa silinsin mi?')) onDeleteSafe(safe.id); }} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14}/></button>
                        </div>
                    )}
                </div>

                <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                        <span className="text-xs font-semibold text-slate-400">TRY</span>
                        <span className="font-bold font-mono text-slate-800">{safe.balances.TL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                        <span className="text-xs font-semibold text-slate-400">USD</span>
                        <span className="font-bold font-mono text-green-700">{safe.balances.USD.toLocaleString('en-US', { minimumFractionDigits: 2 })} $</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-400">EUR</span>
                        <span className="font-bold font-mono text-blue-700">{safe.balances.EUR.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                    </div>
                </div>

                <div className="absolute -bottom-4 -right-4 opacity-[0.03] text-slate-900 pointer-events-none">
                    <Wallet size={120} />
                </div>
            </div>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
        <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-700 bg-slate-50">
            Son Kasa Hareketleri
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500">
                    <tr>
                        <th className="px-6 py-3 font-medium">Tarih</th>
                        <th className="px-6 py-3 font-medium">Kasa</th>
                        <th className="px-6 py-3 font-medium">Açıklama</th>
                        <th className="px-6 py-3 font-medium text-right">Tutar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {cashTransactions.slice(0, 15).map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-slate-600 whitespace-nowrap font-mono">{formatDate(t.date)}</td>
                            <td className="px-6 py-3 text-slate-600">{safes.find(s => s.id === t.safeId)?.name || '-'}</td>
                            <td className="px-6 py-3">
                                <div className="flex items-center">
                                    {t.type === 'cash_in' 
                                        ? <ArrowDownLeft size={16} className="text-green-500 mr-2" /> 
                                        : <ArrowUpRight size={16} className="text-red-500 mr-2" />
                                    }
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 font-medium">{t.desc || 'İşlem'}</span>
                                        <div className="flex gap-2">
                                            {t.accName && <span className="text-[10px] text-slate-500">{t.accName}</span>}
                                            <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 uppercase">{t.method}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className={`px-6 py-3 text-right font-bold font-mono ${t.type === 'cash_in' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'cash_out' ? '-' : '+'}{t.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {t.currency}
                            </td>
                        </tr>
                    ))}
                    {cashTransactions.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">Kasa işlemi bulunamadı.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};