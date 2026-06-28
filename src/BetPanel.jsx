import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";

function BetPanel() {
  const [streamerId] = useState(localStorage.getItem("streamer_id"));

  // ✅ Default başlık
  const [title, setTitle] = useState("Win or Lose ? ");

  const [maxBet, setMaxBet] = useState(0);
  const [activeBet, setActiveBet] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [duration, setDuration] = useState(60);
  const [remainingTime, setRemainingTime] = useState(null);

  const quickMaxBets = [1000, 2000, 5000, 10000, 20000];

  const fetchActiveBet = async () => {
    const res = await axios
      .get(`${BACKEND_URL}/bet/active/${streamerId}`)
      .catch(() => null);
    setActiveBet(res?.data || null);
  };

  const fetchHistory = async () => {
    const res = await axios.get(`${BACKEND_URL}/history/${streamerId}`);
    setHistory(res.data);
  };

  useEffect(() => {
    if (streamerId) {
      fetchActiveBet();
      fetchHistory();
    }
  }, [streamerId]);

  const createBet = async () => {
    // ✅ default başlık boş sayılmasın diye trim kontrolü bu şekilde kalsın
    if (!title.trim()) return alert("Başlık boş olamaz.");

    await axios.post(`${BACKEND_URL}/bet/create`, {
      streamer_id: streamerId,
      title, // ✅ kullanıcı değiştirmese bile "Win or Lose ? " gider
      max_bet: maxBet,
      duration_seconds: duration,
    });

    // ✅ İstersen reset sonrası yine default'a dönsün
    setTitle("Win or Lose ? ");
    setMaxBet(1000);
    fetchActiveBet();
  };

  useEffect(() => {
    if (activeBet && activeBet.created_at && activeBet.duration_seconds) {
      const createdAt = new Date(activeBet.created_at).getTime();
      const endAt = createdAt + activeBet.duration_seconds * 1000;

      const interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endAt - now) / 1000));
        setRemainingTime(diff);

        if (diff === 0) clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeBet]);

  const resolveBet = async (winner) => {
    await axios.post(`${BACKEND_URL}/bet/resolve`, {
      streamer_id: streamerId,
      winner,
    });
    setMessage(winner === 1 ? "✅ WIN Seçildi" : "❌ LOSE Seçildi");
    setActiveBet(null);
  };

  const cancelBet = async () => {
    await axios.post(`${BACKEND_URL}/bet/cancel`, {
      streamer_id: streamerId,
    });
    setMessage("⛔ Bet iptal edildi, puanlar iade edildi.");
    setActiveBet(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-800 text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">💰 Bet Paneli</h1>

        <button onClick={() => navigate("/")} className="elite-button-purple mb-6">
          ⬅️ Ana Panele Dön
        </button>

        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎯 Yeni Bet Oluştur</h2>

          <input
            type="text"
            placeholder="Bet Başlığı (örn: Bu maçı kazanır mı?)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 rounded bg-purple-900 text-white border border-purple-700 w-full mb-4"
          />

          <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
            <label className="text-sm font-medium text-white">Max Bet:</label>
            <input
              type="number"
              placeholder="örn: 1000"
              value={maxBet}
              onChange={(e) => setMaxBet(parseInt(e.target.value || "0", 10))}
              className="w-32 px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />

            <label className="text-sm font-medium text-white">Süre (sn):</label>
            <input
              type="number"
              placeholder="örn: 60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
              className="w-32 px-3 py-2 rounded bg-purple-900 text-white border border-purple-700"
            />
          </div>

          {/* ✅ Hızlı Max Bet Butonları */}
          <div className="flex flex-wrap gap-4 mt-2 mb-6">
            {quickMaxBets.map((amt) => {
              const selected = maxBet === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setMaxBet(amt)}
                  className={`
                    min-w-[130px]
                    px-6 py-3
                    text-base font-semibold
                    rounded-xl
                    border-2
                    transition-all
                    shadow-lg
                    ${
                      selected
                        ? "bg-white text-purple-900 border-white scale-105"
                        : "bg-purple-900 text-white border-purple-700 hover:bg-purple-800 hover:scale-105"
                    }
                  `}
                >
                  {amt.toLocaleString("tr-TR")} Puan
                </button>
              );
            })}
          </div>

          <button
            onClick={createBet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
          >
            🚀 Bet Başlat
          </button>
        </div>

        {activeBet && (
          <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📢 Aktif Bet</h2>
            <p className="mb-2 text-purple-300 font-medium">{activeBet.title}</p>
            <p className="mb-4 text-sm text-purple-400">
              İzleyiciler <code>!win [puan]</code> veya <code>!lose [puan]</code> yazarak katılır.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => resolveBet(1)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow"
              >
                ✅ WIN Kazandı
              </button>
              <button
                onClick={() => resolveBet(2)}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow"
              >
                ❌ LOSE Kazandı
              </button>
              <button
                onClick={cancelBet}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg shadow"
              >
                🔄 Beti İptal Et (Puanları Geri Ver)
              </button>

              {remainingTime !== null && (
                <p className="text-sm text-yellow-400 font-semibold mb-4">
                  🕒 Kalan süre: {remainingTime} saniye
                </p>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className="bg-purple-700 p-4 rounded-lg text-center text-white shadow-md">
            {message}
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">📜 Geçmiş Betler</h2>
            <ul className="space-y-2 text-purple-300 text-sm">
              {history.map((b, idx) => (
                <li key={idx} className="border-b border-purple-800 pb-2">
                  <div className="font-medium">🎯 {b.title}</div>
                  <div>
                    Kazanan:{" "}
                    {b.winner === 1
                      ? "✅ WIN Seçildi"
                      : b.winner === 2
                      ? "❌ LOSE Seçildi"
                      : "⛔ İptal Edildi"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="ugur-signature">
          <p>
            👤 <strong>Uğur</strong> —{" "}
            <a href="https://kick.com/ugordi" target="_blank" rel="noopener noreferrer">
              kick.com/ugordi
            </a>{" "}
            — 📧 bayrak1017@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default BetPanel;
