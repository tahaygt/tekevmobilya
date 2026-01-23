
import React, { useState, useEffect, useRef } from 'react';
import { Customer, Product, TransactionItem, Transaction } from '../types';
import { Save, Plus, Trash2, ShoppingCart, Calendar, Search, ArrowRight, Printer, Clock, User, Phone, MapPin, Truck, Store, UserPlus, Upload, FileImage, X, UserCheck, Receipt, Hash, FileUp, Check, Image as ImageIcon } from 'lucide-react';

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
  const [selectedBranch, setSelectedBranch] = useState<number | ''>(''); 
  const [selectedRetailCust, setSelectedRetailCust] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [desc, setDesc] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { code: '', name: '', description: '', qty: 1, unit: 'Adet', price: 0, total: 0 }
  ]);

  // Quick Customer Create State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone1, setNewCustPhone1] = useState(''); 
  const [newCustPhone2, setNewCustPhone2] = useState(''); 
  
  // Retail / Delivery Details State
  const [deliveryDate, setDeliveryDate] = useState('');
  const [retailAddress, setRetailAddress] = useState('');
  const [salesRep, setSalesRep] = useState('');

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
    setSalesRep('');
    setSelectedFile(null);
  }, [type]);

  // Filter products
  const filteredProducts = products.filter(p => {
      const targetType = type === 'sales' ? 'satilan' : 'alinan';
      return p.type === targetType || p.type === 'both';
  });

  const allCustomers = customers;
  const recentInvoices = transactions
    .filter(t => t.type === (type === 'sales' ? 'sales' : 'purchase'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleQuickAddCustomer = async () => {
    if (!newCustName || !onAddCustomer) return;
    const parentId = (panelMode === 'store' && selectedBranch) ? Number(selectedBranch) : undefined;

    try {
        const newCust = await onAddCustomer({
            name: newCustName,
            phone: newCustPhone1,
            phone2: newCustPhone2, 
            address: '',
            type: 'musteri',
            section: panelMode || 'accounting',
            parentId: parentId 
        });
        
        setSelectedRetailCust(newCust.id);
        setShowQuickAdd(false);
        setNewCustName('');
        setNewCustPhone1('');
        setNewCustPhone2('');
        setRetailAddress('');
    } catch (e) {
        alert("Müşteri oluşturulurken hata oluştu.");
    }
  };

  // --- IMAGE COMPRESSION HELPER ---
  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 600; // Genişliği düşürdük
                  const scaleSize = MAX_WIDTH / img.width;
                  const finalScale = scaleSize < 1 ? scaleSize : 1; 
                  
                  canvas.width = img.width * finalScale;
                  canvas.height = img.height * finalScale;
                  
                  const ctx = canvas.getContext('2d');
                  if (!ctx) { reject("Canvas error"); return; }
                  
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  // Kaliteyi 0.5'e düşürdük
                  const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  resolve(base64);
              };
              img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              const compressedBase64 = await compressImage(file);
              // Güvenlik kontrolü: String çok uzunsa uyarı ver
              if(compressedBase64.length > 500000) { // Limit biraz daha esnek
                  alert("Görsel sıkıştırılmasına rağmen çok büyük. Lütfen daha düşük çözünürlüklü bir fotoğraf deneyin.");
              }
              setSelectedFile({
                  name: file.name,
                  type: 'image/jpeg',
                  base64: compressedBase64
              });
          } catch (error) {
              console.error("Görsel sıkıştırma hatası:", error);
              alert("Görsel işlenirken bir hata oluştu.");
          }
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
    const mainCustomer = type === 'sales' ? selectedRetailCust : selectedBranch;
    
    // Muhasebe modunda şube seçimi zorunlu değil (selectedBranch pas geçilir)
    // Ama müşteri seçimi zorunlu
    if (type === 'sales' && !selectedRetailCust) {
        alert("Lütfen bir müşteri seçiniz.");
        return;
    }
    if (type === 'purchase' && !selectedBranch) {
        alert("Lütfen tedarikçi seçiniz.");
        return;
    }

    // Mağaza modunda Şube Zorunlu
    if (type === 'sales' && panelMode === 'store' && !selectedBranch) {
        alert("Lütfen satışı yapan şubeyi seçiniz.");
        return;
    }

    const validItems = items.filter(i => i.name && i.qty > 0);
    if (validItems.length === 0) {
        alert("Lütfen en az bir ürün giriniz.");
        return;
    }
    
    const retailCustObj = customers.find(c => c.id === selectedRetailCust);
    const retailDetails = {
        branchId: (type === 'sales' && selectedBranch) ? Number(selectedBranch) : undefined,
        retailName: retailCustObj?.name || '',
        retailPhone1: retailCustObj?.phone || '',
        retailPhone2: retailCustObj?.phone2 || '',
        retailAddress: retailAddress || retailCustObj?.address || '',
        deliveryDate,
        salesRep: panelMode === 'store' ? salesRep : undefined
    };

    // Eğer muhasebe modundaysak ve satışsa, kaynak (branch) ID olmadığı için mainCustomer (RetailCust) kullanılır.
    // Ancak onSave parametreleri (customerId, ...) şeklindedir.
    // Satış faturasında borçlanan müşteridir (selectedRetailCust).
    // Alış faturasında alacaklanan tedarikçidir (selectedBranch).
    
    // NOT: Accounting modunda Sales -> selectedRetailCust var. selectedBranch yok.
    // onSave ilk parametresi: Transaction'un accId'si (Cari Hesap ID).
    // Sales işleminde AccID = Müşteri
    // Purchase işleminde AccID = Tedarikçi
    
    let targetAccountId: number;
    if (type === 'sales') {
        targetAccountId = Number(selectedRetailCust);
    } else {
        targetAccountId = Number(selectedBranch);
    }

    onSave(targetAccountId, date, validItems, currency, desc, retailDetails, selectedFile || undefined);
  };

  const printInvoice = (t: Transaction) => {
      if (!t.items || !t.accId) return;
      const printWindow = window.open('', '', 'width=800,height=1000');
      if (!printWindow) return;
      const dateStr = t.date.split('-').reverse().join('.');
      const html = `<html><head><title>Fatura Yazdır</title></head><body onload="window.print()">${t.accName} - ${dateStr}</body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // --- STYLES ---
  const inputClass = "w-full border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 transition-all bg-white";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1 block";

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out] pb-20">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-200 ${type === 'sales' ? 'bg-sky-500' : 'bg-orange-500'}`}>
                    {type === 'sales' ? <ShoppingCart size={28} /> : <Truck size={28} />}
                </div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                    {type === 'sales' ? 'Satış Faturası Oluştur' : 'Alış Faturası Oluştur'}
                </h2>
            </div>
            <div className="text-right opacity-40">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">FATURA NO</div>
                <div className="text-2xl font-black font-mono text-slate-400">OTOMATİK</div>
            </div>
        </div>

        {/* ROW 1: Source & Target */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            
            {/* Şube Seçimi (Sadece Mağaza Modunda veya Alış Faturasında Tedarikçi seçimi olarak görünür) */}
            {(panelMode === 'store' || type === 'purchase') && (
                <div className="lg:col-span-4">
                    <label className={labelClass}>
                        {type === 'sales' ? 'SATIŞI YAPAN ŞUBE (STOK KAYNAĞI)' : 'TEDARİKÇİ'}
                    </label>
                    <div className="relative">
                        <Store size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        <select
                            className={`${inputClass} pl-11 appearance-none`}
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(Number(e.target.value))}
                        >
                            <option value="">{type === 'sales' ? 'Şube Seçiniz...' : 'Tedarikçi Seçiniz...'}</option>
                            {type === 'sales' 
                                ? allCustomers.filter(c => c.section === 'store' && !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                : allCustomers.filter(c => c.type === 'tedarikci' || c.type === 'both').map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            }
                        </select>
                    </div>
                </div>
            )}

            {/* Müşteri Seçimi */}
            {type === 'sales' && (
                <div className={`${(panelMode === 'store' || type === 'purchase') ? 'lg:col-span-6' : 'lg:col-span-10'}`}>
                    <label className={`${labelClass} text-sky-500`}>MÜŞTERİ (BORÇLU HESABI)</label>
                    {!showQuickAdd ? (
                        <div className="relative">
                             <User size={18} className="absolute left-4 top-3.5 text-slate-400" />
                            <select
                                className={`${inputClass} pl-11 appearance-none border-sky-200 ring-4 ring-sky-500/5`}
                                value={selectedRetailCust}
                                onChange={e => {
                                    setSelectedRetailCust(Number(e.target.value));
                                    const c = customers.find(x => x.id === Number(e.target.value));
                                    if(c) setRetailAddress(c.address || '');
                                }}
                            >
                                <option value="">Müşteri Seçiniz...</option>
                                {allCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                <input type="text" placeholder="Ad Soyad" className="col-span-2 border border-slate-300 rounded-lg p-2 text-sm outline-none" value={newCustName} onChange={e => setNewCustName(e.target.value)} autoFocus />
                                <input type="text" placeholder="Tel 1" className="border border-slate-300 rounded-lg p-2 text-sm outline-none" value={newCustPhone1} onChange={e => setNewCustPhone1(e.target.value)} />
                                <input type="text" placeholder="Tel 2" className="border border-slate-300 rounded-lg p-2 text-sm outline-none" value={newCustPhone2} onChange={e => setNewCustPhone2(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleQuickAddCustomer} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm">Kaydet ve Seç</button>
                                <button onClick={() => setShowQuickAdd(false)} className="px-4 bg-slate-200 text-slate-600 font-bold py-2 rounded-lg text-sm">İptal</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Yeni Müşteri Butonu */}
            {type === 'sales' && !showQuickAdd && (
                <div className="lg:col-span-2 flex items-end">
                    <button 
                        onClick={() => setShowQuickAdd(true)}
                        className="w-full h-[46px] bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} /> <span className="text-sm">Yeni Müşteri</span>
                    </button>
                </div>
            )}
        </div>

        {/* ROW 2: Date & Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
                <label className={labelClass}>FATURA TARİHİ</label>
                <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                        type="date" 
                        className={`${inputClass} pl-11`}
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                    />
                </div>
            </div>
            <div>
                <label className={labelClass}>PARA BİRİMİ</label>
                <select 
                    className={inputClass}
                    value={currency} 
                    onChange={e => setCurrency(e.target.value as any)}
                >
                    <option value="TL">TL (Türk Lirası)</option>
                    <option value="USD">USD (Amerikan Doları)</option>
                    <option value="EUR">EUR (Euro)</option>
                </select>
            </div>
        </div>

        {/* ROW 3: Logistics (Sadece Mağaza Modunda Göster) */}
        {type === 'sales' && panelMode === 'store' && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Truck className="text-orange-500" size={20} />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">TESLİMAT VE LOJİSTİK DETAY</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                         <input type="text" className="w-full h-[50px] px-4 border border-orange-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white placeholder-slate-400" placeholder="Teslimat Adresi" value={retailAddress} onChange={e => setRetailAddress(e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                         <input type="date" className="w-full h-[50px] px-4 border border-orange-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white text-slate-600" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} placeholder="Teslim Tarihi" />
                    </div>
                    <div className="md:col-span-3">
                         <input type="text" className="w-full h-[50px] px-4 border border-orange-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white placeholder-slate-400" placeholder="Satış Temsilcisi" value={salesRep} onChange={e => setSalesRep(e.target.value)} />
                    </div>
                </div>
            </div>
        )}

        {/* ITEMS TABLE */}
        <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                        <th className="px-4 py-3 w-12">#</th>
                        <th className="px-4 py-3">Ürün / Hizmet</th>
                        <th className="px-4 py-3 w-24">Miktar</th>
                        <th className="px-4 py-3 w-32">Birim Fiyat</th>
                        <th className="px-4 py-3 w-32 text-right">Toplam</th>
                        <th className="px-4 py-3 w-12"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => (
                        <tr key={index} className="group hover:bg-slate-50">
                            <td className="px-4 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">
                                <input 
                                    list="products" 
                                    className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder-slate-300" 
                                    placeholder="Ürün seçin veya yazın..."
                                    value={item.name}
                                    onChange={e => handleProductChange(index, e.target.value)}
                                />
                                <datalist id="products">
                                    {filteredProducts.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                                <input 
                                    type="text"
                                    className="w-full bg-transparent outline-none text-xs text-slate-500 mt-1 placeholder-slate-200"
                                    placeholder="Açıklama (opsiyonel)"
                                    value={item.description || ''}
                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" className="w-16 bg-slate-100 rounded-lg px-2 py-1 text-center font-bold outline-none" value={item.qty} onChange={e => updateItem(index, 'qty', parseFloat(e.target.value))} />
                                    <span className="text-[10px] text-slate-400">{item.unit}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <input type="number" className="w-full bg-transparent text-right outline-none font-mono" value={item.price} onChange={e => updateItem(index, 'price', parseFloat(e.target.value))} />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                                {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => removeRow(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addRow} className="w-full py-3 text-xs font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 border-t border-slate-100">
                <Plus size={14} /> YENİ SATIR EKLE
            </button>
        </div>

        {/* BOTTOM SECTION */}
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
                <label className={labelClass}>NOT / AÇIKLAMA</label>
                <textarea 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500 h-32 resize-none" 
                    placeholder="Fatura ile ilgili notlar..."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                ></textarea>

                {/* --- DOSYA YÜKLEME ALANI (GÜNCELLENMİŞ) --- */}
                <div className="mt-4">
                    <label className={labelClass}>İRSALİYE / BELGE EKLE</label>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                    
                    {!selectedFile ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all group"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-md transition-all">
                                <FileUp className="text-slate-400 group-hover:text-sky-500" size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-500">Yüklemek için tıklayın</span>
                            <span className="text-[10px] text-slate-400 mt-1">Sadece görsel (JPG, PNG)</span>
                        </div>
                    ) : (
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <ImageIcon className="text-sky-600" size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{selectedFile.name}</div>
                                    <div className="text-[10px] text-sky-600 flex items-center gap-1">
                                        <Check size={10} /> Yüklenmeye Hazır
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="p-2 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-96 bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Ara Toplam</span>
                    <span className="font-bold text-slate-700">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <div className="flex justify-between items-center mb-8">
                    <span className="text-lg font-bold text-slate-800">GENEL TOPLAM</span>
                    <span className="text-2xl font-black text-slate-900">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                </div>
                <button 
                    onClick={handleSave}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={20} /> KAYDET
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
