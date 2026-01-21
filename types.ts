
export interface Customer {
  id: number;
  name: string;
  type: 'musteri' | 'tedarikci' | 'both';
  section: 'accounting' | 'store'; // Bölüm ayrımı
  phone?: string;
  address?: string;
  balances: {
    TL: number;
    USD: number;
    EUR: number;
  };
}

export interface Product {
  id: number;
  type: 'satilan' | 'alinan' | 'both';
  name: string;
  unit: string;
  cat: string;
  purchasePrice: number; // Yeni: Alış Fiyatı
  price: number; // Satış Fiyatı
  currency: 'TL' | 'USD' | 'EUR';
}

export interface Safe {
  id: number;
  name: string;
  balances: {
    TL: number;
    USD: number;
    EUR: number;
  };
}

export interface TransactionItem {
  code?: string;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

export type PaymentMethod = 'nakit' | 'havale' | 'cek' | 'kredi_karti' | 'virman';

export interface Transaction {
  id: number;
  date: string;
  type: 'sales' | 'purchase' | 'cash_in' | 'cash_out';
  section: 'accounting' | 'store'; // Bölüm ayrımı
  accId?: number; // BORÇLU OLAN MÜŞTERİ (Perakende Müşterisi)
  accName?: string;
  safeId?: number;
  currency: 'TL' | 'USD' | 'EUR';
  total: number;
  items?: TransactionItem[];
  desc?: string;
  method?: PaymentMethod;
  linkedTransactionId?: number; // Fatura kapama için bağlantı ID
  
  // Şube/Satış Yeri Bilgisi
  branchId?: number; // SATIŞI YAPAN ŞUBE
  
  // Teslimat Detayları
  retailName?: string; // Fatura üzerindeki görünen isim (Opsiyonel)
  retailPhone1?: string;
  retailPhone2?: string;
  retailAddress?: string;
  deliveryDate?: string;
  
  // İrsaliye Görseli
  deliveryNoteUrl?: string; // Google Drive Linki
}

export type Page = 'customers' | 'customer-detail' | 'products' | 'invoice-sales' | 'invoice-purchase' | 'cash' | 'report';
