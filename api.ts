
// Google Apps Script Deployment URL
const API_URL = "https://script.google.com/macros/s/AKfycbwVak5hQHzzpf0WZUxwN91rQB8hEwmWBwNKPnReU7JVyL-rRlwz-9HaKMUqn0dp-1SGBA/exec"; 

export const api = {
  // Tüm verileri çek
  fetchAll: async () => {
    try {
      // Cache busting (t=Date.now()) ekleyerek ve redirect: follow kullanarak GET isteğini garantiye alalım
      const res = await fetch(`${API_URL}?action=read&t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const text = await res.json();
      return text;
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  },

  // Veri Ekleme (Satır ekler)
  create: async (collection: string, data: any) => {
    // keepalive: true -> Sayfa kapansa bile isteğin gitmesini sağlar.
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true, 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'create', collection, data }),
    });
  },

  // Veri Güncelleme (ID'ye göre satırı bulur ezer)
  update: async (collection: string, data: any) => {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'update', collection, data })
    });
  },

  // Veri Silme (ID'ye göre satırı siler)
  delete: async (collection: string, id: number) => {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'delete', collection, data: { id } })
    });
  }
};
