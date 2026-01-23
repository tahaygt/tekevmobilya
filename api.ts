
// --- API CONFIGURATION ---

// 1. MUHASEBE SCRİPTİ (Accounting) - GÜNCELLENDİ (YENİ URL)
const ACCOUNTING_API_URL = "https://script.google.com/macros/s/AKfycbx6rFAwg_PMZMreb-YgkB5r9gn6_idXOY7gKZ9ByHusjqn0AOf8EFcHbQXtQXUI0HiJkA/exec";

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

// YARDIMCI: Tek bir satırı parse eden ve onaran fonksiyon
// Hem eski (Data sütunu) hem yeni (Ayrı sütunlar) yapıyı destekler
const parseRow = (item: any) => {
    if (!item) return null;

    // 1. LEGACY DATA KURTARMA (Eski veriler 'Data' sütununda JSON string olarak gelir)
    if (item.Data && typeof item.Data === 'string' && item.Data.trim().startsWith('{')) {
        try {
            const legacyData = JSON.parse(item.Data);
            
            // DÜZELTME: Yeni sütunlar (item), eski veriyi (legacyData) ezebilir.
            // ANCAK, yeni sütun boşsa (""), eski veriyi korumalıyız.
            // Aksi takdirde, eski kayıtlarda 'id' sütunu boş olduğu için veri kaybolur.
            
            for (const key in legacyData) {
                // Eğer gelen veride bu alan yoksa veya boşsa, eski veriden al
                if (item[key] === undefined || item[key] === null || item[key] === "") {
                    item[key] = legacyData[key];
                }
            }
            // Not: Eğer item[key] doluysa (yeni sistemden güncellenmişse), o değer geçerli olur.
            
        } catch (e) {
            console.warn("Legacy Data parse error for item ID:", item.id);
        }
    }

    // Gereksiz 'Data' alanını temizle (hafıza ve karışıklık önlemek için)
    delete item.Data;

    // 2. TİP DÖNÜŞÜMLERİ
    if (item.id) item.id = Number(item.id);
    if (item.price) item.price = Number(item.price);
    if (item.purchasePrice) item.purchasePrice = Number(item.purchasePrice);
    if (item.total) item.total = Number(item.total);
    
    // İlişkili ID'ler
    if (item.accId) item.accId = Number(item.accId);
    if (item.safeId) item.safeId = Number(item.safeId);
    if (item.linkedTransactionId) item.linkedTransactionId = Number(item.linkedTransactionId);
    if (item.branchId) item.branchId = Number(item.branchId);

    // 3. BAKİYE PARSE (String -> Object)
    if (item.balances) {
        if (typeof item.balances === 'string' && item.balances.startsWith('{')) {
             try { item.balances = JSON.parse(item.balances); } catch(e) {}
        }
    }
    // Eğer bakiye hiç yoksa veya hatalıysa varsayılan ekle
    if (!item.balances || typeof item.balances !== 'object') {
        item.balances = { TL: 0, USD: 0, EUR: 0 };
    }

    // 4. ITEMS PARSE (String -> Array)
    if (item.items) {
        if (typeof item.items === 'string') {
            const trimmed = item.items.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
               try { item.items = JSON.parse(trimmed); } catch(e) { item.items = []; }
            } else {
               item.items = [];
            }
        }
    }

    // 5. GEÇERLİLİK KONTROLÜ
    // ID'si olmayan veya 0 olan kayıtları ele (Başlık satırı kalıntısı vb.)
    if (!item.id || item.id === 0 || isNaN(item.id)) return null;
    
    return item;
};

const parseDataFromSheet = (data: any) => {
  if (!data) return { customers: [], products: [], transactions: [], safes: [] };

  const parsedData: any = {
      customers: [],
      products: [],
      transactions: [],
      safes: []
  };

  // Müşteriler
  if (data.customers && Array.isArray(data.customers)) {
    parsedData.customers = data.customers.map(parseRow).filter((c: any) => c && c.name);
  }

  // Kasalar
  if (data.safes && Array.isArray(data.safes)) {
    parsedData.safes = data.safes.map(parseRow).filter((s: any) => s && s.name);
  }

  // İşlemler
  if (data.transactions && Array.isArray(data.transactions)) {
    parsedData.transactions = data.transactions.map(parseRow).filter((t: any) => t);
  }

  // Ürünler
  if (data.products && Array.isArray(data.products)) {
     parsedData.products = data.products.map(parseRow).filter((p: any) => p && p.name);
  }

  return parsedData;
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
