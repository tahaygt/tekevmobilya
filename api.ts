
// --- API CONFIGURATION ---

// 1. MUHASEBE SCRİPTİ (Accounting) - GÜNCELLENDİ
const ACCOUNTING_API_URL = "https://script.google.com/macros/s/AKfycbzmQAYBKQsjSAQs5pTf5KNina_LFkL7d9xg-FZ4trAItNdZNKJNajJmO7wpnRE59VU7VQ/exec";

// 2. MAĞAZA SCRİPTİ (Store)
const STORE_API_URL = "https://script.google.com/macros/s/AKfycbz5soHbBcAIfiiCxuntdbbO8QuCqVVB-8rIzp29KJgIXP9mt0Y8CkhmU8I09ZAnb1n1bQ/exec";

// Mod'a göre doğru URL'i seçen fonksiyon
const getApiUrl = (mode: 'accounting' | 'store') => {
  return mode === 'store' ? STORE_API_URL : ACCOUNTING_API_URL;
};

// --- DATA TRANSFORM HELPERS ---

const prepareDataForSheet = (data: any) => {
  const cleanData = { ...data };

  // Fatura kalemlerini metne çevir
  if (cleanData.items && typeof cleanData.items !== 'string') {
    cleanData.items = JSON.stringify(cleanData.items);
  }

  // Bakiyeleri metne çevir
  if (cleanData.balances && typeof cleanData.balances !== 'string') {
    cleanData.balances = JSON.stringify(cleanData.balances);
  }

  return cleanData;
};

// YARDIMCI: Geçerli bir kayıt mı kontrol eder (NaN, Boş İsim, 0 ID engeller)
const isValidItem = (item: any) => {
    if (!item) return false;
    const id = Number(item.id);
    const hasName = item.name && item.name.toString().trim() !== '';
    // ID sayı olmalı, NaN olmamalı, 0 olmamalı ve ismi olmalı
    return !isNaN(id) && id !== 0 && hasName;
};

/**
 * Google Sheets'ten gelen veriyi okurken, metin (JSON) olarak kaydedilmiş
 * alanları tekrar JavaScript objesine/dizisine çevirir.
 */
const parseDataFromSheet = (data: any) => {
  if (!data) return data;

  // Müşteri bakiyelerini parse et
  if (data.customers && Array.isArray(data.customers)) {
    data.customers = data.customers.map((c: any) => ({
      ...c,
      id: Number(c.id),
      balances: (typeof c.balances === 'string' && c.balances.startsWith('{')) 
        ? JSON.parse(c.balances) 
        : (c.balances || { TL: 0, USD: 0, EUR: 0 })
    })).filter(isValidItem); 
  }

  // Kasa bakiyelerini parse et
  if (data.safes && Array.isArray(data.safes)) {
    data.safes = data.safes.map((s: any) => ({
      ...s,
      id: Number(s.id),
      balances: (typeof s.balances === 'string' && s.balances.startsWith('{')) 
        ? JSON.parse(s.balances) 
        : (s.balances || { TL: 0, USD: 0, EUR: 0 })
    })).filter(isValidItem);
  }

  // İşlem kalemlerini (items) parse et
  if (data.transactions && Array.isArray(data.transactions)) {
    data.transactions = data.transactions.map((t: any) => {
      let items = t.items;

      // JSON String parsing with safety check
      if (typeof t.items === 'string') {
          const trimmed = t.items.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
             try {
                 items = JSON.parse(trimmed);
             } catch(e) {
                 items = [];
             }
          } else {
             // If it's a string but not a JSON array (e.g. empty string), treat as undefined
             items = undefined;
          }
      } else if (!Array.isArray(t.items)) {
          // If it's neither string nor array (e.g. null, object), treat as undefined
          items = undefined;
      }

      return {
        ...t,
        id: Number(t.id),
        accId: t.accId ? Number(t.accId) : undefined,
        safeId: t.safeId ? Number(t.safeId) : undefined,
        linkedTransactionId: t.linkedTransactionId ? Number(t.linkedTransactionId) : undefined,
        total: Number(t.total),
        items: items
      };
    }).filter((t: any) => !isNaN(Number(t.id)) && Number(t.id) !== 0); 
  }

  // Ürün fiyatlarını sayıya çevir
  if (data.products && Array.isArray(data.products)) {
     data.products = data.products.map((p: any) => ({
         ...p,
         id: Number(p.id),
         price: Number(p.price),
         purchasePrice: Number(p.purchasePrice)
     })).filter(isValidItem);
  }

  return data;
};

export const api = {
  // Tüm verileri çek (Mod'a göre URL seçer)
  fetchAll: async (mode: 'accounting' | 'store') => {
    try {
      const url = getApiUrl(mode);
      // redirect: 'follow' önemlidir.
      const res = await fetch(`${url}?action=read&t=${Date.now()}`, {
          method: 'GET',
          redirect: 'follow' 
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const rawData = await res.json();
      return parseDataFromSheet(rawData);

    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  },

  // Veri Ekleme
  create: async (collection: string, data: any, mode: 'accounting' | 'store') => {
    const url = getApiUrl(mode);
    const payload = prepareDataForSheet(data);

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'create', collection, data: payload }),
    });
  },

  // Veri Güncelleme
  update: async (collection: string, data: any, mode: 'accounting' | 'store') => {
    const url = getApiUrl(mode);
    const payload = prepareDataForSheet(data);

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'update', collection, data: payload })
    });
  },

  // Veri Silme
  delete: async (collection: string, id: number, mode: 'accounting' | 'store') => {
    const url = getApiUrl(mode);
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'delete', collection, data: { id } })
    });
  }
};
