
import {
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getPoints,
  updatePoints,
  resetAllPoints,
  drawWinner,
  getSettings,
  updateSettings,
  applyTax,
} from "./api";

import Table from "./components/Table";
import WinnerBox from "./components/WinnerBox";
import "./App.css";

const code = new URL(
  window.location.href
).searchParams.get("code");

function App() {
  const navigate = useNavigate();

  const [streamerId] = useState(
    localStorage.getItem("streamer_id")
  );

  const [points, setPoints] = useState([]);
  const [winner, setWinner] = useState(null);

  const [settings, setSettings] = useState({
    message_points: 50,
    message_interval: 30,
    subscription_points: 400,
    gift_points_per_sub: 400,
  });

  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] =
    useState("");

  const fetchPoints = useCallback(async () => {
    if (!streamerId) {
      setPoints([]);
      return;
    }

    try {
      const response = await getPoints(
        streamerId
      );

      setPoints(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Puanlar alınamadı:",
        error
      );

      setMessage(
        "Puan listesi alınamadı."
      );
    }
  }, [streamerId]);

  const fetchSettings =
    useCallback(async () => {
      if (!streamerId) {
        return;
      }

      try {
        const response =
          await getSettings(streamerId);

        setSettings(response.data);
      } catch (error) {
        console.error(
          "Ayarlar alınamadı:",
          error
        );

        setMessage(
          "Puanlama ayarları alınamadı."
        );
      }
    }, [streamerId]);

  useEffect(() => {
    if (!streamerId) {
      return;
    }

    fetchPoints();
    fetchSettings();
  }, [
    streamerId,
    fetchPoints,
    fetchSettings,
  ]);

  const handleUpdatePoint = async (
    userId,
    newPoints
  ) => {
    try {
      await updatePoints(
        streamerId,
        userId,
        newPoints
      );

      await fetchPoints();

      setMessage(
        "Kullanıcı puanı güncellendi."
      );
    } catch (error) {
      console.error(
        "Puan güncelleme hatası:",
        error
      );

      setMessage(
        "Kullanıcı puanı güncellenemedi."
      );
    }
  };

  const handleResetPoints = async () => {
    const confirmed = window.confirm(
      "Bütün kullanıcı puanları sıfırlanacak. Emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingAction("reset");
      setMessage("");

      await resetAllPoints(streamerId);
      await fetchPoints();

      setMessage(
        "Bütün kullanıcı puanları sıfırlandı."
      );
    } catch (error) {
      console.error(
        "Puan sıfırlama hatası:",
        error
      );

      setMessage(
        "Puanlar sıfırlanamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Çıkış yapmak istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("streamer_id");
    window.location.href = "/login";
  };

  const handleDrawWinner = async () => {
    try {
      setLoadingAction("draw");
      setMessage("");

      const response =
        await drawWinner(streamerId);

      if (!response.data?.winner) {
        setWinner(null);

        setMessage(
          response.data?.message ||
            "Çekilişe uygun kullanıcı bulunamadı."
        );

        return;
      }

      setWinner(response.data.winner);

      setMessage(
        `Kazanan: ${
          response.data.winner.username ||
          "Bilinmeyen kullanıcı"
        }`
      );
    } catch (error) {
      console.error(
        "Kazanan seçme hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Kazanan seçilemedi."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoadingAction("settings");
      setMessage("");

      await updateSettings(
        streamerId,
        settings
      );

      setMessage(
        "Puanlama ayarları güncellendi."
      );
    } catch (error) {
      console.error(
        "Ayar güncelleme hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Ayarlar güncellenemedi."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleTax = async (percentage) => {
    try {
      setLoadingAction(
        `tax-${percentage}`
      );

      setMessage("");

      const response = await applyTax(
        streamerId,
        percentage
      );

      const affectedUsers = Number(
        response.data?.affected_users || 0
      );

      const totalTaxCollected = Number(
        response.data?.total_tax_collected ||
          0
      );

      await fetchPoints();

      setMessage(
        `%${percentage} vergi uygulandı. ${affectedUsers} kullanıcıdan toplam ${totalTaxCollected.toLocaleString(
          "tr-TR"
        )} puan kesildi.`
      );
    } catch (error) {
      console.error(
        "Vergi uygulama hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Vergi uygulanamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleSettingChange = (
    key,
    rawValue
  ) => {
    const parsedValue = Number(rawValue);

    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: Number.isFinite(parsedValue)
        ? parsedValue
        : 0,
    }));
  };

  const settingLabels = {
    message_points:
      "Mesaj Başına Puan",
    message_interval:
      "Mesaj Puan Aralığı",
    subscription_points:
      "Abonelik Puanı",
    gift_points_per_sub:
      "Hediye Abonelik Puanı",
  };

  const totalUsers = points.length;

  const totalPoints = points.reduce(
    (total, user) =>
      total + Number(user.points || 0),
    0
  );

  const isLoading =
    loadingAction !== "";

  if (code) {
    return (
      <Navigate
        to={`/login${window.location.search}`}
        replace
      />
    );
  }

  if (!streamerId) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-header-icon">
            🎥
          </div>

          <h1>212s Yönetim Paneli</h1>

          <p>
            Yayın puanlarını, bahisleri,
            çekilişleri ve kullanıcı işlemlerini
            tek yerden yönet.
          </p>
        </header>

        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon users">
              👥
            </div>

            <div>
              <span>Toplam Kullanıcı</span>

              <strong>
                {totalUsers.toLocaleString(
                  "tr-TR"
                )}
              </strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon points">
              💎
            </div>

            <div>
              <span>Toplam Puan</span>

              <strong>
                {totalPoints.toLocaleString(
                  "tr-TR"
                )}
              </strong>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon streamer">
              📡
            </div>

            <div>
              <span>Yayıncı ID</span>

              <strong className="dashboard-streamer-id">
                {streamerId}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-navigation">
          <button
            type="button"
            className="dashboard-nav-card dashboard-shop-card"
            onClick={() => navigate("/shop")}
          >
            <span className="dashboard-nav-icon">
              🛒
            </span>

            <div>
              <strong>Dükkan</strong>

              <small>
                Ürünleri ve satın alımları yönet
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-nav-card dashboard-giveaway-card"
            onClick={() =>
              navigate("/giveaway")
            }
          >
            <span className="dashboard-nav-icon">
              🎁
            </span>

            <div>
              <strong>Çekiliş</strong>

              <small>
                Çekiliş oluştur ve kazanan seç
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-nav-card dashboard-bet-card"
            onClick={() => navigate("/bet")}
          >
            <span className="dashboard-nav-icon">
              💰
            </span>

            <div>
              <strong>Bet Paneli</strong>

              <small>
                Bahis oluştur ve sonuçlandır
              </small>
            </div>
          </button>

          <button
            type="button"
            className="dashboard-nav-card dashboard-logout-card"
            onClick={handleLogout}
          >
            <span className="dashboard-nav-icon">
              🚪
            </span>

            <div>
              <strong>Çıkış Yap</strong>

              <small>
                Yönetim oturumunu kapat
              </small>
            </div>
          </button>
        </section>

        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}

        <section className="dashboard-card">
          <div className="dashboard-section-title">
            <div className="dashboard-section-icon settings">
              🔧
            </div>

            <div>
              <h2>Puanlama Ayarları</h2>

              <p>
                Mesaj, abonelik ve hediye
                puanlarını düzenle.
              </p>
            </div>
          </div>

          <div className="dashboard-settings-grid">
            {Object.entries(settings).map(
              ([key, value]) => (
                <label
                  key={key}
                  className="dashboard-form-group"
                >
                  <span>
                    {settingLabels[key] ||
                      key
                        .replace(/_/g, " ")
                        .toUpperCase()}
                  </span>

                  <div className="dashboard-input-wrapper">
                    <input
                      type="number"
                      min="0"
                      value={value}
                      onChange={(event) =>
                        handleSettingChange(
                          key,
                          event.target.value
                        )
                      }
                    />

                    <small>
                      {key ===
                      "message_interval"
                        ? "SANİYE"
                        : "PUAN"}
                    </small>
                  </div>
                </label>
              )
            )}
          </div>

          <button
            type="button"
            className="dashboard-save-button"
            onClick={handleUpdateSettings}
            disabled={isLoading}
          >
            {loadingAction === "settings"
              ? "Kaydediliyor..."
              : "💾 Ayarları Kaydet"}
          </button>
        </section>

        <section className="dashboard-card dashboard-tax-section">
          <div className="dashboard-section-title">
            <div className="dashboard-section-icon tax">
              🧾
            </div>

            <div>
              <h2>Toplu Vergi</h2>

              <p>
                Tüm kullanıcıların mevcut
                puanlarından yüzdelik kesinti yap.
              </p>
            </div>
          </div>

          <div className="dashboard-tax-info">
            Vergi, puanı bulunan bütün
            kullanıcılara uygulanır. Kesilen
            puanlar geri verilmez.
          </div>

          <div className="dashboard-tax-grid">
            {[1, 2, 3, 5].map(
              (percentage) => (
                <button
                  key={percentage}
                  type="button"
                  className={`dashboard-tax-button dashboard-tax-${percentage}`}
                  disabled={isLoading}
                  onClick={() =>
                    handleTax(percentage)
                  }
                >
                  <span className="dashboard-tax-percentage">
                    %{percentage}
                  </span>

                  <span className="dashboard-tax-text">
                    {loadingAction ===
                    `tax-${percentage}`
                      ? "Uygulanıyor..."
                      : "Vergi Al"}
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        <section className="dashboard-card dashboard-actions-section">
          <div className="dashboard-section-title">
            <div className="dashboard-section-icon actions">
              ⚙️
            </div>

            <div>
              <h2>Hızlı İşlemler</h2>

              <p>
                Çekiliş ve toplu puan işlemlerini
                buradan yönet.
              </p>
            </div>
          </div>

          <div className="dashboard-action-grid">
            <button
              type="button"
              className="dashboard-action-button dashboard-draw-button"
              onClick={handleDrawWinner}
              disabled={isLoading}
            >
              <span>🏆</span>

              <div>
                <strong>
                  {loadingAction === "draw"
                    ? "Seçiliyor..."
                    : "Rastgele Kazanan Seç"}
                </strong>

                <small>
                  Puan ağırlığına göre seçim yapar
                </small>
              </div>
            </button>

            <button
              type="button"
              className="dashboard-action-button dashboard-reset-button"
              onClick={handleResetPoints}
              disabled={isLoading}
            >
              <span>♻️</span>

              <div>
                <strong>
                  {loadingAction === "reset"
                    ? "Sıfırlanıyor..."
                    : "Tüm Puanları Sıfırla"}
                </strong>

                <small>
                  Bütün kullanıcı puanlarını siler
                </small>
              </div>
            </button>
          </div>
        </section>

        {winner && (
          <section className="dashboard-winner-wrapper">
            <WinnerBox winner={winner} />
          </section>
        )}

        <section className="dashboard-card dashboard-table-section">
          <div className="dashboard-section-title">
            <div className="dashboard-section-icon table">
              📊
            </div>

            <div>
              <h2>Kullanıcı Puanları</h2>

              <p>
                Kullanıcıların güncel puanlarını
                görüntüle ve düzenle.
              </p>
            </div>
          </div>

          <div className="dashboard-table-wrapper">
            <Table
              points={points}
              onUpdate={handleUpdatePoint}
            />
          </div>
        </section>

        <footer className="dashboard-footer">
          <p>
            👤 <strong>Uğur</strong>

            <span>—</span>

            <a
              href="https://kick.com/ugordi"
              target="_blank"
              rel="noopener noreferrer"
            >
              kick.com/ugordi
            </a>

            <span>—</span>

            📧 bayrak1017@gmail.com
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

