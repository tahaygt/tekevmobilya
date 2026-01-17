import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, Plus, ArrowRight, Edit2, Trash2, Phone, MapPin } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'balances'>) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onSelectCustomer: (id: number) => void;
}

export const Customers: React.FC<CustomersProps> = ({ 
  customers, onAddCustomer, onEditCustomer, onDeleteCustomer, onSelectCustomer 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const initialForm: Customer = { id: 0, name: '', type: 'musteri', phone: '', address: '', balances: { TL: 0, USD: 0, EUR: 0 } };
  const [formData, setFormData] = useState<Customer>(initialForm);

  const handleSubmit = () => {
    if (!formData.name) return;
    
    if (isEditing) {
      onEditCustomer(formData as Customer);
      setIsEditing(false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, balances, ...rest } = formData;
      onAddCustomer(rest);
    }
    setFormData(initialForm);
  };

  const handleEditClick = (c: Customer) => {
    setFormData(c);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm('Bu cari hesabı ve tüm geçmişini silmek istediğinize emin misiniz?')) {
      onDeleteCustomer(id);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBalance = (amount: number, curr: string) => {
      if(amount === 0) return null;
      return (
        <div key={curr} className={`text-xs font-mono font-bold ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {curr}
        </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Box */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          {isEditing ? <Edit2 className="mr-2 text-orange-500" size={20} /> : <Plus className="mr-2 text-primary" size={20} />}
          {isEditing ? 'Cari Düzenle' : 'Yeni Cari Kartı'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-2">
            <input
              type="text"
              placeholder="Firma / Şahıs Adı *"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="Telefon"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                />
                <input
                type="text"
                placeholder="Adres"
                className="flex-[2] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                />
            </div>
          </div>

          <div className="space-y-2">
             <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
                <option value="musteri">Müşteri</option>
                <option value="tedarikci">Tedarikçi</option>
                <option value="both">Müşteri & Tedarikçi</option>
            </select>
            <div className="text-xs text-slate-400 px-1 pt-2">
                * Cari hesaplar otomatik olarak tüm para birimleri (TL, USD, EUR) ile çalışır.
            </div>
          </div>

          <div className="flex gap-2 items-start">
            <button 
              onClick={handleSubmit}
              className={`w-full text-white px-4 py-2 rounded-lg transition-colors font-medium h-[42px] ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-sky-600'}`}
            >
              {isEditing ? 'Güncelle' : 'Kaydet'}
            </button>
            {isEditing && (
                <button 
                  onClick={() => { setIsEditing(false); setFormData(initialForm); }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium h-[42px]"
                >
                  İptal
                </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50">
          <Search className="text-slate-400 mr-2" size={20} />
          <input
            type="text"
            placeholder="Cari ara..."
            className="flex-1 outline-none text-slate-600 bg-transparent"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Cari Adı</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Tipi</th>
                <th className="px-6 py-4 text-right">Bakiyeler</th>
                <th className="px-6 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                  const hasBalance = c.balances.TL !== 0 || c.balances.USD !== 0 || c.balances.EUR !== 0;
                  return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {c.phone && <div className="flex items-center gap-1"><Phone size={12}/> {c.phone}</div>}
                    {c.address && <div className="flex items-center gap-1 mt-1 truncate max-w-[150px]" title={c.address}><MapPin size={12}/> {c.address}</div>}
                    {!c.phone && !c.address && <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide 
                      ${c.type === 'musteri' ? 'bg-green-100 text-green-700' : 
                        c.type === 'tedarikci' ? 'bg-orange-100 text-orange-700' : 
                        'bg-purple-100 text-purple-700'}`}>
                      {c.type === 'both' ? 'Müşteri & Tedarikçi' : c.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                        {hasBalance ? (
                            <>
                                {formatBalance(c.balances.TL, 'TL')}
                                {formatBalance(c.balances.USD, 'USD')}
                                {formatBalance(c.balances.EUR, 'EUR')}
                            </>
                        ) : (
                            <span className="text-slate-400 text-xs">-</span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                        onClick={() => onSelectCustomer(c.id)}
                        className="text-primary hover:text-sky-700 bg-sky-50 hover:bg-sky-100 p-2 rounded-lg transition-colors"
                        title="Detaylar"
                        >
                        <ArrowRight size={16} />
                        </button>
                        <button 
                        onClick={() => handleEditClick(c)}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                        title="Düzenle"
                        >
                        <Edit2 size={16} />
                        </button>
                        <button 
                        onClick={() => handleDeleteClick(c.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Sil"
                        >
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              )})}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Kayıt bulunamadı.
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