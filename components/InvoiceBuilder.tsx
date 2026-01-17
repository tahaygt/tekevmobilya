import React, { useState, useEffect } from 'react';
import { Customer, Product, TransactionItem } from '../types';
import { Save, Plus, Trash2, ShoppingCart, Calendar } from 'lucide-react';

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

  const filteredProducts = products.filter(p => p.type === (type === 'sales' ? 'satilan' : 'alinan'));
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
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className={`text-2xl font-bold mb-8 flex items-center ${type === 'sales' ? 'text-primary' : 'text-orange-600'}`}>
          <ShoppingCart className="mr-3" />
          {type === 'sales' ? 'Satış Faturası Oluştur' : 'Alış Faturası Girişi'}
        </h2>

        {/* Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Cari Hesap</label>
            <select
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none bg-white"
              value={selectedCust}
              onChange={e => setSelectedCust(Number(e.target.value))}
            >
              <option value="">Seçiniz...</option>
              {filteredCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Fatura Tarihi</label>
            <div className="relative">
                <input
                type="date"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none bg-white pl-10"
                value={date}
                onChange={e => setDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Para Birimi</label>
            <select
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none bg-white font-bold"
              value={currency}
              onChange={e => setCurrency(e.target.value as any)}
            >
              <option value="TL">TL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 mb-6 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-4 min-w-[250px]">Ürün / Hizmet</th>
                <th className="px-4 py-4 w-24 text-center">Miktar</th>
                <th className="px-4 py-4 w-24 text-center">Birim</th>
                <th className="px-4 py-4 w-32 text-right">Birim Fiyat</th>
                <th className="px-4 py-4 w-32 text-right">Tutar</th>
                <th className="px-4 py-4 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="p-3">
                    <input
                      list={`products-${index}`}
                      className="w-full border border-slate-300 rounded p-2 focus:border-primary outline-none"
                      placeholder="Ürün ara veya yaz..."
                      value={item.name}
                      onChange={e => handleProductChange(index, e.target.value)}
                    />
                    <datalist id={`products-${index}`}>
                      {filteredProducts.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded p-2 text-center focus:border-primary outline-none"
                      value={item.qty}
                      onChange={e => updateItem(index, 'qty', parseFloat(e.target.value))}
                    />
                  </td>
                   <td className="p-3">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded p-2 text-center focus:border-primary outline-none"
                      value={item.unit}
                      onChange={e => updateItem(index, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      className="w-full border border-slate-300 rounded p-2 text-right focus:border-primary outline-none"
                      value={item.price}
                      onChange={e => updateItem(index, 'price', parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700 font-mono">
                    {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addRow} className="text-primary hover:text-sky-700 font-bold flex items-center text-sm mb-10 transition-colors">
          <Plus size={18} className="mr-1" /> Yeni Satır Ekle
        </button>

        {/* Footer Totals */}
        <div className="flex flex-col md:flex-row justify-end items-center border-t border-slate-100 pt-8">
          <div className="text-right w-full md:w-auto">
             <div className="text-slate-500 text-sm mb-1 font-medium uppercase tracking-wide">Genel Toplam</div>
             <div className="text-4xl font-bold text-slate-800 mb-8 font-mono">
                {grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-2xl text-slate-400">{currency}</span>
             </div>
             <button 
                onClick={handleSave}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center active:scale-95"
             >
                <Save className="mr-2" /> Faturayı Kaydet
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};