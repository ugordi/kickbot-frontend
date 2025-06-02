import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getPoints,
  updatePoints,
  resetAllPoints,
  drawWinner,
  getSettings,
  updateSettings,
} from "./api";
import Table from "./components/Table";
import WinnerBox from "./components/WinnerBox";
import "./App.css";

const code = new URL(window.location.href).searchParams.get("code");

function App() {
  const [streamerId, setStreamerId] = useState(localStorage.getItem("streamer_id"));
  const [points, setPoints] = useState([]);
  const [winner, setWinner] = useState(null);
  const [settings, setSettings] = useState({
    message_points: 50,
    message_interval: 30,
    subscription_points: 400,
    gift_points_per_sub: 400,
  });

  useEffect(() => {
    if (streamerId) {
      fetchPoints();
      fetchSettings();
    }
  }, [streamerId]);

  const fetchPoints = async () => {
    const res = await getPoints(streamerId);
    setPoints(res.data);
  };

  const fetchSettings = async () => {
    const res = await getSettings(streamerId);
    setSettings(res.data);
  };

  const handleUpdatePoint = async (user_id, newPoints) => {
    await updatePoints(streamerId, user_id, newPoints);
    fetchPoints();
  };

  const handleResetPoints = async () => {
    const confirm = window.confirm("Puanları sıfırlamak istediğinize emin misiniz?");
    if (!confirm) return;

    await resetAllPoints(streamerId);
    fetchPoints();
  };

  const handleLogout = () => {
    const confirm = window.confirm("Çıkış yapmak istediğinize emin misiniz?");
    if (!confirm) return;

    localStorage.removeItem("streamer_id");
    window.location.href = "/login";
  };

  const handleDrawWinner = async () => {
    const res = await drawWinner(streamerId);
    setWinner(res.data.winner);
  };

  const handleUpdateSettings = async () => {
    await updateSettings(streamerId, settings);
    alert("Ayarlar güncellendi");
  };

  if (code) {
    return <Navigate to={`/login${window.location.search}`} replace />;
  }

  if (!streamerId) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-800 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🎥 212s Paneli</h1>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => window.location.href = "/shop"}
            className="elite-button-green"
          >
            🛒 Dükkan
          </button>
          <button
            onClick={() => window.location.href = "/giveaway"}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow"
          >
            🎁 Çekiliş Yap
          </button>
          <button
            onClick={() => window.location.href = "/bet"}
            className="elite-button-blue"
          >
            💰 Bet
          </button>
          <button
            onClick={handleResetPoints}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
          >
            ♻️ Puanları Sıfırla
          </button>
          <button
            onClick={handleLogout}
            className="elite-button-red ml-8">
            🚪 Çıkış Yap
          </button>

        </div>

        <div className="bg-purple-950 border border-purple-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 Puanlama Ayarları</h2>
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(settings).map(([key, value]) => (
              <label key={key} className="block text-sm">
                <span className="block mb-1 text-purple-300 font-medium">
                  {key.replace(/_/g, " ").toUpperCase()}
                  {key === "message_interval" ? " (saniye)" : " (puan)"}
                </span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setSettings({ ...settings, [key]: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded bg-purple-900 text-white border border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </label>
            ))}
          </div>
          <button
            onClick={handleUpdateSettings}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow"
          >
            💾 Ayarları Kaydet
          </button>
        </div>

        <WinnerBox winner={winner} />
        <Table points={points} onUpdate={handleUpdatePoint} />
      </div>
      <div className="ugur-signature">
        <p>
          👤 <strong>Uğur</strong> — <a href="https://kick.com/ugordi" target="_blank" rel="noopener noreferrer">kick.com/ugordi</a> — 📧 bayrak1017@gmail.com
        </p>
      </div>
    </div>
  );
}

export default App;
