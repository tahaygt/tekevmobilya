
import React, { useState } from 'react';
import { Customer, Transaction } from '../types';
import { Search, Plus, ArrowRight, Edit2, Trash2, Phone, MapPin, User, Building, Truck, Store, Smartphone, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[]; // YENİ: Bakiyeyi dinamik hesaplamak için
  onAddCustomer: (customer: Omit<Customer, 'id' | 'balances'>) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onSelectCustomer: (id: number) => void;
  panelMode: 'accounting' | 'store';
}

export const Customers: React.FC<CustomersProps> = ({ 
  customers, transactions, onAddCustomer, onEditCustomer, onDeleteCustomer, onSelectCustomer, panelMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Form State
  const initialForm: Customer = { 
      id: 0, 
      name: '', 
      type: 'musteri', 
      section: panelMode, 
      phone: '', 
      phone2: '', 
      address: '', 
      balances: { TL: 0, USD: 0, EUR: 0 } 
  };
  const [formData, setFormData] = useState<Customer>(initialForm);

  const handleSubmit = () => {
    if (!formData.name) return;
    
    if (isEditing) {
      onEditCustomer(formData as Customer);
      setIsEditing(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, balances, ...rest } = formData;
      onAddCustomer({ ...rest, section: panelMode });
    }
    setFormData(initialForm);
    setShowForm(false);
  };

  const handleEditClick = (c: Customer) => {
    setFormData(c);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteCustomer(deleteId);
      setDeleteId(null);
    }
  };

  // Filter customers by SECTION
  const relevantCustomers = (customers || []).filter(c => (c.section === panelMode || (!c.section && panelMode === 'accounting')));
  
  // MAĞAZA MODU DEĞİŞİKLİĞİ: Sadece Ana Carileri (Root) göster. Alt cariler detayda gösterilecek.
  const displayCustomers = panelMode === 'store' 
      ? relevantCustomers.filter(c => !c.parentId) 
      : relevantCustomers;

  // Filtering with Search
  const displayList = searchTerm.length > 0
      ? displayCustomers.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      : displayCustomers;

  // --- BAKİYE HESAPLAMA (DİNAMİK) ---
  const calculateRealBalance = (c: Customer) => {
      // Muhasebe modunda kayıtlı bakiyeyi kullan
      if (panelMode === 'accounting') return c.balances;

      // Mağaza modunda işlemleri topla (Şube + Alt Cariler)
      const subIds = relevantCustomers.filter(sub => sub.parentId === c.id).map(sub => sub.id);
      const allIds = [c.id, ...subIds];
      
      const bals = { TL: 0, USD: 0, EUR: 0 };
      const custTrans = (transactions || []).filter(t => t.accId && allIds.includes(t.accId));

      custTrans.forEach(t => {
          const isDebt = t.type === 'sales' || t.type === 'cash_out';
          const isCredit = t.type === 'purchase' || t.type === 'cash_in';
          const curr = (t.currency || 'TL') as 'TL'|'USD'|'EUR';
          
          if (curr === 'TL' || curr === 'USD' || curr === 'EUR') {
              if (isDebt) bals[curr] += t.total;
              else if (isCredit) bals[curr] -= t.total;
          }
      });

      return bals;
  };

  const formatBalance = (amount: number, curr: string) => {
      if(amount === 0) return null;
      const label = amount > 0 ? '(Borçlu)' : '(Alacaklı)';
      return (
        <div key={curr} className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center justify-end gap-1 ${amount > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span>{Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {curr}</span>
            <span className="text-[9px] opacity-70 uppercase tracking-tight">{label}</span>
        </div>
      );
  };

  const renderCustomerRow = (c: Customer) => {
      // Mağaza modunda dinamik hesapla, muhasebede statik kullan
      const balance = calculateRealBalance(c);
      const hasBalance = balance.TL !== 0 || balance.USD !== 0 || balance.EUR !== 0;
      
      // Calculate Sub-Customer Count (Store Mode Only)
      const subCount = panelMode === 'store' ? relevantCustomers.filter(sc => sc.parentId === c.id).length : 0;

      return (
        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
          <td className="px-6 py-4 valign-top">
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white shadow-sm flex-shrink-0
                    ${panelMode === 'store' ? 'bg-orange-500' : c.type === 'musteri' ? 'bg-blue-500' : 'bg-purple-500'}
                `}>
                    {panelMode === 'store' ? <Store size={18}/> : <User size={18} />}
                </div>
                <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                        {c.name}
                        {subCount > 0 && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded-full border border-slate-200">{subCount} Alt Cari</span>}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">#{c.id}</div>
                </div>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-slate-600 valign-top">
            <div className="flex flex-col gap-1.5">
                {c.phone && (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Phone size={13} className="text-slate-400"/> 
                        {c.phone}
                    </div>
                )}
                {c.phone2 && (
                    <div className="flex items-center gap-2 text-slate-600">
                        <Smartphone size={13} className="text-slate-400"/> 
                        {c.phone2}
                    </div>
                )}
                {!c.phone && !c.phone2 && <span className="text-slate-300 text-xs italic">-</span>}
            </div>
          </td>
          <td className="px-6 py-4 valign-top">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border 
              ${c.type === 'musteri' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                c.type === 'tedarikci' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                'bg-purple-50 text-purple-700 border-purple-100'}`}>
              {c.type === 'both' ? 'Müşteri & Tedarikçi' : c.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
            </span>
          </td>
          <td className="px-6 py-4 text-right valign-top">
            <div className="flex flex-col items-end gap-1.5">
                {hasBalance ? (
                    <>
                        {formatBalance(balance.TL, 'TL')}
                        {formatBalance(balance.USD, 'USD')}
                        {formatBalance(balance.EUR, 'EUR')}
                    </>
                ) : (
                    <span className="text-slate-400 text-xs font-medium">Bakiye Yok</span>
                )}
            </div>
          </td>
          <td className="px-6 py-4 text-center valign-top">
            <div className="flex items-center justify-center gap-2 opacity-100">
                <button 
                onClick={() => onSelectCustomer(c.id)}
                className="text-white bg-slate-800 hover:bg-primary p-2 rounded-lg transition-all shadow-sm"
                title="Hesap Detayı"
                >
                <ArrowRight size={16} />
                </button>
                <button 
                onClick={() => handleEditClick(c)}
                className="text-slate-500 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors border border-slate-200 bg-white"
                title="Düzenle"
                >
                <Edit2 size={16} />
                </button>
                <button 
                onClick={() => setDeleteId(c.id)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                title="Sil"
                >
                <Trash2 size={16} />
                </button>
            </div>
          </td>
        </tr>
      );
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal 
        isOpen={!!deleteId}
        title="Cari Hesabı Sil"
        message="Bu cari hesabı ve tüm geçmiş işlemlerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Top Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder={panelMode === 'store' ? "Şube Ara..." : "Cari adı, telefon veya adres ara..."}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={() => { setShowForm(!showForm); setIsEditing(false); setFormData({...initialForm, section: panelMode}); }}
            className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center ${showForm && !isEditing ? 'bg-slate-500' : panelMode === 'store' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary hover:bg-sky-600'}`}
        >
            {showForm && !isEditing ? 'Vazgeç' : <><Plus className="mr-2" size={20} /> {panelMode === 'store' ? 'Yeni Şube Ekle' : 'Yeni Cari Ekle'}</>}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center pb-4 border-b border-slate-100">
            {isEditing ? <Edit2 className="mr-2 text-orange-500" size={20} /> : <Plus className="mr-2 text-primary" size={20} />}
            {isEditing ? 'Cari Bilgilerini Düzenle' : (panelMode === 'store' ? 'Yeni Şube Tanımla' : 'Yeni Cari Kartı Oluştur')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Firma / Şahıs Adı</label>
                <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder={panelMode === 'store' ? "Örn: Şube 1, Merkez Şube..." : "Örn: Tekdemir Mobilya A.Ş."}
                />
            </div>
            
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Cari Tipi</label>
                <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="musteri">Müşteri</option>
                    <option value="tedarikci">Tedarikçi</option>
                    <option value="both">Her İkisi</option>
                </select>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Telefon 1</label>
                 <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="05..."
                 />
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Telefon 2</label>
                 <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    value={formData.phone2 || ''}
                    onChange={e => setFormData({...formData, phone2: e.target.value})}
                    placeholder="05..."
                 />
            </div>

            <div className="lg:col-span-3 space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Adres</label>
                 <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Tam adres..."
                 />
            </div>

            <div className="flex items-end lg:col-span-4 justify-end mt-4">
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                    onClick={() => { setShowForm(false); setIsEditing(false); setFormData(initialForm); }}
                    className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200"
                    >
                    İptal
                    </button>
                    <button 
                    onClick={handleSubmit}
                    className={`text-white px-8 py-2.5 rounded-lg transition-colors font-bold shadow-md ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                    {isEditing ? 'Değişiklikleri Kaydet' : 'Kaydet'}
                    </button>
                </div>
            </div>
            </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Bilgisi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">İletişim</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Güncel Bakiye</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.map(c => renderCustomerRow(c))}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                        <Search size={48} className="text-slate-200 mb-4" />
                        <p className="font-medium">Kayıt bulunamadı.</p>
                        <p className="text-xs mt-1">{panelMode === 'store' ? 'Şube ekleyin.' : 'Yeni cari ekleyin.'}</p>
                    </div>
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
