import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";

function GiveawayPanel() {
  const navigate = useNavigate();

  const [streamerId] = useState(
    localStorage.getItem("streamer_id")
  );

  const [title, setTitle] = useState("");
  const [command, setCommand] = useState("");
  const [price, setPrice] = useState(100);
  const [maxTickets, setMaxTickets] =
    useState(1);

  const [entries, setEntries] = useState([]);
  const [winner, setWinner] = useState(null);
  const [allGiveaways, setAllGiveaways] =
    useState([]);

  const [activeGiveaway, setActiveGiveaway] =
    useState(null);

  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] =
    useState("");

  const fetchEntries = useCallback(async () => {
    if (!streamerId) {
      setEntries([]);
      setActiveGiveaway(null);
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/giveaway/${streamerId}`
      );

      const giveaway = response.data;

      if (giveaway?.id) {
        setActiveGiveaway(giveaway);

        const entryResponse = await axios.get(
          `${BACKEND_URL}/giveaway/entries/${giveaway.id}`
        );

        setEntries(
          Array.isArray(entryResponse.data)
            ? entryResponse.data
            : []
        );
      } else {
        setActiveGiveaway(null);
        setEntries([]);
      }
    } catch (error) {
      console.error(
        "Katılımcılar alınamadı:",
        error
      );

      setEntries([]);
      setActiveGiveaway(null);
    }
  }, [streamerId]);

  const fetchAllGiveaways =
    useCallback(async () => {
      if (!streamerId) {
        setAllGiveaways([]);
        return;
      }

      try {
        const response = await axios.get(
          `${BACKEND_URL}/giveaway/list/${streamerId}`
        );

        setAllGiveaways(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        console.error(
          "Çekiliş geçmişi alınamadı:",
          error
        );

        setAllGiveaways([]);
      }
    }, [streamerId]);

  useEffect(() => {
    if (!streamerId) {
      setMessage(
        "Yayıncı bilgisi bulunamadı. Tekrar giriş yapın."
      );

      return;
    }

    fetchEntries();
    fetchAllGiveaways();
  }, [
    streamerId,
    fetchEntries,
    fetchAllGiveaways,
  ]);

  const createGiveaway = async () => {
    const cleanTitle = title.trim();

    const cleanCommand = command
      .trim()
      .replace(/^!+/, "")
      .toLocaleLowerCase("tr");

    if (!cleanTitle) {
      setMessage(
        "Çekiliş başlığı boş olamaz."
      );

      return;
    }

    if (!cleanCommand) {
      setMessage(
        "Çekiliş komutu boş olamaz."
      );

      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setMessage(
        "Geçerli bir bilet fiyatı girin."
      );

      return;
    }

    if (
      !Number.isFinite(maxTickets) ||
      maxTickets <= 0
    ) {
      setMessage(
        "Geçerli bir maksimum bilet sayısı girin."
      );

      return;
    }

    try {
      setLoadingAction("create");
      setMessage("");
      setWinner(null);

      await axios.post(
        `${BACKEND_URL}/giveaway/create`,
        {
          streamer_id: streamerId,
          title: cleanTitle,
          command: cleanCommand,
          ticket_price: price,
          max_tickets_per_user: maxTickets,
        }
      );

      setTitle("");
      setCommand("");
      setPrice(100);
      setMaxTickets(1);

      setMessage(
        "Çekiliş başarıyla başlatıldı."
      );

      await Promise.all([
        fetchEntries(),
        fetchAllGiveaways(),
      ]);
    } catch (error) {
      console.error(
        "Çekiliş oluşturma hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Çekiliş başlatılamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const deactivateGiveaway = async (
    giveawayId
  ) => {
    const confirmed = window.confirm(
      "Bu çekilişi kapatmak istediğinize emin misiniz?"
    );

    if (!confirmed) return;

    try {
      setLoadingAction(
        `deactivate-${giveawayId}`
      );

      setMessage("");

      await axios.post(
        `${BACKEND_URL}/giveaway/deactivate`,
        {
          giveaway_id: giveawayId,
        }
      );

      setMessage(
        "Çekiliş kapatıldı."
      );

      await Promise.all([
        fetchEntries(),
        fetchAllGiveaways(),
      ]);
    } catch (error) {
      console.error(
        "Çekiliş kapatma hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Çekiliş kapatılamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const drawWinner = async () => {
    try {
      setLoadingAction("draw");
      setMessage("");

      const response = await axios.post(
        `${BACKEND_URL}/giveaway/draw`,
        {
          streamer_id: streamerId,
        }
      );

      setWinner(response.data.winner);

      if (response.data.giveaway_id) {
        const entryResponse = await axios.get(
          `${BACKEND_URL}/giveaway/entries/${response.data.giveaway_id}`
        );

        setEntries(
          Array.isArray(entryResponse.data)
            ? entryResponse.data
            : []
        );
      }

      setMessage(
        response.data?.winner?.username
          ? `Kazanan: ${response.data.winner.username}`
          : "Kazanan seçildi."
      );

      await fetchAllGiveaways();
      await fetchEntries();
    } catch (error) {
      console.error(
        "Çekiliş hatası:",
        error.response?.data ||
          error.message
      );

      setMessage(
        error.response?.data?.error ||
          "Kazanan seçilemedi. Katılımcı olduğundan emin olun."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const isLoading =
    loadingAction !== "";

  const totalTickets = entries.reduce(
    (total, entry) =>
      total + Number(entry.tickets || 0),
    0
  );

  const activeGiveawayCount =
    allGiveaways.filter(
      (giveaway) =>
        Number(giveaway.is_active) === 1
    ).length;

  return (
    <div className="giveaway-page">
      <div className="giveaway-container">
        <header className="giveaway-header">
          <div className="giveaway-header-icon">
            🎉
          </div>

          <h1>Çekiliş Paneli</h1>

          <p>
            Yeni çekiliş oluştur, katılımcıları
            takip et ve kazananı belirle.
          </p>
        </header>

        <button
          type="button"
          className="giveaway-back-button"
          onClick={() => navigate("/")}
        >
          <span>←</span>
          Ana Panele Dön
        </button>

        <section className="giveaway-stats">
          <div className="giveaway-stat-card">
            <div className="giveaway-stat-icon active">
              🟢
            </div>

            <div>
              <span>Aktif Çekiliş</span>

              <strong>
                {activeGiveawayCount}
              </strong>
            </div>
          </div>

          <div className="giveaway-stat-card">
            <div className="giveaway-stat-icon users">
              👥
            </div>

            <div>
              <span>Katılımcı</span>

              <strong>
                {entries.length}
              </strong>
            </div>
          </div>

          <div className="giveaway-stat-card">
            <div className="giveaway-stat-icon tickets">
              🎫
            </div>

            <div>
              <span>Toplam Bilet</span>

              <strong>
                {totalTickets.toLocaleString(
                  "tr-TR"
                )}
              </strong>
            </div>
          </div>
        </section>

        {message && (
          <div className="giveaway-message">
            {message}
          </div>
        )}

        <section className="giveaway-card">
          <div className="giveaway-section-title">
            <div className="giveaway-section-icon create">
              📝
            </div>

            <div>
              <h2>Yeni Çekiliş Oluştur</h2>

              <p>
                Başlık, komut ve bilet
                kurallarını belirle.
              </p>
            </div>
          </div>

          <div className="giveaway-form-grid">
            <label className="giveaway-form-group giveaway-form-wide">
              <span>Çekiliş Başlığı</span>

              <input
                type="text"
                placeholder="Örnek: Oyuncu koltuğu çekilişi"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />
            </label>

            <label className="giveaway-form-group giveaway-form-wide">
              <span>Katılım Komutu</span>

              <div className="giveaway-command-wrapper">
                <strong>!</strong>

                <input
                  type="text"
                  placeholder="Örnek: koltuk"
                  value={command}
                  onChange={(event) =>
                    setCommand(
                      event.target.value
                        .replace(/^!+/, "")
                    )
                  }
                />
              </div>
            </label>

            <label className="giveaway-form-group">
              <span>Bilet Fiyatı</span>

              <div className="giveaway-input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(event) =>
                    setPrice(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <small>PUAN</small>
              </div>
            </label>

            <label className="giveaway-form-group">
              <span>Maksimum Bilet</span>

              <div className="giveaway-input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={maxTickets}
                  onChange={(event) =>
                    setMaxTickets(
                      Number(
                        event.target.value
                      )
                    )
                  }
                />

                <small>ADET</small>
              </div>
            </label>
          </div>

          <div className="giveaway-preview">
            <span>Komut ön izlemesi</span>

            <code>
              !
              {command
                .trim()
                .replace(/^!+/, "") ||
                "komut"}{" "}
              [puan]
            </code>
          </div>

          <button
            type="button"
            className="giveaway-create-button"
            onClick={createGiveaway}
            disabled={isLoading}
          >
            {loadingAction === "create"
              ? "Çekiliş Başlatılıyor..."
              : "🚀 Çekilişi Başlat"}
          </button>
        </section>

        <section className="giveaway-card">
          <div className="giveaway-section-title">
            <div className="giveaway-section-icon participants">
              👥
            </div>

            <div>
              <h2>Aktif Çekiliş</h2>

              <p>
                Katılımcıları ve bilet
                sayılarını görüntüle.
              </p>
            </div>
          </div>

          {activeGiveaway ? (
            <div className="giveaway-active-info">
              <div>
                <span>Çekiliş</span>

                <strong>
                  {activeGiveaway.title}
                </strong>
              </div>

              <div>
                <span>Komut</span>

                <code>
                  !{activeGiveaway.command}
                </code>
              </div>

              <div>
                <span>Bilet</span>

                <strong>
                  {Number(
                    activeGiveaway.ticket_price ||
                      0
                  ).toLocaleString(
                    "tr-TR"
                  )}{" "}
                  puan
                </strong>
              </div>
            </div>
          ) : (
            <div className="giveaway-empty-state">
              <span>📭</span>

              <div>
                <strong>
                  Aktif çekiliş bulunmuyor
                </strong>

                <p>
                  Yeni bir çekiliş oluşturarak
                  katılım toplamaya başlayabilirsin.
                </p>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="giveaway-empty-participants">
              Henüz çekilişe katılan olmadı.
            </div>
          ) : (
            <div className="giveaway-participant-list">
              {entries.map(
                (entry, index) => (
                  <div
                    key={entry.user_id}
                    className="giveaway-participant-item"
                  >
                    <div className="giveaway-participant-rank">
                      {index + 1}
                    </div>

                    <div className="giveaway-participant-name">
                      <strong>
                        {entry.username}
                      </strong>

                      <span>
                        Kullanıcı ID:{" "}
                        {entry.user_id}
                      </span>
                    </div>

                    <div className="giveaway-ticket-badge">
                      🎫{" "}
                      {Number(
                        entry.tickets || 0
                      ).toLocaleString(
                        "tr-TR"
                      )}{" "}
                      bilet
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <button
            type="button"
            className="giveaway-draw-button"
            onClick={drawWinner}
            disabled={
              isLoading ||
              entries.length === 0 ||
              !activeGiveaway
            }
          >
            {loadingAction === "draw"
              ? "Kazanan Seçiliyor..."
              : "🎯 Kazananı Seç"}
          </button>

          {winner && (
            <div className="giveaway-winner-box">
              <div className="giveaway-winner-crown">
                👑
              </div>

              <div>
                <span>
                  Çekiliş Kazananı
                </span>

                <strong>
                  {winner.username}
                </strong>

                <small>
                  {winner.tickets
                    ? `${winner.tickets} bilet ile katıldı`
                    : "Tebrikler!"}
                </small>
              </div>
            </div>
          )}
        </section>

        <section className="giveaway-card">
          <div className="giveaway-section-title">
            <div className="giveaway-section-icon history">
              📜
            </div>

            <div>
              <h2>Çekiliş Geçmişi</h2>

              <p>
                Daha önce oluşturulan tüm
                çekilişleri görüntüle.
              </p>
            </div>
          </div>

          {allGiveaways.length === 0 ? (
            <div className="giveaway-empty-participants">
              Henüz çekiliş oluşturulmadı.
            </div>
          ) : (
            <div className="giveaway-history-list">
              {allGiveaways.map(
                (giveaway) => {
                  const isActive =
                    Number(
                      giveaway.is_active
                    ) === 1;

                  return (
                    <div
                      key={giveaway.id}
                      className="giveaway-history-item"
                    >
                      <div className="giveaway-history-main">
                        <div className="giveaway-history-title-row">
                          <h3>
                            {giveaway.title}
                          </h3>

                          <span
                            className={
                              isActive
                                ? "giveaway-status active"
                                : "giveaway-status ended"
                            }
                          >
                            {isActive
                              ? "🟢 Aktif"
                              : "🔴 Bitti"}
                          </span>
                        </div>

                        <div className="giveaway-history-details">
                          <span>
                            Komut:{" "}
                            <code>
                              !
                              {
                                giveaway.command
                              }
                            </code>
                          </span>

                          <span>
                            Bilet:{" "}
                            {Number(
                              giveaway.ticket_price ||
                                0
                            ).toLocaleString(
                              "tr-TR"
                            )}{" "}
                            puan
                          </span>

                          <span>
                            Maksimum:{" "}
                            {
                              giveaway.max_tickets_per_user
                            }{" "}
                            bilet
                          </span>
                        </div>

                        {giveaway.created_at && (
                          <small>
                            {new Date(
                              giveaway.created_at
                            ).toLocaleString(
                              "tr-TR"
                            )}
                          </small>
                        )}
                      </div>

                      {isActive && (
                        <button
                          type="button"
                          className="giveaway-close-button"
                          disabled={isLoading}
                          onClick={() =>
                            deactivateGiveaway(
                              giveaway.id
                            )
                          }
                        >
                          {loadingAction ===
                          `deactivate-${giveaway.id}`
                            ? "Kapatılıyor..."
                            : "✕ Çekilişi Kapat"}
                        </button>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <footer className="giveaway-footer">
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

export default GiveawayPanel;