
import React, { useState } from 'react';
import { Product } from '../types';
import { Box, Plus, Tag, Ruler, Edit2, Trash2, Save, X, Search, Package, FileSpreadsheet, DollarSign } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export const Products: React.FC<ProductsProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct }) => {
  // Tabs: 'satilan' shows (satilan + both), 'alinan' shows (alinan + both)
  const [activeTab, setActiveTab] = useState<'satilan' | 'alinan'>('satilan');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<number | null>(null);
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // New Product State
  const initialNewProd = { name: '', type: 'satilan', unit: '', cat: '', purchasePrice: '', price: '', currency: 'TL' };
  
  // We use a temporary state that holds strings for inputs
  const [newProd, setNewProd] = useState<{
      name: string, 
      type: 'satilan'|'alinan'|'both', 
      unit: string, 
      cat: string, 
      purchasePrice: string,
      price: string,
      currency: 'TL' | 'USD' | 'EUR'
  }>({ ...initialNewProd, type: 'satilan', currency: 'TL' });

  // Editing Product State
  const [editForm, setEditForm] = useState<Product | null>(null);

  const handleAdd = () => {
    if (!newProd.name) return;
    onAddProduct({
      ...newProd,
      unit: newProd.unit || 'Adet',
      type: newProd.type,
      purchasePrice: parseFloat(newProd.purchasePrice) || 0,
      price: parseFloat(newProd.price) || 0,
      currency: newProd.currency
    });
    // Reset but keep the current type selection for convenience
    setNewProd({ ...initialNewProd, type: newProd.type, currency: 'TL' });
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

  const cancelEdit = () => {
      setIsEditing(null);
      setEditForm(null);
  };

  const confirmDelete = () => {
      if(deleteId) {
          onDeleteProduct(deleteId);
          setDeleteId(null);
      }
  };

  // Filter Logic:
  const filteredProducts = (products || []).filter(p => {
      const matchesTab = activeTab === 'satilan' 
        ? (p.type === 'satilan' || p.type === 'both') 
        : (p.type === 'alinan' || p.type === 'both');
      
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.cat || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
  });

  const handleExportExcel = () => {
      // Create CSV with BOM for Excel compatibility
      let csvContent = "\uFEFF"; 
      csvContent += "Ürün Listesi\n\n";
      csvContent += "ID;Ürün Adı;Tip;Kategori;Birim;Alış Fiyatı;Satış Fiyatı;Para Birimi\n";
      
      const exportList = activeTab === 'satilan' 
        ? (products || []).filter(p => p.type === 'satilan' || p.type === 'both')
        : (products || []).filter(p => p.type === 'alinan' || p.type === 'both');

      exportList.forEach(p => {
          const typeStr = p.type === 'satilan' ? 'Satılan' : p.type === 'alinan' ? 'Alınan' : 'Her İkisi';
          const purchasePriceStr = (p.purchasePrice || 0).toString().replace('.', ',');
          const priceStr = p.price.toString().replace('.', ',');
          csvContent += `${p.id};${p.name};${typeStr};${p.cat};${p.unit};${purchasePriceStr};${priceStr};${p.currency || 'TL'}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Urun_Listesi_${activeTab}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal 
        isOpen={!!deleteId}
        title="Ürünü Sil"
        message="Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
      
      {/* Quick Add Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
          <Package className="mr-2 text-primary" size={20} /> Hızlı Ürün Tanımla
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Ürün Adı</label>
             <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Örn: Chester Koltuk"
                value={newProd.name}
                onChange={e => setNewProd({...newProd, name: e.target.value})}
            />
          </div>
          
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tip</label>
            <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none bg-white text-sm"
                value={newProd.type}
                onChange={e => setNewProd({...newProd, type: e.target.value as any})}
            >
                <option value="satilan">Satılan (Ürün)</option>
                <option value="alinan">Alınan (Hammadde)</option>
                <option value="both">Her İkisi</option>
            </select>
          </div>

          <div className="md:col-span-1 space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Birim</label>
             <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none text-sm"
                placeholder="Adet"
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
          </div>
          
          <div className="md:col-span-2 space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Alış Fiyatı</label>
             <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none text-sm font-mono"
                placeholder="0.00"
                type="number"
                value={newProd.purchasePrice}
                onChange={e => setNewProd({...newProd, purchasePrice: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 space-y-1">
             <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Satış Fiyatı</label>
             <div className="flex">
                <input
                    className="w-full border border-slate-200 border-r-0 rounded-l-xl px-3 py-2.5 focus:ring-2 focus:ring-primary outline-none text-sm font-mono font-bold"
                    placeholder="0.00"
                    type="number"
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: e.target.value})}
                />
                <select 
                    className="bg-slate-50 border border-slate-200 rounded-r-xl px-2 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary"
                    value={newProd.currency}
                    onChange={e => setNewProd({...newProd, currency: e.target.value as any})}
                >
                    <option value="TL">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                </select>
             </div>
          </div>

          <div className="md:col-span-2">
            <button 
                onClick={handleAdd}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-medium transition-colors flex justify-center items-center shadow-lg active:scale-95"
                title="Ekle"
            >
                <Plus size={20} className="mr-2"/> Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row border-b border-slate-100">
          <div className="flex flex-1">
            <button 
                className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'satilan' ? 'bg-sky-50 text-sky-700 border-sky-500' : 'text-slate-400 hover:bg-slate-50 border-transparent hover:text-slate-600'}`}
                onClick={() => setActiveTab('satilan')}
            >
                Satılabilir Ürünler
            </button>
            <button 
                className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'alinan' ? 'bg-orange-50 text-orange-700 border-orange-500' : 'text-slate-400 hover:bg-slate-50 border-transparent hover:text-slate-600'}`}
                onClick={() => setActiveTab('alinan')}
            >
                Alınabilir Ürünler (Hammadde)
            </button>
          </div>
          <div className="p-2 border-l border-slate-100 bg-slate-50 w-full sm:w-80 flex items-center gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Ad veya kategori ara..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary outline-none text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-sm transition-colors"
                title="Listeyi Excel Olarak İndir"
             >
                 <FileSpreadsheet size={18} />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Ürün Adı</th>
                <th className="px-6 py-4">Tip</th>
                <th className="px-6 py-4">Birim</th>
                <th className="px-6 py-4 text-right">Alış Fiyatı</th>
                <th className="px-6 py-4 text-right">Satış Fiyatı</th>
                <th className="px-6 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.map(p => {
                 const editing = isEditing === p.id && editForm;
                 return (
                <tr key={p.id} className="hover:bg-slate-50/80 group transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-800">
                     {editing ? (
                        <input className="border border-primary rounded-lg px-2 py-1.5 w-full text-sm outline-none bg-white shadow-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} autoFocus />
                     ) : (
                        <div className="flex items-center">
                            <Box size={16} className="mr-3 text-slate-400" />
                            {p.name}
                            <span className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{p.cat}</span>
                        </div>
                     )}
                  </td>
                   <td className="px-6 py-3">
                     {editing ? (
                        <select className="border border-primary rounded-lg px-2 py-1.5 w-full text-xs outline-none bg-white" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                            <option value="satilan">Satılan</option>
                            <option value="alinan">Alınan</option>
                            <option value="both">Her İkisi</option>
                        </select>
                     ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                            ${p.type === 'satilan' ? 'bg-blue-50 text-blue-600 border-blue-100' : p.type === 'alinan' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}
                        `}>
                            {p.type === 'satilan' ? 'Satış' : p.type === 'alinan' ? 'Alış' : 'Her İkisi'}
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                     {editing ? (
                        <input className="border border-primary rounded-lg px-2 py-1.5 w-full text-xs outline-none bg-white" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                     ) : (
                        <div className="flex items-center gap-1.5">
                            <Ruler size={14} className="text-slate-300"/> {p.unit}
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-slate-500">
                      {editing ? (
                        <input type="number" className="border border-primary rounded-lg px-2 py-1.5 w-20 text-right text-xs outline-none bg-white" value={editForm.purchasePrice || ''} onChange={e => setEditForm({...editForm, purchasePrice: parseFloat(e.target.value)})} />
                      ) : (
                          p.purchasePrice ? `${p.purchasePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '-'
                      )}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-700">
                     {editing ? (
                        <div className="flex items-center justify-end gap-1">
                            <input type="number" className="border border-primary rounded-lg px-2 py-1.5 w-20 text-right text-xs outline-none bg-white" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} />
                            <select className="border border-primary rounded-lg px-1 py-1.5 text-xs outline-none bg-white" value={editForm.currency || 'TL'} onChange={e => setEditForm({...editForm, currency: e.target.value as any})}>
                                <option value="TL">TL</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                     ) : (
                        `${p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${p.currency || 'TL'}`
                     )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        {editing ? (
                            <>
                                <button onClick={saveEdit} className="p-1.5 text-white bg-green-500 rounded-lg hover:bg-green-600 shadow-sm" title="Kaydet"><Save size={16}/></button>
                                <button onClick={cancelEdit} className="p-1.5 text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200" title="İptal"><X size={16}/></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => startEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              )})}
              {filteredProducts.length === 0 && (
                  <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
