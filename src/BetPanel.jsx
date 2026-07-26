import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";

function BetPanel() {
  const navigate = useNavigate();

  const [streamerId] = useState(
    localStorage.getItem("streamer_id")
  );

  const [title, setTitle] = useState("Win or Lose ?");
  const [maxBet, setMaxBet] = useState(1000);
  const [duration, setDuration] = useState(120);

  const [activeBet, setActiveBet] = useState(null);
  const [history, setHistory] = useState([]);
  const [remainingTime, setRemainingTime] = useState(null);

  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const quickMaxBets = [
    1000,
    2000,
    5000,
    10000,
    20000,
  ];

  const fetchActiveBet = async () => {
    if (!streamerId) {
      setActiveBet(null);
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/bet/active/${streamerId}`
      );

      setActiveBet(response.data || null);
    } catch (error) {
      console.error("Aktif bet alınamadı:", error);
      setActiveBet(null);
    }
  };

  const fetchHistory = async () => {
    if (!streamerId) {
      setHistory([]);
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/history/${streamerId}`
      );

      setHistory(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Bet geçmişi alınamadı:", error);
      setHistory([]);
    }
  };

  useEffect(() => {
    if (!streamerId) {
      setMessage(
        "Yayıncı bilgisi bulunamadı. Tekrar giriş yapın."
      );
      return;
    }

    fetchActiveBet();
    fetchHistory();
  }, [streamerId]);

  useEffect(() => {
    if (
      !activeBet ||
      !activeBet.created_at ||
      !activeBet.duration_seconds
    ) {
      setRemainingTime(null);
      return undefined;
    }

    const createdAt = new Date(
      activeBet.created_at
    ).getTime();

    const durationMilliseconds =
      Number(activeBet.duration_seconds) * 1000;

    const endTime =
      createdAt + durationMilliseconds;

    const updateTimer = () => {
      const difference = Math.max(
        0,
        Math.floor(
          (endTime - Date.now()) / 1000
        )
      );

      setRemainingTime(difference);

      return difference;
    };

    updateTimer();

    const timer = setInterval(() => {
      const difference = updateTimer();

      if (difference === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBet]);

  const createBet = async () => {
    const cleanTitle = title.trim();

    if (!streamerId) {
      setMessage("Yayıncı bilgisi bulunamadı.");
      return;
    }

    if (!cleanTitle) {
      setMessage("Bet başlığı boş olamaz.");
      return;
    }

    if (
      !Number.isFinite(maxBet) ||
      maxBet <= 0
    ) {
      setMessage(
        "Geçerli bir maksimum bet miktarı girin."
      );
      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      setMessage(
        "Geçerli bir bet süresi girin."
      );
      return;
    }

    try {
      setLoadingAction("create");
      setMessage("");

      await axios.post(
        `${BACKEND_URL}/bet/create`,
        {
          streamer_id: streamerId,
          title: cleanTitle,
          max_bet: maxBet,
          duration_seconds: duration,
        }
      );

      setTitle("Win or Lose ?");
      setMaxBet(1000);
      setDuration(120);
      setMessage(
        "Yeni bet başarıyla başlatıldı."
      );

      await Promise.all([
        fetchActiveBet(),
        fetchHistory(),
      ]);
    } catch (error) {
      console.error(
        "Bet oluşturma hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Bet oluşturulamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const resolveBet = async (winner) => {
    if (!streamerId || !activeBet) {
      return;
    }

    try {
      setLoadingAction(
        winner === 1 ? "win" : "lose"
      );

      setMessage("");

      await axios.post(
        `${BACKEND_URL}/bet/resolve`,
        {
          streamer_id: streamerId,
          winner,
        }
      );

      if (winner === 1) {
        setMessage(
          "WIN kazandı. Ödüller dağıtıldı."
        );
      } else {
        setMessage(
          "LOSE kazandı. Ödüller dağıtıldı."
        );
      }

      setActiveBet(null);
      setRemainingTime(null);

      await fetchHistory();
    } catch (error) {
      console.error(
        "Bet sonuçlandırma hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Bet sonuçlandırılamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const cancelBet = async () => {
    if (!streamerId || !activeBet) {
      return;
    }

    try {
      setLoadingAction("cancel");
      setMessage("");

      await axios.post(
        `${BACKEND_URL}/bet/cancel`,
        {
          streamer_id: streamerId,
        }
      );

      setMessage(
        "Bet iptal edildi. Puanlar geri verildi."
      );

      setActiveBet(null);
      setRemainingTime(null);

      await fetchHistory();
    } catch (error) {
      console.error(
        "Bet iptal hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Bet iptal edilemedi."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const houseWinBet = async () => {
    if (!streamerId || !activeBet) {
      return;
    }

    try {
      setLoadingAction("house");
      setMessage("");

      /*
        Onay penceresi yok.
        Butona basıldığı anda doğrudan çalışır.
      */
      await axios.post(
        `${BACKEND_URL}/bet/housewin`,
        {
          streamer_id: streamerId,
        }
      );

      setMessage(
        "Herkes kaybetti. Yatırılan puanlar geri verilmedi."
      );

      setActiveBet(null);
      setRemainingTime(null);

      await fetchHistory();
    } catch (error) {
      console.error(
        "Herkes kaybetsin hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Bet sonuçlandırılamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const getHistoryResult = (winner) => {
    if (winner === 1) {
      return {
        text: "WIN Kazandı",
        className: "bet-result-win",
      };
    }

    if (winner === 2) {
      return {
        text: "LOSE Kazandı",
        className: "bet-result-lose",
      };
    }

    if (winner === 0) {
      return {
        text: "Herkes Kaybetti",
        className: "bet-result-house",
      };
    }

    return {
      text: "Bet İptal Edildi",
      className: "bet-result-cancel",
    };
  };

  const isLoading =
    loadingAction !== "";

  return (
    <div className="bet-page">
      <div className="bet-container">
        <header className="bet-header">
          <div className="bet-header-icon">
            💰
          </div>

          <h1>Bet Paneli</h1>

          <p>
            Yeni bahis oluştur, sonucu belirle
            ve geçmiş bahisleri görüntüle.
          </p>
        </header>

        <button
          type="button"
          className="bet-back-button"
          onClick={() => navigate("/")}
        >
          <span>←</span>
          Ana Panele Dön
        </button>

        <section className="bet-card">
          <div className="bet-section-title">
            <div className="bet-section-icon">
              🎯
            </div>

            <div>
              <h2>Yeni Bet Oluştur</h2>

              <p>
                Bahis bilgilerini belirleyerek
                yeni bir bet başlat.
              </p>
            </div>
          </div>

          <div className="bet-form-group">
            <label htmlFor="bet-title">
              Bet Başlığı
            </label>

            <input
              id="bet-title"
              type="text"
              value={title}
              placeholder="Örnek: Bu maçı kazanır mı?"
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />
          </div>

          <div className="bet-form-grid">
            <div className="bet-form-group">
              <label htmlFor="max-bet">
                Maksimum Bet
              </label>

              <div className="bet-input-wrapper">
                <input
                  id="max-bet"
                  type="number"
                  min="1"
                  value={maxBet}
                  onChange={(event) =>
                    setMaxBet(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <span>PUAN</span>
              </div>
            </div>

            <div className="bet-form-group">
              <label htmlFor="bet-duration">
                Bet Süresi
              </label>

              <div className="bet-input-wrapper">
                <input
                  id="bet-duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <span>SANİYE</span>
              </div>
            </div>
          </div>

          <div className="bet-quick-section">
            <p>Hızlı Maksimum Bet</p>

            <div className="bet-quick-grid">
              {quickMaxBets.map(
                (amount) => (
                  <button
                    type="button"
                    key={amount}
                    className={
                      maxBet === amount
                        ? "bet-quick-button active"
                        : "bet-quick-button"
                    }
                    onClick={() =>
                      setMaxBet(amount)
                    }
                  >
                    {amount.toLocaleString(
                      "tr-TR"
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            className="bet-create-button"
            onClick={createBet}
            disabled={isLoading}
          >
            {loadingAction === "create"
              ? "Bet Başlatılıyor..."
              : "🚀 Bet Başlat"}
          </button>
        </section>

        {activeBet && (
          <section className="bet-card bet-active-card">
            <div className="bet-active-header">
              <div className="bet-section-title">
                <div className="bet-section-icon active">
                  📢
                </div>

                <div>
                  <h2>Aktif Bet</h2>

                  <p>
                    Bahis şu anda sonuçlandırılmayı
                    bekliyor.
                  </p>
                </div>
              </div>

              {remainingTime !== null && (
                <div
                  className={
                    remainingTime === 0
                      ? "bet-timer expired"
                      : remainingTime <= 10
                      ? "bet-timer warning"
                      : "bet-timer"
                  }
                >
                  <span>🕒</span>

                  {remainingTime === 0
                    ? "Süre doldu"
                    : `${remainingTime} saniye`}
                </div>
              )}
            </div>

            <div className="bet-active-info">
              <h3>{activeBet.title}</h3>

              <p>
                İzleyiciler{" "}
                <code className="bet-code-win">
                  !win [puan]
                </code>{" "}
                veya{" "}
                <code className="bet-code-lose">
                  !lose [puan]
                </code>{" "}
                yazarak katılır.
              </p>
            </div>

            <div className="bet-action-grid">
              <button
                type="button"
                className="bet-action-button bet-win-button"
                disabled={isLoading}
                onClick={() => resolveBet(1)}
              >
                <span className="bet-action-icon">
                  ✅
                </span>

                <span>
                  {loadingAction === "win"
                    ? "İşleniyor..."
                    : "WIN Kazandı"}
                </span>
              </button>

              <button
                type="button"
                className="bet-action-button bet-lose-button"
                disabled={isLoading}
                onClick={() => resolveBet(2)}
              >
                <span className="bet-action-icon">
                  ❌
                </span>

                <span>
                  {loadingAction === "lose"
                    ? "İşleniyor..."
                    : "LOSE Kazandı"}
                </span>
              </button>

              <button
                type="button"
                className="bet-action-button bet-cancel-button"
                disabled={isLoading}
                onClick={cancelBet}
              >
                <span className="bet-action-icon">
                  ↩️
                </span>

                <span>
                  {loadingAction === "cancel"
                    ? "İptal Ediliyor..."
                    : "Beti İptal Et"}
                </span>
              </button>

              <button
                type="button"
                className="bet-action-button bet-house-button"
                disabled={isLoading}
                onClick={houseWinBet}
              >
                <span className="bet-action-icon">
                  💀
                </span>

                <span>
                  {loadingAction === "house"
                    ? "İşleniyor..."
                    : "Herkes Kaybetsin"}
                </span>
              </button>
            </div>

            <div className="bet-action-notes">
              <div className="bet-cancel-note">
                ↩️ İptal edilirse yatırılan
                puanlar geri verilir.
              </div>

              <div className="bet-house-note">
                💀 Herkes kaybederse hiçbir
                puan geri verilmez.
              </div>
            </div>
          </section>
        )}

        {message && (
          <div className="bet-message">
            {message}
          </div>
        )}

        {history.length > 0 && (
          <section className="bet-card bet-history-card">
            <div className="bet-section-title">
              <div className="bet-section-icon">
                📜
              </div>

              <div>
                <h2>Geçmiş Betler</h2>

                <p>
                  Sonuçlandırılan son bahisler.
                </p>
              </div>
            </div>

            <div className="bet-history-list">
              {history.map(
                (bet, index) => {
                  const result =
                    getHistoryResult(
                      bet.winner
                    );

                  return (
                    <div
                      className="bet-history-item"
                      key={`${bet.created_at || "bet"}-${index}`}
                    >
                      <div className="bet-history-content">
                        <h3>
                          🎯 {bet.title}
                        </h3>

                        {bet.created_at && (
                          <span>
                            {new Date(
                              bet.created_at
                            ).toLocaleString(
                              "tr-TR"
                            )}
                          </span>
                        )}
                      </div>

                      <div
                        className={`bet-history-result ${result.className}`}
                      >
                        {result.text}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        <footer className="bet-footer">
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

export default BetPanel;