
import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Search, Edit2, Save, X, Archive, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface WarehouseProps {
  products: Product[];
  onUpdateStock: (productId: number, newStock: number) => void;
}

export const Warehouse: React.FC<WarehouseProps> = ({ products, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState<string>('');

  const filteredProducts = products.filter(p => 
      (p.type === 'satilan' || p.type === 'both') && 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startEdit = (p: Product) => {
      setEditingId(p.id);
      setEditStock((p.stock || 0).toString());
  };

  const saveEdit = (id: number) => {
      onUpdateStock(id, parseInt(editStock) || 0);
      setEditingId(null);
  };

  const adjustStock = (p: Product, amount: number) => {
      const current = p.stock || 0;
      onUpdateStock(p.id, current + amount);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Archive size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Depo Stok Takibi</h2>
                    <p className="text-xs text-slate-500 font-medium">Mevcut ürün envanteri ve stok hareketleri</p>
                </div>
            </div>
            
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Ürün veya Kategori Ara..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(p => {
                const stock = p.stock || 0;
                const isLow = stock < 5;
                const isEditing = editingId === p.id;

                return (
                    <div key={p.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${isLow ? 'border-red-200 shadow-red-50' : 'border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">{p.cat}</span>
                            {isLow && (
                                <div className="flex items-center text-red-500 text-[10px] font-bold animate-pulse">
                                    <AlertCircle size={12} className="mr-1" /> KRİTİK STOK
                                </div>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-slate-800 mb-1 truncate" title={p.name}>{p.name}</h3>
                        <p className="text-xs text-slate-400 mb-4">{p.unit}</p>

                        <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center mb-4 border border-slate-100">
                            <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Mevcut Stok</span>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-20 text-center font-black text-2xl bg-white border border-indigo-300 rounded-lg py-1 outline-none text-indigo-600"
                                        value={editStock}
                                        onChange={e => setEditStock(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <span className={`text-3xl font-black ${stock === 0 ? 'text-slate-300' : isLow ? 'text-red-600' : 'text-slate-700'}`}>
                                    {stock}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={() => saveEdit(p.id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center"><Save size={14} className="mr-1"/> Kaydet</button>
                                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center"><X size={14} className="mr-1"/> İptal</button>
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-1">
                                        <button onClick={() => adjustStock(p, -1)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Azalt"><ArrowDown size={16}/></button>
                                        <button onClick={() => adjustStock(p, 1)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Artır"><ArrowUp size={16}/></button>
                                    </div>
                                    <button onClick={() => startEdit(p)} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center hover:bg-slate-700 transition-colors">
                                        <Edit2 size={14} className="mr-1"/> Düzenle
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
