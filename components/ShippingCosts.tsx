import React, { useState } from 'react';
import { Product } from '../types';
import { Truck, Search, Save, Edit2, X } from 'lucide-react';

interface ShippingCostsProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
}

export const ShippingCosts: React.FC<ShippingCostsProps> = ({ products, onEditProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (p.type === 'satilan' || p.type === 'both')
  );

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.shippingCost || 0);
  };

  const handleSave = (product: Product) => {
    onEditProduct({ ...product, shippingCost: editValue });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Truck className="text-blue-600" size={32} />
            Sevkiyat Ücretleri
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Ürünlerin sevkiyat maliyetlerini tanımlayın.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Ürün Ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Ürün Adı</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Sevkiyat Ücreti (TL)</th>
                <th className="p-4 text-center w-32">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-bold text-slate-800">{product.name}</td>
                    <td className="p-4 text-slate-500">{product.cat}</td>
                    <td className="p-4 text-right">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-24 px-2 py-1 text-right border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono font-bold text-blue-600">
                          {product.shippingCost ? `${product.shippingCost.toLocaleString('tr-TR')} TL` : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === product.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleSave(product)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors">
                            <Save size={16} />
                          </button>
                          <button onClick={handleCancel} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleEditClick(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          <Edit2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
