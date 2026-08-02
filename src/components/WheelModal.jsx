// === frontend/src/components/WheelModal.jsx ===

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./WheelModal.css";

const SPIN_DURATION_MS = 8000;

const RESULT_CONFIG = {
  WIN: {
    label: "KAZAN",
    title: "Büyük Kazanç",
    description:
      "Girilen puan kullanıcının hesabına eklenecek.",
    icon: "🏆",
    effectClass: "wheel-effect-win",
  },

  LOSE: {
    label: "KAYBET",
    title: "Şans Bu Kez Gülmedi",
    description:
      "Girilen puan kullanıcının hesabından düşülecek.",
    icon: "💀",
    effectClass: "wheel-effect-lose",
  },

  HOUSE: {
    label: "KASA",
    title: "Kasa Kazandı",
    description:
      "Girilen puan kullanıcının hesabından düşülecek.",
    icon: "🏦",
    effectClass: "wheel-effect-house",
  },
};

/*
  Çark segmentleri:

  WIN:
  -60° ile 60° arasında
  merkez: 0°

  LOSE:
  60° ile 180° arasında
  merkez: 120°

  HOUSE:
  180° ile 300° arasında
  merkez: 240°

  Pointer yukarıda olduğu için segmenti pointer'a getiren dönüş:
*/
const RESULT_TARGET_ROTATION = {
  WIN: 0,
  LOSE: 240,
  HOUSE: 120,
};

const CONFETTI_ITEMS = Array.from(
  { length: 52 },
  (_, index) => ({
    id: index,
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 13) * 0.07}s`,
    duration: `${2.2 + (index % 7) * 0.18}s`,
    rotation: `${(index * 53) % 360}deg`,
    size: `${5 + (index % 5) * 2}px`,
  })
);

const EMBER_ITEMS = Array.from(
  { length: 30 },
  (_, index) => ({
    id: index,
    left: `${(index * 41) % 100}%`,
    delay: `${(index % 10) * 0.09}s`,
    duration: `${1.7 + (index % 6) * 0.2}s`,
    size: `${4 + (index % 4) * 2}px`,
  })
);

function WheelModal({
  open,
  user,
  streamerId,
  onClose,
  onCompleted,
  createWheelRequest,
  spinWheelRequest,
  completeWheelRequest,
  cancelWheelRequest,
}) {
  const spinTimerRef = useRef(null);
  const resultTimerRef = useRef(null);

  const [amount, setAmount] = useState("");
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [effectActive, setEffectActive] =
    useState(false);

  const currentPoints = Number(
    user?.points || 0
  );

  const numericAmount = Number(amount || 0);

  const formattedCurrentPoints = useMemo(
    () =>
      currentPoints.toLocaleString("tr-TR"),
    [currentPoints]
  );

  const formattedAmount = useMemo(
    () =>
      Number(
        session?.amount ||
          numericAmount ||
          0
      ).toLocaleString("tr-TR"),
    [session?.amount, numericAmount]
  );

  const resultConfig = result
    ? RESULT_CONFIG[result]
    : null;

  const resetModal = useCallback(() => {
    if (spinTimerRef.current) {
      window.clearTimeout(
        spinTimerRef.current
      );
    }

    if (resultTimerRef.current) {
      window.clearTimeout(
        resultTimerRef.current
      );
    }

    setAmount("");
    setSession(null);
    setResult(null);

    setRotation(0);
    setSpinning(false);
    setShowResult(false);

    setLoading(false);
    setError("");
    setEffectActive(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    resetModal();
  }, [
    open,
    user?.user_id,
    resetModal,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    document.body.classList.add(
      "wheel-modal-body-lock"
    );

    return () => {
      document.body.classList.remove(
        "wheel-modal-body-lock"
      );
    };
  }, [open]);

  const validateAmount = () => {
    const parsedAmount = Number(amount);

    if (
      !Number.isSafeInteger(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setError(
        "Çevrilecek puan sıfırdan büyük bir tam sayı olmalı."
      );

      return null;
    }

    if (parsedAmount > currentPoints) {
      setError(
        "Kullanıcının yeterli puanı bulunmuyor."
      );

      return null;
    }

    return parsedAmount;
  };

  const prepareWheel = async () => {
    const validAmount = validateAmount();

    if (!validAmount) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await createWheelRequest(
          streamerId,
          user.user_id,
          validAmount
        );

      setSession(response.data.wheel);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Çark hazırlanamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (
      !session?.id ||
      spinning ||
      loading ||
      result
    ) {
      return;
    }

    try {
      setError("");
      setShowResult(false);
      setEffectActive(false);
      setSpinning(true);

      const response =
        await spinWheelRequest(session.id);

      const backendResult =
        response.data?.wheel?.result;

      if (
        !RESULT_CONFIG[backendResult]
      ) {
        throw new Error(
          "Sunucu geçersiz bir çark sonucu döndürdü."
        );
      }

      setResult(backendResult);

      const baseRotation =
        RESULT_TARGET_ROTATION[
          backendResult
        ];

      /*
        10 tam tur + sonuç açısı.
        Ufak sapma segmentin içinden çıkmayacak
        şekilde yalnızca görsel doğallık sağlar.
      */
      const safeOffset =
        Math.floor(Math.random() * 31) -
        15;

      const totalRotation =
        rotation +
        360 * 10 +
        baseRotation +
        safeOffset;

      window.requestAnimationFrame(() => {
        setRotation(totalRotation);
      });

      spinTimerRef.current =
        window.setTimeout(() => {
          setSpinning(false);
          setShowResult(true);

          resultTimerRef.current =
            window.setTimeout(() => {
              setEffectActive(true);
            }, 120);
        }, SPIN_DURATION_MS);
    } catch (requestError) {
      setSpinning(false);

      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Çark çevrilemedi."
      );
    }
  };

  const completeWheel = async () => {
    if (
      !session?.id ||
      !result ||
      spinning ||
      loading
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await completeWheelRequest(
          session.id
        );

      onCompleted(response.data.wheel);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Çark işlemi tamamlanamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelWheel = async () => {
    if (spinning) {
      setError(
        "Çark dönerken işlem iptal edilemez."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      if (session?.id) {
        await cancelWheelRequest(
          session.id
        );
      }

      resetModal();
      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Çark işlemi iptal edilemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(
    async () => {
      if (loading || spinning) {
        return;
      }

      if (
        session?.id &&
        session.status !== "COMPLETED" &&
        session.status !== "CANCELLED"
      ) {
        await cancelWheel();
        return;
      }

      resetModal();
      onClose();
    },
    [
      loading,
      spinning,
      session,
      onClose,
      resetModal,
    ]
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, handleClose]);

  if (!open || !user) {
    return null;
  }

  const setQuickAmount = (value) => {
    setAmount(String(value));
    setError("");
  };

  return (
    <div
      className="wheel-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="wheel-modal-background-grid" />

      <section
        className={`wheel-modal-shell ${
          resultConfig && showResult
            ? resultConfig.effectClass
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-modal-title"
      >
        <div className="wheel-modal-orb wheel-modal-orb-one" />
        <div className="wheel-modal-orb wheel-modal-orb-two" />

        {effectActive &&
          result === "WIN" && (
            <div className="wheel-confetti-layer">
              {CONFETTI_ITEMS.map(
                (item) => (
                  <span
                    key={item.id}
                    className={`wheel-confetti wheel-confetti-${
                      item.id % 5
                    }`}
                    style={{
                      left: item.left,
                      animationDelay:
                        item.delay,
                      animationDuration:
                        item.duration,
                      "--confetti-rotation":
                        item.rotation,
                      width: item.size,
                      height: item.size,
                    }}
                  />
                )
              )}
            </div>
          )}

        {effectActive &&
          result === "LOSE" && (
            <div className="wheel-lose-effect-layer">
              <div className="wheel-lose-vignette" />

              {EMBER_ITEMS.map((item) => (
                <span
                  key={item.id}
                  className="wheel-dark-ember"
                  style={{
                    left: item.left,
                    animationDelay:
                      item.delay,
                    animationDuration:
                      item.duration,
                    width: item.size,
                    height: item.size,
                  }}
                />
              ))}
            </div>
          )}

        {effectActive &&
          result === "HOUSE" && (
            <div className="wheel-house-effect-layer">
              <span className="wheel-house-ray wheel-house-ray-one" />
              <span className="wheel-house-ray wheel-house-ray-two" />
              <span className="wheel-house-ray wheel-house-ray-three" />

              <div className="wheel-house-coins">
                {Array.from({
                  length: 18,
                }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      "--coin-index": index,
                    }}
                  >
                    $
                  </span>
                ))}
              </div>
            </div>
          )}

        <header className="wheel-modal-header">
          <div className="wheel-modal-heading">
            <div className="wheel-modal-logo">
              <span>🎡</span>
            </div>

            <div>
              <small>
                Kullanıcı işlemi
              </small>

              <h2 id="wheel-modal-title">
                Şans Çarkı
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="wheel-modal-close-button"
            onClick={handleClose}
            disabled={
              loading || spinning
            }
            aria-label="Pencereyi kapat"
          >
            <span />
            <span />
          </button>
        </header>

        <div className="wheel-modal-user-bar">
          <div className="wheel-modal-user-avatar">
            {String(
              user.username || "?"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="wheel-modal-user-name">
            <small>
              Seçili kullanıcı
            </small>

            <strong>
              @{user.username}
            </strong>

            <span>
              ID: {user.user_id}
            </span>
          </div>

          <div className="wheel-modal-balance">
            <small>
              Mevcut bakiye
            </small>

            <strong>
              {formattedCurrentPoints}
            </strong>

            <span>PUAN</span>
          </div>
        </div>

        <div className="wheel-modal-main">
          <div className="wheel-visual-column">
            <div
              className={`wheel-stage ${
                spinning
                  ? "wheel-stage-active"
                  : ""
              }`}
            >
              <div className="wheel-stage-aura" />

              <div className="wheel-pointer-container">
                <div className="wheel-pointer-light" />

                <div className="wheel-pointer" />
              </div>

              <div className="wheel-frame">
                <div className="wheel-frame-lights">
                  {Array.from({
                    length: 24,
                  }).map((_, index) => (
                    <span
                      key={index}
                      style={{
                        transform: `rotate(${
                          index * 15
                        }deg) translateY(-196px)`,
                      }}
                    />
                  ))}
                </div>

                <div
                  className={`wheel-disc ${
                    spinning
                      ? "wheel-disc-spinning"
                      : ""
                  }`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionDuration:
                      spinning
                        ? `${SPIN_DURATION_MS}ms`
                        : "0ms",
                  }}
                >
                  <div className="wheel-segment-lines" />

                  <div className="wheel-label wheel-label-win">
                    <span>🏆</span>
                    <strong>KAZAN</strong>
                    <small>+ PUAN</small>
                  </div>

                  <div className="wheel-label wheel-label-lose">
                    <span>💀</span>
                    <strong>KAYBET</strong>
                    <small>- PUAN</small>
                  </div>

                  <div className="wheel-label wheel-label-house">
                    <span>🏦</span>
                    <strong>KASA</strong>
                    <small>KASA ALIR</small>
                  </div>
                </div>

                <div className="wheel-center-hub">
                  <div className="wheel-center-inner">
                    {spinning ? (
                      <span className="wheel-center-star">
                        ✦
                      </span>
                    ) : (
                      <>
                        <strong>212</strong>
                        <small>BOT</small>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="wheel-ground-shadow" />
            </div>
          </div>

          <div className="wheel-control-column">
            {!session && (
              <div className="wheel-step-panel">
                <div className="wheel-step-header">
                  <span className="wheel-step-number">
                    01
                  </span>

                  <div>
                    <small>
                      İşlem miktarı
                    </small>

                    <h3>
                      Risk miktarını belirle
                    </h3>
                  </div>
                </div>

                <label className="wheel-amount-label">
                  <span>
                    Çevrilecek puan
                  </span>

                  <div className="wheel-amount-input">
                    <input
                      type="number"
                      min="1"
                      max={currentPoints}
                      step="1"
                      value={amount}
                      placeholder="Örn. 5.000"
                      disabled={loading}
                      autoFocus
                      onChange={(event) => {
                        setAmount(
                          event.target.value
                        );

                        setError("");
                      }}
                    />

                    <small>PUAN</small>
                  </div>
                </label>

                <div className="wheel-quick-amounts">
                  {[1000, 5000, 10000].map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={
                          loading ||
                          value >
                            currentPoints
                        }
                        onClick={() =>
                          setQuickAmount(
                            value
                          )
                        }
                      >
                        {value.toLocaleString(
                          "tr-TR"
                        )}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={
                      loading ||
                      currentPoints <= 0
                    }
                    onClick={() =>
                      setQuickAmount(
                        currentPoints
                      )
                    }
                  >
                    TÜMÜ
                  </button>
                </div>

                <div className="wheel-chance-grid">
                  <div className="wheel-chance-win">
                    <span>🏆</span>
                    <small>Kazan</small>
                    <strong>%33,3</strong>
                  </div>

                  <div className="wheel-chance-lose">
                    <span>💀</span>
                    <small>Kaybet</small>
                    <strong>%33,3</strong>
                  </div>

                  <div className="wheel-chance-house">
                    <span>🏦</span>
                    <small>Kasa</small>
                    <strong>%33,3</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="wheel-main-button"
                  disabled={loading}
                  onClick={prepareWheel}
                >
                  {loading ? (
                    <>
                      <span className="wheel-loading-spinner" />
                      Hazırlanıyor...
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      Çarkı Hazırla
                    </>
                  )}
                </button>
              </div>
            )}

            {session && !result && (
              <div className="wheel-step-panel wheel-ready-panel">
                <div className="wheel-step-header">
                  <span className="wheel-step-number">
                    02
                  </span>

                  <div>
                    <small>
                      Çark hazır
                    </small>

                    <h3>
                      Şansını dene
                    </h3>
                  </div>
                </div>

                <div className="wheel-ready-card">
                  <div className="wheel-ready-user">
                    <span>👤</span>

                    <div>
                      <small>
                        Kullanıcı
                      </small>

                      <strong>
                        @{user.username}
                      </strong>
                    </div>
                  </div>

                  <div className="wheel-ready-amount">
                    <small>
                      İşlem miktarı
                    </small>

                    <strong>
                      {formattedAmount}
                    </strong>

                    <span>PUAN</span>
                  </div>
                </div>

                <p className="wheel-ready-description">
                  Sonuç sunucu tarafından
                  güvenli şekilde belirlenecek.
                  Çark yaklaşık 8 saniye
                  boyunca dönecek.
                </p>

                <button
                  type="button"
                  className="wheel-spin-button"
                  disabled={
                    spinning || loading
                  }
                  onClick={spinWheel}
                >
                  <span className="wheel-spin-icon">
                    🎡
                  </span>

                  ÇARKI ÇEVİR
                </button>

                <button
                  type="button"
                  className="wheel-soft-cancel-button"
                  disabled={
                    spinning || loading
                  }
                  onClick={cancelWheel}
                >
                  İşlemi iptal et
                </button>
              </div>
            )}

            {resultConfig && (
              <div
                className={`wheel-result-panel ${
                  showResult
                    ? "wheel-result-panel-visible"
                    : ""
                } wheel-result-panel-${result.toLowerCase()}`}
              >
                {spinning ? (
                  <div className="wheel-spinning-status">
                    <div className="wheel-spinning-orbit">
                      <span />
                      <span />
                      <span />
                    </div>

                    <small>
                      Sonuç belirleniyor
                    </small>

                    <h3>
                      Çark dönüyor...
                    </h3>

                    <p>
                      Şans, son dönüşünü
                      yapıyor.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="wheel-result-symbol">
                      {resultConfig.icon}
                    </div>

                    <small className="wheel-result-eyebrow">
                      Çark sonucu
                    </small>

                    <h3>
                      {resultConfig.title}
                    </h3>

                    <strong className="wheel-result-name">
                      {resultConfig.label}
                    </strong>

                    <p>
                      {
                        resultConfig.description
                      }
                    </p>

                    <div className="wheel-result-summary">
                      <div>
                        <small>
                          Kullanıcı
                        </small>

                        <strong>
                          @{user.username}
                        </strong>
                      </div>

                      <div>
                        <small>
                          İşlem miktarı
                        </small>

                        <strong>
                          {formattedAmount}
                        </strong>

                        <span>PUAN</span>
                      </div>
                    </div>

                    <div className="wheel-result-actions">
                      <button
                        type="button"
                        className="wheel-complete-button"
                        disabled={loading}
                        onClick={
                          completeWheel
                        }
                      >
                        {loading
                          ? "Tamamlanıyor..."
                          : "✓ İşlemi Tamamla"}
                      </button>

                      <button
                        type="button"
                        className="wheel-result-cancel-button"
                        disabled={loading}
                        onClick={
                          cancelWheel
                        }
                      >
                        İptal Et
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="wheel-error-box">
                <span>!</span>

                <p>{error}</p>
              </div>
            )}

            <div className="wheel-security-box">
              <span>🔒</span>

              <p>
                Sonuç backend tarafından
                belirlenir. Puan yalnızca
                “İşlemi Tamamla” seçildiğinde
                güncellenir.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WheelModal;