import React, { useState, useEffect } from 'react';
import { Customer, Product, TransactionItem } from '../types';
import { Save, Plus, Trash2, ShoppingCart, Calendar, Search, ArrowRight } from 'lucide-react';

interface InvoiceBuilderProps {
  type: 'sales' | 'purchase';
  customers: Customer[];
  products: Product[];
  onSave: (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR') => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ type, customers, products, onSave }) => {
  const [selectedCust, setSelectedCust] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [items, setItems] = useState<TransactionItem[]>([
    { name: '', qty: 1, unit: 'Adet', price: 0, total: 0 }
  ]);

  // Reset form when type changes
  useEffect(() => {
    setItems([{ name: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
    setSelectedCust('');
    setCurrency('TL');
  }, [type]);

  // Filter products based on invoice type
  const filteredProducts = products.filter(p => {
      const targetType = type === 'sales' ? 'satilan' : 'alinan';
      return p.type === targetType || p.type === 'both';
  });

  const filteredCustomers = customers.filter(c => 
    type === 'sales' ? (c.type === 'musteri' || c.type === 'both') : (c.type === 'tedarikci' || c.type === 'both')
  );

  const handleProductChange = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    const newItems = [...items];
    newItems[index].name = productName;
    if (product) {
      newItems[index].price = product.price;
      newItems[index].unit = product.unit;
    }
    updateTotal(newItems, index);
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    updateTotal(newItems, index);
  };

  const updateTotal = (currentItems: TransactionItem[], index: number) => {
    const item = currentItems[index];
    item.total = item.qty * item.price;
    setItems(currentItems);
  };

  const addRow = () => {
    setItems([...items, { name: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
  };

  const removeRow = (index: number) => {
    if(items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    if (!selectedCust) {
        alert("Lütfen bir cari seçiniz.");
        return;
    }
    const validItems = items.filter(i => i.name && i.qty > 0);
    if (validItems.length === 0) {
        alert("Lütfen en az bir ürün giriniz.");
        return;
    }
    onSave(Number(selectedCust), date, validItems, currency);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        {/* Decorative Top Bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'sales' ? 'bg-primary' : 'bg-orange-500'}`}></div>

        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className={`text-2xl font-bold flex items-center ${type === 'sales' ? 'text-slate-800' : 'text-slate-800'}`}>
                <div className={`p-3 rounded-xl mr-3 text-white shadow-lg ${type === 'sales' ? 'bg-primary shadow-sky-200' : 'bg-orange-500 shadow-orange-200'}`}>
                    <ShoppingCart size={24} />
                </div>
                {type === 'sales' ? 'Satış Faturası Oluştur' : 'Alış Faturası Girişi'}
                </h2>
                <p className="text-slate-500 text-sm mt-2 ml-14">
                    {type === 'sales' ? 'Müşteriye yapılacak satışları buradan faturalandırın.' : 'Tedarikçiden gelen ürün veya hizmetleri girin.'}
                </p>
            </div>
            <div className="text-right hidden md:block">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fatura No</div>
                 <div className="text-xl font-mono font-bold text-slate-300">OTOMATİK</div>
            </div>
        </div>

        {/* Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100">
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">
                {type === 'sales' ? 'Müşteri Seçimi' : 'Tedarikçi Seçimi'}
            </label>
            <div className="relative">
                <select
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                value={selectedCust}
                onChange={e => setSelectedCust(Number(e.target.value))}
                >
                <option value="">Seçiniz...</option>
                {filteredCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                    <ArrowRight size={16} className="rotate-90" />
                </div>
            </div>
          </div>
          
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Fatura Tarihi</label>
            <div className="relative">
                <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-primary outline-none bg-white font-medium text-slate-700"
                value={date}
                onChange={e => setDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

           <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Para Birimi</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white font-bold text-slate-700 cursor-pointer"
              value={currency}
              onChange={e => setCurrency(e.target.value as any)}
            >
              <option value="TL">TL (Türk Lirası)</option>
              <option value="USD">USD (Amerikan Doları)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 mb-6 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-4 min-w-[300px]">Ürün / Hizmet Adı</th>
                <th className="px-4 py-4 w-32 text-center">Miktar</th>
                <th className="px-4 py-4 w-32 text-center">Birim</th>
                <th className="px-4 py-4 w-40 text-right">Birim Fiyat</th>
                <th className="px-4 py-4 w-40 text-right">Toplam Tutar</th>
                <th className="px-4 py-4 w-16 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <div className="relative">
                        <input
                        list={`products-${index}`}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="Ürün arayın..."
                        value={item.name}
                        onChange={e => handleProductChange(index, e.target.value)}
                        />
                         <Search size={14} className="absolute right-3 top-3 text-slate-300" />
                    </div>
                    <datalist id={`products-${index}`}>
                      {filteredProducts.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-slate-700"
                      value={item.qty}
                      onChange={e => updateItem(index, 'qty', parseFloat(e.target.value))}
                    />
                  </td>
                   <td className="p-3">
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-500 text-xs uppercase"
                      value={item.unit}
                      onChange={e => updateItem(index, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-right focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono text-slate-600"
                      value={item.price}
                      onChange={e => updateItem(index, 'price', parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg font-bold text-slate-800 font-mono border border-slate-100">
                        {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button 
                        onClick={() => removeRow(index)} 
                        className={`p-2 rounded-lg transition-colors ${items.length > 1 ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'}`}
                        disabled={items.length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button 
            onClick={addRow} 
            className="text-primary hover:text-white hover:bg-primary border border-primary/20 hover:border-primary px-6 py-3 rounded-xl font-bold flex items-center text-sm mb-10 transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} className="mr-2" /> Yeni Satır Ekle
        </button>

        {/* Footer Totals */}
        <div className="flex flex-col md:flex-row justify-end items-center border-t border-slate-100 pt-8 mt-8">
          <div className="text-right w-full md:w-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[300px]">
             <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ara Toplam</span>
                <span className="text-slate-700 font-mono font-bold">{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
             </div>
             
             <div className="flex justify-between items-center pt-4 border-t border-slate-200 mb-6">
                 <span className="text-slate-800 text-lg font-black uppercase tracking-wide">Genel Toplam</span>
                 <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-lg text-slate-400">{currency}</span>
                 </span>
             </div>

             <button 
                onClick={handleSave}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center active:scale-95 text-lg
                    ${type === 'sales' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-300/50' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-300/50'}`}
             >
                <Save className="mr-2" /> Faturayı Kaydet
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};