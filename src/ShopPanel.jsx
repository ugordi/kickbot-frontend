import {
  useCallback,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { BACKEND_URL } from "./config";

function ShopPanel() {
  const navigate = useNavigate();

  const [streamerId] = useState(
    localStorage.getItem("streamer_id")
  );

  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [price, setPrice] = useState(100);

  const [items, setItems] = useState([]);
  const [buyers, setBuyers] = useState({});
  const [openBuyerLists, setOpenBuyerLists] =
    useState({});

  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] =
    useState("");

  const fetchItems = useCallback(async () => {
    if (!streamerId) {
      setItems([]);
      return;
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/shop/${streamerId}`
      );

      setItems(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Ürünler alınamadı:",
        error
      );

      setItems([]);
      setMessage(
        "Ürün listesi alınamadı."
      );
    }
  }, [streamerId]);

  useEffect(() => {
    if (!streamerId) {
      setMessage(
        "Yayıncı bilgisi bulunamadı. Tekrar giriş yapın."
      );

      return;
    }

    fetchItems();
  }, [streamerId, fetchItems]);

  const fetchBuyers = async (itemId) => {
    const isAlreadyOpen =
      Boolean(openBuyerLists[itemId]);

    if (isAlreadyOpen) {
      setOpenBuyerLists((current) => ({
        ...current,
        [itemId]: false,
      }));

      return;
    }

    if (buyers[itemId]) {
      setOpenBuyerLists((current) => ({
        ...current,
        [itemId]: true,
      }));

      return;
    }

    try {
      setLoadingAction(
        `buyers-${itemId}`
      );

      const response = await axios.get(
        `${BACKEND_URL}/shop/buyers/${itemId}`
      );

      setBuyers((currentBuyers) => ({
        ...currentBuyers,
        [itemId]: Array.isArray(
          response.data
        )
          ? response.data
          : [],
      }));

      setOpenBuyerLists((current) => ({
        ...current,
        [itemId]: true,
      }));
    } catch (error) {
      console.error(
        "Satın alanlar alınamadı:",
        error
      );

      setMessage(
        "Satın alan kullanıcılar alınamadı."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const createItem = async () => {
    const cleanName = name.trim();

    const cleanCommand = command
      .trim()
      .replace(/^!+/, "")
      .toLocaleLowerCase("tr");

    if (!cleanName) {
      setMessage(
        "Ürün adı boş olamaz."
      );

      return;
    }

    if (!cleanCommand) {
      setMessage(
        "Ürün komutu boş olamaz."
      );

      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setMessage(
        "Geçerli bir ürün fiyatı girin."
      );

      return;
    }

    try {
      setLoadingAction("create");
      setMessage("");

      await axios.post(
        `${BACKEND_URL}/shop/create`,
        {
          streamer_id: streamerId,
          name: cleanName,
          command: cleanCommand,
          price,
        }
      );

      setName("");
      setCommand("");
      setPrice(100);

      setMessage(
        "Ürün başarıyla dükkana eklendi."
      );

      await fetchItems();
    } catch (error) {
      console.error(
        "Ürün oluşturma hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Ürün eklenemedi. Komut daha önce kullanılmış olabilir."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const deleteItem = async (itemId) => {
    const confirmed = window.confirm(
      "Bu ürünü silmek istediğinize emin misiniz?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingAction(
        `delete-${itemId}`
      );

      setMessage("");

      await axios.delete(
        `${BACKEND_URL}/shop/${itemId}`
      );

      setBuyers((currentBuyers) => {
        const updatedBuyers = {
          ...currentBuyers,
        };

        delete updatedBuyers[itemId];

        return updatedBuyers;
      });

      setOpenBuyerLists((currentLists) => {
        const updatedLists = {
          ...currentLists,
        };

        delete updatedLists[itemId];

        return updatedLists;
      });

      setMessage(
        "Ürün dükkandan silindi."
      );

      await fetchItems();
    } catch (error) {
      console.error(
        "Ürün silme hatası:",
        error
      );

      setMessage(
        error.response?.data?.error ||
          "Silme işlemi başarısız."
      );
    } finally {
      setLoadingAction("");
    }
  };

  const handleCommandChange = (value) => {
    const normalizedCommand = value
      .replace(/^!+/, "")
      .replace(/\s+/g, "")
      .toLocaleLowerCase("tr");

    setCommand(normalizedCommand);
  };

  const totalKnownPurchases =
    Object.values(buyers).reduce(
      (total, itemBuyers) =>
        total +
        (Array.isArray(itemBuyers)
          ? itemBuyers.length
          : 0),
      0
    );

  const isLoading =
    loadingAction !== "";

  return (
    <div className="shop-page">
      <div className="shop-container">
        <header className="shop-header">
          <div className="shop-header-icon">
            🛒
          </div>

          <h1>Dükkan Paneli</h1>

          <p>
            Yayın dükkanına ürün ekle,
            komutları yönet ve satın alanları
            görüntüle.
          </p>
        </header>

        <button
          type="button"
          className="shop-back-button"
          onClick={() => navigate("/")}
        >
          <span>←</span>
          Ana Panele Dön
        </button>

        <section className="shop-stats">
          <div className="shop-stat-card">
            <div className="shop-stat-icon products">
              📦
            </div>

            <div>
              <span>Toplam Ürün</span>

              <strong>
                {items.length.toLocaleString(
                  "tr-TR"
                )}
              </strong>
            </div>
          </div>

          <div className="shop-stat-card">
            <div className="shop-stat-icon purchases">
              🧾
            </div>

            <div>
              <span>Görüntülenen Satın Alım</span>

              <strong>
                {totalKnownPurchases.toLocaleString(
                  "tr-TR"
                )}
              </strong>
            </div>
          </div>

          <div className="shop-stat-card">
            <div className="shop-stat-icon command">
              💬
            </div>

            <div>
              <span>Chat Komutu</span>

              <strong className="shop-command-stat">
                !dükkan
              </strong>
            </div>
          </div>
        </section>

        {message && (
          <div className="shop-message">
            {message}
          </div>
        )}

        <section className="shop-card">
          <div className="shop-section-title">
            <div className="shop-section-icon create">
              ➕
            </div>

            <div>
              <h2>Yeni Ürün Ekle</h2>

              <p>
                Ürün adı, satın alma komutu
                ve puan fiyatını belirle.
              </p>
            </div>
          </div>

          <div className="shop-form-grid">
            <label className="shop-form-group shop-form-wide">
              <span>Ürün Adı</span>

              <input
                type="text"
                placeholder="Örnek: Ekran Kartı"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            <label className="shop-form-group shop-form-wide">
              <span>Satın Alma Komutu</span>

              <div className="shop-command-wrapper">
                <strong>!</strong>

                <input
                  type="text"
                  placeholder="Örnek: ekrankarti"
                  value={command}
                  onChange={(event) =>
                    handleCommandChange(
                      event.target.value
                    )
                  }
                />
              </div>
            </label>

            <label className="shop-form-group">
              <span>Ürün Fiyatı</span>

              <div className="shop-input-wrapper">
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

            <div className="shop-product-preview">
              <span>Chat Ön İzlemesi</span>

              <code>
                !
                {command.trim() ||
                  "urun"}
              </code>
            </div>
          </div>

          <div className="shop-preview-message">
            <span>🛍️</span>

            <p>
              Kullanıcılar{" "}
              <code>
                !
                {command.trim() ||
                  "urun"}
              </code>{" "}
              yazarak ürünü satın alabilir.
            </p>
          </div>

          <button
            type="button"
            className="shop-create-button"
            onClick={createItem}
            disabled={isLoading}
          >
            {loadingAction === "create"
              ? "Ürün Ekleniyor..."
              : "🛍️ Ürünü Dükkana Ekle"}
          </button>
        </section>

        <section className="shop-command-info">
          <div className="shop-command-info-icon">
            💬
          </div>

          <div>
            <strong>
              Chat Dükkan Komutu
            </strong>

            <p>
              İzleyiciler{" "}
              <code>!dükkan</code>{" "}
              yazarak mevcut ürünleri ve
              fiyatlarını görebilir.
            </p>
          </div>
        </section>

        <section className="shop-card">
          <div className="shop-section-title">
            <div className="shop-section-icon products">
              📦
            </div>

            <div>
              <h2>Mevcut Ürünler</h2>

              <p>
                Dükkan ürünlerini yönet ve
                satın alan kullanıcıları incele.
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="shop-empty-state">
              <span>📭</span>

              <div>
                <strong>
                  Dükkanda ürün bulunmuyor
                </strong>

                <p>
                  Yukarıdaki formu kullanarak
                  ilk ürününü ekleyebilirsin.
                </p>
              </div>
            </div>
          ) : (
            <div className="shop-product-list">
              {items.map((item) => {
                const itemBuyers =
                  buyers[item.id] || [];

                const isBuyerListOpen =
                  Boolean(
                    openBuyerLists[item.id]
                  );

                const isBuyerLoading =
                  loadingAction ===
                  `buyers-${item.id}`;

                const isDeleting =
                  loadingAction ===
                  `delete-${item.id}`;

                return (
                  <article
                    key={item.id}
                    className="shop-product-card"
                  >
                    <div className="shop-product-top">
                      <div className="shop-product-symbol">
                        🛍️
                      </div>

                      <div className="shop-product-main">
                        <div className="shop-product-title-row">
                          <h3>
                            {item.name}
                          </h3>

                          <span className="shop-product-price">
                            {Number(
                              item.price || 0
                            ).toLocaleString(
                              "tr-TR"
                            )}{" "}
                            puan
                          </span>
                        </div>

                        <div className="shop-product-meta">
                          <span>
                            Satın alma komutu:
                          </span>

                          <code>
                            !{item.command}
                          </code>
                        </div>

                        {item.created_at && (
                          <small>
                            Eklenme tarihi:{" "}
                            {new Date(
                              item.created_at
                            ).toLocaleString(
                              "tr-TR"
                            )}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="shop-product-actions">
                      <button
                        type="button"
                        className="shop-buyers-button"
                        disabled={isLoading}
                        onClick={() =>
                          fetchBuyers(item.id)
                        }
                      >
                        <span>👥</span>

                        {isBuyerLoading
                          ? "Yükleniyor..."
                          : isBuyerListOpen
                          ? "Satın Alanları Gizle"
                          : "Satın Alanları Göster"}
                      </button>

                      <button
                        type="button"
                        className="shop-delete-button"
                        disabled={isLoading}
                        onClick={() =>
                          deleteItem(item.id)
                        }
                      >
                        <span>🗑️</span>

                        {isDeleting
                          ? "Siliniyor..."
                          : "Ürünü Sil"}
                      </button>
                    </div>

                    {isBuyerListOpen && (
                      <div className="shop-buyers-section">
                        <div className="shop-buyers-header">
                          <div>
                            <strong>
                              Satın Alanlar
                            </strong>

                            <span>
                              Toplam{" "}
                              {
                                itemBuyers.length
                              }{" "}
                              kullanıcı
                            </span>
                          </div>

                          <div className="shop-buyers-count">
                            👥{" "}
                            {
                              itemBuyers.length
                            }
                          </div>
                        </div>

                        {itemBuyers.length ===
                        0 ? (
                          <div className="shop-no-buyers">
                            Bu ürünü henüz satın
                            alan olmadı.
                          </div>
                        ) : (
                          <div className="shop-buyers-list">
                            {itemBuyers.map(
                              (
                                buyer,
                                index
                              ) => (
                                <div
                                  key={`${buyer.username}-${buyer.created_at}-${index}`}
                                  className="shop-buyer-item"
                                >
                                  <div className="shop-buyer-rank">
                                    {index + 1}
                                  </div>

                                  <div className="shop-buyer-info">
                                    <strong>
                                      @
                                      {
                                        buyer.username
                                      }
                                    </strong>

                                    <span>
                                      {buyer.created_at
                                        ? new Date(
                                            buyer.created_at
                                          ).toLocaleString(
                                            "tr-TR"
                                          )
                                        : "Tarih bulunamadı"}
                                    </span>
                                  </div>

                                  <div className="shop-purchased-badge">
                                    Satın aldı
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="shop-footer">
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

export default ShopPanel;
