import React, { useState } from 'react';
import { Product } from '../types';
import { Box, Plus, Tag, Ruler, Edit2, Trash2, Save, X } from 'lucide-react';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export const Products: React.FC<ProductsProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct }) => {
  const [filterType, setFilterType] = useState<'satilan' | 'alinan'>('satilan');
  const [isEditing, setIsEditing] = useState<number | null>(null);
  
  // New Product State
  const initialNewProd = { name: '', type: 'satilan', unit: '', cat: '', price: '' };
  const [newProd, setNewProd] = useState(initialNewProd);

  // Editing Product State
  const [editForm, setEditForm] = useState<Product | null>(null);

  const handleAdd = () => {
    if (!newProd.name) return;
    onAddProduct({
      ...newProd,
      unit: newProd.unit || 'Adet',
      type: filterType,
      price: parseFloat(newProd.price) || 0
    } as any);
    setNewProd({ ...initialNewProd, type: filterType });
  };

  const startEdit = (p: Product) => {
    setIsEditing(p.id);
    setEditForm(p);
  };

  const saveEdit = () => {
    if(editForm) {
        onEditProduct(editForm);
        setIsEditing(null);
        setEditForm(null);
    }
  };

  const filteredProducts = products.filter(p => p.type === filterType);

  return (
    <div className="space-y-6">
      {/* Add Product */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Plus className="mr-2 text-primary" size={20} /> Ürün Tanımla
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            className="md:col-span-2 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
            placeholder="Ürün Adı"
            value={newProd.name}
            onChange={e => setNewProd({...newProd, name: e.target.value})}
          />
           <input
            className="md:col-span-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
            placeholder="Kategori (Örn: Koltuk)"
            value={newProd.cat}
            onChange={e => setNewProd({...newProd, cat: e.target.value})}
          />
          <input
             className="md:col-span-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
             placeholder="Birim (Adet, Mt...)"
             list="units"
             value={newProd.unit}
             onChange={e => setNewProd({...newProd, unit: e.target.value})}
          />
          <datalist id="units">
             <option value="Adet" />
             <option value="Metre" />
             <option value="Takım" />
             <option value="Kg" />
             <option value="Top" />
          </datalist>
          <input
            className="md:col-span-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
            placeholder="Birim Fiyat"
            type="number"
            value={newProd.price}
            onChange={e => setNewProd({...newProd, price: e.target.value})}
          />
          <button 
            onClick={handleAdd}
            className="md:col-span-1 bg-primary hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Tabs & List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${filterType === 'satilan' ? 'bg-sky-50 text-sky-600 border-sky-500' : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}
            onClick={() => setFilterType('satilan')}
          >
            Satılan Ürünler
          </button>
          <button 
            className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${filterType === 'alinan' ? 'bg-orange-50 text-orange-600 border-orange-500' : 'text-slate-500 hover:bg-slate-50 border-transparent'}`}
            onClick={() => setFilterType('alinan')}
          >
            Alınan Ürünler
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Ürün Adı</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Birim</th>
                <th className="px-6 py-4 text-right">Birim Fiyat</th>
                <th className="px-6 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => {
                 const editing = isEditing === p.id && editForm;
                 return (
                <tr key={p.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-3 font-medium text-slate-800">
                     {editing ? (
                        <input className="border rounded px-2 py-1 w-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                     ) : (
                        <div className="flex items-center">
                            <Box size={16} className="mr-3 text-slate-400" />
                            {p.name}
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-3 text-slate-600 text-sm">
                    {editing ? (
                        <input className="border rounded px-2 py-1 w-full" value={editForm.cat} onChange={e => setEditForm({...editForm, cat: e.target.value})} />
                     ) : (
                        p.cat || '-'
                     )}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                     {editing ? (
                        <input className="border rounded px-2 py-1 w-full" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                     ) : (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded w-fit text-slate-600 border border-slate-200">
                            <Ruler size={12} /> {p.unit}
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-800 font-mono">
                     {editing ? (
                        <input type="number" className="border rounded px-2 py-1 w-full text-right" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} />
                     ) : (
                        `${p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`
                     )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {editing ? (
                            <>
                                <button onClick={saveEdit} className="text-green-500 hover:bg-green-50 p-1 rounded"><Save size={18}/></button>
                                <button onClick={() => setIsEditing(null)} className="text-gray-500 hover:bg-gray-50 p-1 rounded"><X size={18}/></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-primary p-1 transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => { if(window.confirm('Ürünü silmek istiyor musunuz?')) onDeleteProduct(p.id); }} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              )})}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 flex flex-col items-center">
                    <Tag size={32} className="mb-2 opacity-50" />
                    Bu kategoride ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};