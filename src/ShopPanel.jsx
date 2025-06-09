import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";

function ShopPanel() {
  const [streamerId] = useState(localStorage.getItem("streamer_id"));
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [price, setPrice] = useState(100);
  const [items, setItems] = useState([]);
  const [buyers, setBuyers] = useState({});

  const navigate = useNavigate();

  const fetchItems = async () => {
    const res = await axios.get(`${BACKEND_URL}/shop/${streamerId}`);
    setItems(res.data);
  };

  const fetchBuyers = async (itemId) => {
    const res = await axios.get(`${BACKEND_URL}/shop/buyers/${itemId}`);
    setBuyers((prev) => ({ ...prev, [itemId]: res.data }));
  };

  const createItem = async () => {
    if (!name || !command) return alert("Tüm alanları doldurun");
    await axios.post(`${BACKEND_URL}/shop/create`, {
      streamer_id: streamerId,
      name,
      command,
      price,
    });
    setName("");
    setCommand("");
    setPrice(100);
    fetchItems();
  };

  useEffect(() => {
    if (streamerId) fetchItems();
  }, [streamerId]);

  const deleteItem = async (id) => {
    const confirmDelete = window.confirm("Bu ürünü silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

      try {
        await axios.delete(`${BACKEND_URL}/shop/${id}`);
        fetchItems(); // Listeyi güncelle
      } catch (err) {
        alert("Silme işlemi başarısız.");
      }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-800 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🛒 Dükkan Paneli</h1>

        <button
          onClick={() => navigate("/")}
          className="elite-button-purple mb-6"
        >
          ⬅️ Ana Panele Dön
        </button>

        {/* Ürün Ekleme */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">➕ Ürün Ekle</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Ürün Adı (örn: Ekran Kartı)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <input
              type="text"
              placeholder="Komut (örn: ekranKartı)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <input
              type="number"
              placeholder="Fiyat (örn: 500)"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value))}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <button
              onClick={createItem}
              className="elite-button-green"
            >
              🛍️ Ürünü Ekle
            </button>
          </div>
        </div>


      <div className="bg-yellow-400 text-black px-5 py-3 rounded-xl shadow mb-6 border border-yellow-500">
        💬 Chat <strong>!dükkan</strong> komutunu yazarak mevcut ürünleri görebilir
      </div>  


        {/* Mevcut Ürünler */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">📦 Mevcut Ürünler</h2>
          {items.length === 0 ? (
            <p>Henüz ürün yok.</p>
          ) : (
            <div className="grid gap-6">
              {items.map((item) => (
                <div key={item.id} className="shop-item-card">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-purple-100">{item.name}</h3>
                      <p className="text-sm text-purple-300">
                        Komut: <code>!{item.command}</code> — Fiyat: <strong>{item.price}</strong> puan
                      </p>
                    </div>
                    <button
                      className="elite-button-show-buyers"
                      onClick={() => fetchBuyers(item.id)}
                    >
                      👥 Alanları Göster
                    </button>
                    <button
                      className="elite-button-red-small ml-10"
                      onClick={() => deleteItem(item.id)}
                    >
                      🗑️ Sil
                    </button>
                    
                  </div>
                  {buyers[item.id] && buyers[item.id].length > 0 && (
                    <div className="mt-2 text-sm text-purple-200 border-t border-purple-700 pt-2">
                      <span className="font-semibold">Satın alanlar:</span>
                      <ul className="list-disc list-inside mt-1 ml-2">
                        {buyers[item.id].map((b, i) => (
                          <li key={i}>
                            <span className="font-bold">{i + 1} - @{b.username}</span> — {new Date(b.created_at).toLocaleDateString("tr-TR")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ugur-signature mt-8">
        <p>
          👤 <strong>Uğur</strong> — <a href="https://kick.com/ugordi" target="_blank" rel="noopener noreferrer">kick.com/ugordi</a> — 📧 bayrak1017@gmail.com
        </p>
      </div>
    </div>
  );
}

export default ShopPanel;
