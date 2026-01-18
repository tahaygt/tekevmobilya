
import React, { useState, useEffect } from 'react';
import { Customer, Product, TransactionItem, Transaction } from '../types';
import { Save, Plus, Trash2, ShoppingCart, Calendar, Search, ArrowRight, Printer, Clock } from 'lucide-react';

interface InvoiceBuilderProps {
  type: 'sales' | 'purchase';
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  onSave: (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR', desc: string) => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ type, customers, products, transactions, onSave }) => {
  const [selectedCust, setSelectedCust] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [desc, setDesc] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }
  ]);

  // Reset form when type changes
  useEffect(() => {
    setItems([{ code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
    setSelectedCust('');
    setCurrency('TL');
    setDesc('');
  }, [type]);

  // Filter products based on invoice type
  const filteredProducts = products.filter(p => {
      const targetType = type === 'sales' ? 'satilan' : 'alinan';
      return p.type === targetType || p.type === 'both';
  });

  const filteredCustomers = customers.filter(c => 
    type === 'sales' ? (c.type === 'musteri' || c.type === 'both') : (c.type === 'tedarikci' || c.type === 'both')
  );

  // Get recent invoices of this type
  const recentInvoices = transactions
    .filter(t => t.type === (type === 'sales' ? 'sales' : 'purchase'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleProductChange = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    const newItems = [...items];
    newItems[index].name = productName;
    if (product) {
      // Don't auto-set code since products don't have codes anymore
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
    setItems([...items, { code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
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
    onSave(Number(selectedCust), date, validItems, currency, desc);
  };

  const printInvoice = (t: Transaction) => {
      if (!t.items || !t.accId) return;
      const cust = customers.find(c => c.id === t.accId);
      if (!cust) return;

      const formatDate = (d: string) => d.split('-').reverse().join('.');

      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fatura - ${t.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
             body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; padding: 40px; }
             @page { size: A4; margin: 0; }
          </style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto border border-slate-200 p-8 bg-white min-h-[900px] relative">
            
            <div class="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
               <div>
                  <h1 class="text-4xl font-black text-slate-900 tracking-widest">TEKDEMİR</h1>
                  <div class="text-sm text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">KOLTUK & MOBİLYA</div>
               </div>
               <div class="text-right">
                  <div class="text-3xl font-light text-slate-400 uppercase tracking-wide">Fatura</div>
                  <div class="text-sm font-bold text-slate-800 mt-2">#${t.id}</div>
                  <div class="text-sm text-slate-600 mt-1">${formatDate(t.date)}</div>
               </div>
            </div>

            <div class="mb-12 bg-slate-50 p-6 rounded-lg">
                <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Sayın</div>
                <h2 class="text-2xl font-bold text-slate-800">${cust.name}</h2>
                <div class="text-slate-600 mt-2 text-sm">
                    ${cust.address || 'Adres bilgisi girilmedi.'}<br>
                    ${cust.phone || ''}
                </div>
            </div>

            <table class="w-full text-sm mb-12">
                <thead>
                    <tr class="border-b-2 border-slate-800">
                        <th class="text-left py-3 font-bold text-slate-900 uppercase tracking-wide">Ürün / Hizmet</th>
                        <th class="text-left py-3 font-bold text-slate-900 uppercase tracking-wide">Açıklama</th>
                        <th class="text-center py-3 font-bold text-slate-900 uppercase tracking-wide">Miktar</th>
                        <th class="text-right py-3 font-bold text-slate-900 uppercase tracking-wide">Birim Fiyat</th>
                        <th class="text-right py-3 font-bold text-slate-900 uppercase tracking-wide">Tutar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${t.items.map(item => `
                        <tr>
                            <td class="py-4 text-slate-800 font-medium">
                                ${item.code ? `<span class="text-xs font-mono text-slate-500 mr-2">[${item.code}]</span>` : ''}
                                ${item.name}
                            </td>
                            <td class="py-4 text-slate-500 text-xs">${item.description || '-'}</td>
                            <td class="py-4 text-center text-slate-600">${item.qty} ${item.unit}</td>
                            <td class="py-4 text-right text-slate-600 font-mono">${item.price.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                            <td class="py-4 text-right text-slate-800 font-bold font-mono">${item.total.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="flex justify-end">
                <div class="w-1/2">
                    <div class="flex justify-between items-center py-4 border-t-2 border-slate-900">
                        <span class="text-lg font-bold text-slate-900">GENEL TOPLAM</span>
                        <span class="text-2xl font-black text-slate-900 font-mono">${t.total.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${t.currency}</span>
                    </div>
                </div>
            </div>

             ${t.desc ? `
            <div class="mt-8 pt-4 border-t border-slate-100">
                 <div class="text-xs font-bold text-slate-500 uppercase">Fatura Notu:</div>
                 <div class="text-sm text-slate-700 mt-1">${t.desc}</div>
            </div>
            ` : ''}

            <div class="absolute bottom-8 left-8 right-8 text-center border-t border-slate-100 pt-8">
                <p class="text-xs text-slate-400 italic">Tekdemir Koltuk - Teşekkür Ederiz.</p>
            </div>

          </div>
          <script>
             window.onload = () => { setTimeout(() => { window.print(); }, 500); }
          </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
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
                {/* Product Code Header: Only for Purchase */}
                {type === 'purchase' && (
                    <th className="px-4 py-4 w-24">Kod</th>
                )}
                <th className="px-4 py-4 w-48">Ürün / Hizmet Adı</th>
                <th className="px-4 py-4 w-48">Açıklama</th>
                <th className="px-4 py-4 w-24 text-center">Miktar</th>
                <th className="px-4 py-4 w-24 text-center">Birim</th>
                <th className="px-4 py-4 w-32 text-right">Birim Fiyat</th>
                <th className="px-4 py-4 w-32 text-right">Toplam</th>
                <th className="px-4 py-4 w-16 text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                  {/* Product Code Input: Only for Purchase */}
                  {type === 'purchase' && (
                    <td className="p-3">
                        <input
                            type="text"
                            className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-2 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-mono text-xs"
                            placeholder="Kod"
                            value={item.code || ''}
                            onChange={e => updateItem(index, 'code', e.target.value)}
                        />
                    </td>
                  )}
                  <td className="p-3">
                    <div className="relative">
                        <input
                        list={`products-${index}`}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        placeholder="Ürün..."
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
                        type="text"
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-xs"
                        placeholder="Satır açıklaması..."
                        value={item.description || ''}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                     />
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
                    <div className="px-3 py-2.5 bg-slate-50 rounded-lg font-bold text-slate-800 font-mono border border-slate-100 text-xs">
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

        {/* Footer Totals & Description */}
        <div className="flex flex-col md:flex-row justify-between items-end border-t border-slate-100 pt-8 mt-8 gap-8">
            {/* Description Moved to Bottom */}
            <div className="w-full md:flex-1">
                 <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Fatura Genel Notu (Opsiyonel)</label>
                 <textarea 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white text-sm placeholder:text-slate-400 h-32 resize-none"
                    placeholder="Fatura genel açıklaması..."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                 />
            </div>

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

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center">
            <Clock size={18} className="text-slate-400 mr-2"/>
            <h3 className="font-bold text-slate-700 text-sm uppercase">Son Eklenen {type === 'sales' ? 'Satış' : 'Alış'} Faturaları</h3>
        </div>
        <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 text-xs border-b border-slate-100">
                <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Cari</th>
                    <th className="px-4 py-3">Not</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                    <th className="px-4 py-3 text-center">İşlem</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-5">
                {recentInvoices.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.date.split('-').reverse().join('.')}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{t.accName}</td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{t.desc || (t.items ? `${t.items.length} Kalem` : '-')}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-slate-700">{t.total.toLocaleString('tr-TR', {minimumFractionDigits:2})} {t.currency}</td>
                        <td className="px-4 py-3 text-center">
                            <button onClick={() => printInvoice(t)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800" title="Yazdır">
                                <Printer size={16} />
                            </button>
                        </td>
                    </tr>
                ))}
                {recentInvoices.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-xs">Henüz fatura girişi yapılmamış.</td></tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
