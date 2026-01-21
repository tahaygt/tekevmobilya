
import React, { useState, useEffect, useRef } from 'react';
import { Customer, Product, TransactionItem, Transaction } from '../types';
import { Save, Plus, Trash2, ShoppingCart, Calendar, Search, ArrowRight, Printer, Clock, User, Phone, MapPin, Truck, Store, UserPlus, Upload, FileImage, X } from 'lucide-react';

interface InvoiceBuilderProps {
  type: 'sales' | 'purchase';
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  onSave: (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR', desc: string, retailDetails?: any, fileData?: { name: string, type: string, base64: string }) => void;
  panelMode?: 'accounting' | 'store';
  onAddCustomer?: (customer: Omit<Customer, 'id' | 'balances'>) => Promise<Customer>;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ type, customers, products, transactions, onSave, panelMode, onAddCustomer }) => {
  const [selectedBranch, setSelectedBranch] = useState<number | ''>(''); // Satışı yapan şube
  const [selectedRetailCust, setSelectedRetailCust] = useState<number | ''>(''); // Gerçek müşteri (Borçlu)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [desc, setDesc] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }
  ]);

  // Quick Customer Create State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone1, setNewCustPhone1] = useState(''); // Changed from newCustPhone
  const [newCustPhone2, setNewCustPhone2] = useState(''); // Added Phone 2
  
  // Retail / Delivery Details State (For Logistics Only)
  const [deliveryDate, setDeliveryDate] = useState('');
  const [retailAddress, setRetailAddress] = useState('');

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string, type: string, base64: string } | null>(null);

  // Reset form when type changes
  useEffect(() => {
    setItems([{ code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
    setSelectedBranch('');
    setSelectedRetailCust('');
    setCurrency('TL');
    setDesc('');
    setDeliveryDate('');
    setRetailAddress('');
    setSelectedFile(null);
  }, [type]);

  // Filter products
  const filteredProducts = products.filter(p => {
      const targetType = type === 'sales' ? 'satilan' : 'alinan';
      return p.type === targetType || p.type === 'both';
  });

  // Filter customers for Dropdowns
  const allCustomers = customers;
  
  // Recent Invoices
  const recentInvoices = transactions
    .filter(t => t.type === (type === 'sales' ? 'sales' : 'purchase'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // --- Quick Customer Add Handler ---
  const handleQuickAddCustomer = async () => {
    if (!newCustName || !onAddCustomer) return;
    
    try {
        const newCust = await onAddCustomer({
            name: newCustName,
            phone: newCustPhone1,
            phone2: newCustPhone2, // Added Phone 2
            address: '', // Removed address from quick add
            type: 'musteri',
            section: panelMode || 'accounting'
        });
        
        setSelectedRetailCust(newCust.id);
        setShowQuickAdd(false);
        setNewCustName('');
        setNewCustPhone1('');
        setNewCustPhone2('');
        // Address is empty for new quick customers
        setRetailAddress('');
    } catch (e) {
        alert("Müşteri oluşturulurken hata oluştu.");
    }
  };

  // --- File Upload Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Size check (e.g. max 5MB)
          if (file.size > 5 * 1024 * 1024) {
              alert("Dosya boyutu çok büyük! Lütfen 5MB'dan küçük bir dosya seçiniz.");
              return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  const base64String = event.target.result.toString().split(',')[1]; // Remove data:image/png;base64, prefix
                  setSelectedFile({
                      name: file.name,
                      type: file.type,
                      base64: base64String
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

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
    setItems([...items, { code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }]);
  };

  const removeRow = (index: number) => {
    if(items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSave = () => {
    // Validation
    const mainCustomer = type === 'sales' ? selectedRetailCust : selectedBranch;
    
    if (!mainCustomer) {
        alert(type === 'sales' ? "Lütfen bir müşteri seçiniz." : "Lütfen tedarikçi seçiniz.");
        return;
    }
    
    if (type === 'sales' && !selectedBranch) {
        alert("Lütfen satışı yapan şubeyi seçiniz.");
        return;
    }

    const validItems = items.filter(i => i.name && i.qty > 0);
    if (validItems.length === 0) {
        alert("Lütfen en az bir ürün giriniz.");
        return;
    }
    
    // Find customer object to get name/phone for snapshot
    const retailCustObj = customers.find(c => c.id === selectedRetailCust);

    // Details Object
    const retailDetails = {
        branchId: type === 'sales' ? Number(selectedBranch) : undefined,
        retailName: retailCustObj?.name || '',
        retailPhone1: retailCustObj?.phone || '',
        retailPhone2: retailCustObj?.phone2 || '', // Added Phone 2 Mapping
        retailAddress: retailAddress || retailCustObj?.address || '', // Prefer typed address, fallback to stored
        deliveryDate
    };

    // Pass file data (undefined if null)
    onSave(Number(mainCustomer), date, validItems, currency, desc, retailDetails, selectedFile || undefined);
  };

  // ... (Print Logic remains same, removed for brevity but included in output if needed)
  const printInvoice = (t: Transaction) => {
      if (!t.items || !t.accId) return;
      const cust = customers.find(c => c.id === t.accId);
      if (!cust) return;
      const formatDate = (d: string) => d ? d.split('-').reverse().join('.') : '-';
      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fatura - ${t.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; padding: 40px; } @page { size: A4; margin: 0; }</style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto border border-slate-200 p-8 bg-white min-h-[900px] relative">
            <div class="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
               <div><h1 class="text-4xl font-black text-slate-900 tracking-widest">TEKDEMİR</h1><div class="text-sm text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">KOLTUK & MOBİLYA</div></div>
               <div class="text-right"><div class="text-3xl font-light text-slate-400 uppercase tracking-wide">Fatura</div><div class="text-sm font-bold text-slate-800 mt-2">#${t.id}</div><div class="text-sm text-slate-600 mt-1">${formatDate(t.date)}</div></div>
            </div>
            <div class="grid grid-cols-2 gap-8 mb-12">
                <div class="bg-slate-50 p-6 rounded-lg">
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Sayın (Müşteri)</div>
                    <h2 class="text-xl font-bold text-slate-800">${cust.name}</h2>
                    <div class="text-slate-600 mt-2 text-sm">${cust.address || ''}<br>${cust.phone || ''} ${cust.phone2 ? '/ ' + cust.phone2 : ''}</div>
                </div>
                ${(t.retailAddress || t.deliveryDate) ? `
                <div class="bg-orange-50 p-6 rounded-lg border border-orange-100">
                    <div class="text-xs text-orange-400 font-bold uppercase tracking-wider mb-2">Teslimat Detayları</div>
                    <div class="text-slate-700 mt-2 text-sm space-y-1">
                        ${t.retailAddress ? `<div><strong>Adres:</strong> ${t.retailAddress}</div>` : ''}
                        ${t.deliveryDate ? `<div class="mt-2 pt-2 border-t border-orange-200 text-orange-800 font-bold">Teslimat: ${formatDate(t.deliveryDate)}</div>` : ''}
                    </div>
                </div>` : ''}
            </div>
            <table class="w-full text-sm mb-12">
                <thead><tr class="border-b-2 border-slate-800"><th class="text-left py-3 font-bold text-slate-900">Ürün</th><th class="text-center py-3 font-bold text-slate-900">Miktar</th><th class="text-right py-3 font-bold text-slate-900">Fiyat</th><th class="text-right py-3 font-bold text-slate-900">Tutar</th></tr></thead>
                <tbody class="divide-y divide-slate-100">${t.items.map(i => `<tr><td class="py-4 font-medium">${i.name}</td><td class="py-4 text-center">${i.qty} ${i.unit}</td><td class="py-4 text-right">${i.price.toLocaleString('tr-TR')}</td><td class="py-4 text-right font-bold">${i.total.toLocaleString('tr-TR')}</td></tr>`).join('')}</tbody>
            </table>
            <div class="flex justify-end"><div class="w-1/2 flex justify-between items-center py-4 border-t-2 border-slate-900"><span class="text-lg font-bold">TOPLAM</span><span class="text-2xl font-black">${t.total.toLocaleString('tr-TR', {minimumFractionDigits:2})} ${t.currency}</span></div></div>
            ${t.desc ? `<div class="mt-8 pt-4 border-t border-slate-100 text-sm text-slate-700">Not: ${t.desc}</div>` : ''}
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'sales' ? 'bg-primary' : 'bg-orange-500'}`}></div>

        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className={`text-2xl font-bold flex items-center ${type === 'sales' ? 'text-slate-800' : 'text-slate-800'}`}>
                <div className={`p-3 rounded-xl mr-3 text-white shadow-lg ${type === 'sales' ? 'bg-primary shadow-sky-200' : 'bg-orange-500 shadow-orange-200'}`}>
                    <ShoppingCart size={24} />
                </div>
                {type === 'sales' ? 'Satış Faturası Oluştur' : 'Alış Faturası Girişi'}
                </h2>
            </div>
            <div className="text-right hidden md:block">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fatura No</div>
                 <div className="text-xl font-mono font-bold text-slate-300">OTOMATİK</div>
            </div>
        </div>

        {/* --- CARİ İÇİNDE CARİ SEÇİM ALANI --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 relative">
          
          {type === 'sales' ? (
              <>
                 {/* 1. SATIŞI YAPAN (ŞUBE) */}
                 <div className="md:col-span-4 border-r border-slate-200 pr-4">
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide ml-1 flex items-center">
                        <Store size={12} className="mr-1"/> Satışı Yapan Şube (Stok Kaynağı)
                    </label>
                    <div className="relative">
                        <select
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white font-bold text-slate-700"
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(Number(e.target.value))}
                        >
                        <option value="">Şube Seçiniz...</option>
                        {allCustomers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        </select>
                    </div>
                 </div>

                 {/* 2. MÜŞTERİ (BORÇLU) */}
                 <div className="md:col-span-8 pl-0 md:pl-2">
                    <label className="block text-[10px] font-bold text-primary mb-2 uppercase tracking-wide ml-1 flex items-center">
                        <User size={12} className="mr-1"/> Müşteri (Borçlu Hesabı)
                    </label>
                    <div className="flex gap-2">
                         <div className="relative flex-1">
                            <select
                                className="w-full border border-primary/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white font-bold text-slate-800"
                                value={selectedRetailCust}
                                onChange={e => {
                                    setSelectedRetailCust(Number(e.target.value));
                                    const c = customers.find(x => x.id === Number(e.target.value));
                                    if(c) setRetailAddress(c.address || '');
                                }}
                            >
                                <option value="">Müşteri Seçiniz...</option>
                                {allCustomers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={() => setShowQuickAdd(!showQuickAdd)}
                            className={`px-4 rounded-xl font-bold transition-all flex items-center shadow-md active:scale-95 whitespace-nowrap
                                ${showQuickAdd ? 'bg-slate-200 text-slate-600' : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'}
                            `}
                        >
                            {showQuickAdd ? 'İptal' : <><UserPlus size={18} className="mr-2"/> Yeni Müşteri</>}
                        </button>
                    </div>

                    {/* Quick Add Form */}
                    {showQuickAdd && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                            <h4 className="text-green-800 font-bold text-xs uppercase mb-3 flex items-center"><Plus size={12} className="mr-1"/> Hızlı Müşteri Oluştur</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="text" placeholder="Ad Soyad" className="border border-green-200 rounded-lg p-2 text-sm outline-none focus:border-green-500" value={newCustName} onChange={e => setNewCustName(e.target.value)} autoFocus />
                                <input type="text" placeholder="Telefon 1" className="border border-green-200 rounded-lg p-2 text-sm outline-none focus:border-green-500" value={newCustPhone1} onChange={e => setNewCustPhone1(e.target.value)} />
                                <input type="text" placeholder="Telefon 2" className="border border-green-200 rounded-lg p-2 text-sm outline-none focus:border-green-500" value={newCustPhone2} onChange={e => setNewCustPhone2(e.target.value)} />
                            </div>
                            <button onClick={handleQuickAddCustomer} className="mt-3 w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 text-sm">
                                Müşteriyi Kaydet ve Seç
                            </button>
                        </div>
                    )}
                 </div>
              </>
          ) : (
             <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Tedarikçi Seçimi</label>
                <select
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none bg-white"
                value={selectedBranch}
                onChange={e => setSelectedBranch(Number(e.target.value))}
                >
                <option value="">Seçiniz...</option>
                {allCustomers.filter(c => c.type === 'tedarikci' || c.type === 'both').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                </select>
             </div>
          )}
        </div>
        
        {/* Date & Currency Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Fatura Tarihi</label>
                <div className="relative">
                    <input type="date" className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 outline-none bg-white font-medium text-slate-700" value={date} onChange={e => setDate(e.target.value)} />
                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                </div>
             </div>
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Para Birimi</label>
                <select className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none bg-white font-bold text-slate-700" value={currency} onChange={e => setCurrency(e.target.value as any)}>
                  <option value="TL">TL (Türk Lirası)</option>
                  <option value="USD">USD (Amerikan Doları)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
             </div>
        </div>

        {/* LOGISTICS / DELIVERY & FILE UPLOAD */}
        {type === 'sales' && (
            <div className="mb-8 bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 min-w-[150px]">
                    <Truck size={18} className="text-orange-500" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Teslimat ve Lojistik Detay</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                     <div className="md:col-span-5 relative">
                        <input type="text" className="w-full border border-orange-200 rounded-lg px-3 py-2 outline-none bg-white text-sm" placeholder="Teslimat Adresi" value={retailAddress} onChange={e => setRetailAddress(e.target.value)} />
                        <MapPin size={14} className="absolute right-3 top-2.5 text-orange-300" />
                     </div>
                     <div className="md:col-span-3 relative">
                        <input type="date" className="w-full border border-orange-200 rounded-lg px-3 py-2 outline-none bg-white text-sm" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                     </div>

                     {/* FILE UPLOAD BUTTON */}
                     <div className="md:col-span-4 relative">
                        <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        {selectedFile ? (
                            <div className="flex items-center justify-between bg-green-100 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                                <div className="flex items-center truncate">
                                    <FileImage size={16} className="mr-2 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="text-green-600 hover:text-red-500"><X size={16}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-white border border-dashed border-orange-300 rounded-lg px-3 py-2 text-sm text-orange-600 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center"
                            >
                                <Upload size={16} className="mr-2" /> İrsaliye Görseli Yükle
                            </button>
                        )}
                     </div>
                </div>
            </div>
        )}

        {/* Dynamic Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 mb-6 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {type === 'purchase' && <th className="px-4 py-4 w-24">Kod</th>}
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
                  {type === 'purchase' && (
                    <td className="p-3">
                        <input type="text" className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-xs outline-none" placeholder="Kod" value={item.code || ''} onChange={e => updateItem(index, 'code', e.target.value)} />
                    </td>
                  )}
                  <td className="p-3">
                    <div className="relative">
                        <input list={`products-${index}`} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 outline-none font-medium" placeholder="Ürün..." value={item.name} onChange={e => handleProductChange(index, e.target.value)} />
                        <Search size={14} className="absolute right-3 top-3 text-slate-300" />
                    </div>
                    <datalist id={`products-${index}`}>{filteredProducts.map(p => <option key={p.id} value={p.name} />)}</datalist>
                  </td>
                  <td className="p-3"><input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none" placeholder="Açıklama" value={item.description || ''} onChange={e => updateItem(index, 'description', e.target.value)} /></td>
                  <td className="p-3"><input type="number" className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center font-bold" value={item.qty} onChange={e => updateItem(index, 'qty', parseFloat(e.target.value))} /></td>
                   <td className="p-3"><input type="text" className="w-full border border-slate-200 rounded-lg px-2 py-2.5 text-center text-xs uppercase" value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} /></td>
                  <td className="p-3"><input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-right font-mono" value={item.price} onChange={e => updateItem(index, 'price', parseFloat(e.target.value))} /></td>
                  <td className="p-3 text-right"><div className="px-3 py-2.5 bg-slate-50 rounded-lg font-bold font-mono border border-slate-100 text-xs">{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div></td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(index)} className={`p-2 rounded-lg ${items.length > 1 ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-200 cursor-not-allowed'}`} disabled={items.length <= 1}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addRow} className="text-primary hover:text-white hover:bg-primary border border-primary/20 hover:border-primary px-6 py-3 rounded-xl font-bold flex items-center text-sm mb-10 transition-all shadow-sm active:scale-95"><Plus size={18} className="mr-2" /> Yeni Satır Ekle</button>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-end border-t border-slate-100 pt-8 mt-8 gap-8">
            <div className="w-full md:flex-1">
                 <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide ml-1">Fatura Genel Notu</label>
                 <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none text-sm h-32 resize-none" placeholder="Açıklama..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            <div className="text-right w-full md:w-auto bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[300px]">
                <div className="flex justify-between items-center mb-4"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ara Toplam</span><span className="text-slate-700 font-mono font-bold">{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span></div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 mb-6"><span className="text-slate-800 text-lg font-black uppercase tracking-wide">Genel Toplam</span><span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-lg text-slate-400">{currency}</span></span></div>
                <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center active:scale-95 text-lg ${type === 'sales' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-orange-600 hover:bg-orange-700'}`}><Save className="mr-2" /> Faturayı Kaydet</button>
            </div>
        </div>
      </div>
      
       {/* Recent Invoices Table (Keeping compact) */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center"><Clock size={18} className="text-slate-400 mr-2"/><h3 className="font-bold text-slate-700 text-sm uppercase">Son Eklenen Faturalar</h3></div>
        <table className="w-full text-left text-sm"><thead className="bg-white text-slate-500 text-xs border-b border-slate-100"><tr><th className="px-4 py-3">Tarih</th><th className="px-4 py-3">Cari</th><th className="px-4 py-3">Müşteri</th><th className="px-4 py-3 text-right">Tutar</th><th className="px-4 py-3 text-center">İşlem</th></tr></thead>
            <tbody className="divide-y divide-slate-5">{recentInvoices.map(t => (<tr key={t.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs text-slate-600">{t.date.split('-').reverse().join('.')}</td><td className="px-4 py-3 font-medium text-slate-800">{t.accName}</td><td className="px-4 py-3 text-slate-500 text-xs">{t.retailName || '-'}</td><td className="px-4 py-3 text-right font-bold font-mono text-slate-700">{t.total} {t.currency}</td><td className="px-4 py-3 text-center"><button onClick={() => printInvoice(t)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500"><Printer size={16}/></button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};
