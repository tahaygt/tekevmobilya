
export interface Customer {
  id: number;
  name: string;
  type: 'musteri' | 'tedarikci' | 'both';
  phone?: string;
  address?: string;
  // Changed from single currency/balance to multi-currency balances object
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
  price: number;
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
  name: string;
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
  accId?: number;
  accName?: string;
  safeId?: number;
  currency: 'TL' | 'USD' | 'EUR';
  total: number;
  items?: TransactionItem[];
  desc?: string;
  method?: PaymentMethod;
}

export type Page = 'customers' | 'customer-detail' | 'products' | 'invoice-sales' | 'invoice-purchase' | 'cash' | 'report';
