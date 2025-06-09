import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";


function GiveawayPanel() {
  const [streamerId] = useState(localStorage.getItem("streamer_id"));
  const [title, setTitle] = useState("");
  const [command, setCommand] = useState("");
  const [price, setPrice] = useState(100);
  const [maxTickets, setMaxTickets] = useState(1);

  const [entries, setEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [allGiveaways, setAllGiveaways] = useState([]);

  const navigate = useNavigate();

  const fetchEntries = async () => {
    const res = await axios.get(`${BACKEND_URL}/giveaway/${streamerId}`);
    if (res.data && res.data.id) {
      const entryRes = await axios.get(`${BACKEND_URL}/giveaway/entries/${res.data.id}`);
      setEntries(entryRes.data);
    } else {
      setEntries([]);
    }
  };

  const fetchAllGiveaways = async () => {
    const res = await axios.get(`${BACKEND_URL}/giveaway/list/${streamerId}`);
    setAllGiveaways(res.data);
  };

  const createGiveaway = async () => {
    await axios.post(`${BACKEND_URL}/giveaway/create`, {
      streamer_id: streamerId,
      title,
      command,
      ticket_price: price,
      max_tickets_per_user: maxTickets,
    });
    fetchEntries();
    fetchAllGiveaways();
  };

  const deactivateGiveaway = async (id) => {
    if (!window.confirm("Bu çekilişi kapatmak istediğinize emin misiniz?")) return;
    try {
      await axios.post(`${BACKEND_URL}/giveaway/deactivate`, {
        giveaway_id: id
      });
      fetchAllGiveaways();
    } catch (err) {
      alert("Pasifleştirme başarısız.");
    }
  };

  const draw = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/giveaway/draw`, {
        streamer_id: streamerId
      });

      setWinner(res.data.winner);

      if (res.data.giveaway_id) {
        const entryRes = await axios.get(`${BACKEND_URL}/giveaway/entries/${res.data.giveaway_id}`);
        setEntries(entryRes.data);
      }

      fetchAllGiveaways();
    } catch (err) {
      console.error("❌ Çekiliş hatası:", err.response?.data || err.message);
      alert("Kazanan seçilemedi. Lütfen katılımcı olduğundan emin olun.");
    }
  };

  useEffect(() => {
    if (streamerId) {
      fetchEntries();
      fetchAllGiveaways();
    }
  }, [streamerId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-800 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🎉 Çekiliş Paneli</h1>

        <button
          onClick={() => navigate("/")}
          className="elite-button-purple mb-6"
        >
          ⬅️ Ana Panele Dön
        </button>

        {/* Yeni Çekiliş */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📝 Yeni Çekiliş Oluştur</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Çekiliş Başlığı (örn: TV Çekilişi)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <input
              type="text"
              placeholder="Komut (örn: tv)"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <input
              type="number"
              placeholder="Bilet Fiyatı"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value))}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <input
              type="number"
              placeholder="Max Bilet (örn: 5)"
              value={maxTickets}
              onChange={(e) => setMaxTickets(parseInt(e.target.value))}
              className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
            <button
              onClick={createGiveaway}
              className="elite-button-blue"
            >
              🚀 Çekilişi Başlat
            </button>
          </div>
        </div>

        {/* Katılımcılar */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">👥 Katılımcılar</h2>
          {entries.length === 0 ? (
            <p>Henüz katılım yok.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.user_id} className="text-purple-300">
                  {entry.username} — 🎫 {entry.tickets} bilet
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={draw}
            className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg shadow"
          >
            🎯 Kazananı Seç
          </button>

          {winner && (
            <div className="mt-4 p-4 bg-green-800 rounded-lg">
              🎉 Kazanan: <span className="font-bold">{winner.username}</span>
            </div>
          )}
        </div>

        {/* Geçmiş Çekilişler */}
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📜 Geçmiş Çekilişler</h2>
          {allGiveaways.length === 0 ? (
            <p>Henüz çekiliş yapılmadı.</p>
          ) : (
            <ul className="space-y-2">
              {allGiveaways.map((g) => (
                <li key={g.id} className="text-purple-300 flex justify-between items-center">
                  <span>
                    <strong>{g.title}</strong> — Komut: <code>!{g.command}</code> — Fiyat: {g.ticket_price} — Max Bilet: {g.max_tickets_per_user} — {g.is_active ? "🟢 Aktif" : "🔴 Bitti"}
                  </span>
                  {g.is_active && (
                    <button
                      onClick={() => deactivateGiveaway(g.id)}
                      className="elite-button-red-small"
                    >
                      ❌ Kapat
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="ugur-signature">
        <p>
          👤 <strong>Uğur</strong> — <a href="https://kick.com/ugordi" target="_blank" rel="noopener noreferrer">kick.com/ugordi</a> — 📧 bayrak1017@gmail.com
        </p>
      </div>
    </div>
  );
}

export default GiveawayPanel;
