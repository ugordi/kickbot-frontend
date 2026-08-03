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
const STATUS_POLL_INTERVAL_MS = 2000;

/*
 * Çarkın fiziksel olarak durabileceği üç sonuç.
 */
const RESULT_CONFIG = {
  WIN: {
    label: "WIN",
    title: "Çark WIN Geldi",
    icon: "🏆",
  },

  LOSE: {
    label: "LOSE",
    title: "Çark LOSE Geldi",
    icon: "💀",
  },

  HOUSE: {
    label: "KASA",
    title: "Kasa Kazandı",
    icon: "🏦",
  },
};

/*
 * Kullanıcının seçtiği taraf.
 */
const CHOICE_CONFIG = {
  WIN: {
    label: "WIN",
    icon: "🏆",
  },

  LOSE: {
    label: "LOSE",
    icon: "💀",
  },
};

/*
 * Çarkın segment merkezleri.
 *
 * Pointer yukarıda olduğu için sonucu pointer'a getiren
 * nihai dönüş açıları bunlardır.
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
    duration: `${
      2.2 + (index % 7) * 0.18
    }s`,
    rotation: `${
      (index * 53) % 360
    }deg`,
    size: `${
      5 + (index % 5) * 2
    }px`,
  })
);

const EMBER_ITEMS = Array.from(
  { length: 30 },
  (_, index) => ({
    id: index,
    left: `${(index * 41) % 100}%`,
    delay: `${(index % 10) * 0.09}s`,
    duration: `${
      1.7 + (index % 6) * 0.2
    }s`,
    size: `${
      4 + (index % 4) * 2
    }px`,
  })
);

function WheelModal({
  open,
  user,
  streamerId,
  onClose,
  onCompleted,

  createWheelRequest,
  getWheelStatusRequest,
  spinWheelRequest,
  completeWheelRequest,
  cancelWheelRequest,
}) {
  const spinTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const pollingInProgressRef =
    useRef(false);

  const [amount, setAmount] =
    useState("");

  const [session, setSession] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [rotation, setRotation] =
    useState(0);

  const [spinning, setSpinning] =
    useState(false);

  const [showResult, setShowResult] =
    useState(false);

  const [effectActive, setEffectActive] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [polling, setPolling] =
    useState(false);

  const [error, setError] =
    useState("");

  const currentPoints = Number(
    user?.points || 0
  );

  const numericAmount = Number(
    amount || 0
  );

  const formattedCurrentPoints =
    useMemo(
      () =>
        currentPoints.toLocaleString(
          "tr-TR"
        ),
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

  const userChoice =
    session?.user_choice || null;

  const choiceConfig = userChoice
    ? CHOICE_CONFIG[userChoice]
    : null;

  /*
   * Kullanıcı yalnızca:
   *
   * WIN seçti + WIN geldi
   * LOSE seçti + LOSE geldi
   *
   * durumlarında kazanır.
   *
   * HOUSE her durumda kayıptır.
   */
  const userWon = Boolean(
    result &&
      userChoice &&
      result !== "HOUSE" &&
      result === userChoice
  );

  const resultDescription =
    useMemo(() => {
      if (!result || !userChoice) {
        return "";
      }

      if (userWon) {
        return `${userChoice} tarafını doğru seçti. Girilen puan kullanıcının hesabına eklenecek.`;
      }

      if (result === "HOUSE") {
        return "Kasa kazandı. Girilen puan kullanıcının hesabından düşülecek.";
      }

      return `${userChoice} tarafı seçildi fakat çark ${result} geldi. Girilen puan kullanıcının hesabından düşülecek.`;
    }, [
      result,
      userChoice,
      userWon,
    ]);

  /*
   * Efekt raw çark sonucuna göre değil,
   * gerçek kullanıcı sonucuna göre belirleniyor.
   */
  const shellEffectClass =
    showResult && result
      ? userWon
        ? "wheel-effect-win"
        : result === "HOUSE"
          ? "wheel-effect-house"
          : "wheel-effect-lose"
      : "";

  const clearTimers =
    useCallback(() => {
      if (spinTimerRef.current) {
        window.clearTimeout(
          spinTimerRef.current
        );

        spinTimerRef.current = null;
      }

      if (resultTimerRef.current) {
        window.clearTimeout(
          resultTimerRef.current
        );

        resultTimerRef.current = null;
      }
    }, []);

  const resetModal =
    useCallback(() => {
      clearTimers();

      pollingInProgressRef.current =
        false;

      setAmount("");
      setSession(null);
      setResult(null);

      setRotation(0);
      setSpinning(false);
      setShowResult(false);
      setEffectActive(false);

      setLoading(false);
      setPolling(false);
      setError("");
    }, [clearTimers]);

  /*
   * Modal her yeni kullanıcı için açıldığında temizlenir.
   */
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

  /*
   * Modal açıkken arka sayfanın kaymasını engeller.
   */
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

  /*
   * Component kapanırken açık timerları temizler.
   */
  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers]
  );

  /*
   * Kullanıcının chatten yaptığı seçimi kontrol eder.
   *
   * Yalnızca WAITING_CHOICE durumunda çalışır.
   * Backend READY döndürdüğünde polling otomatik durur.
   */
  useEffect(() => {
    if (
      !open ||
      !session?.id ||
      session.status !==
        "WAITING_CHOICE" ||
      typeof getWheelStatusRequest !==
        "function"
    ) {
      return undefined;
    }

    let cancelled = false;

    const checkWheelStatus =
      async () => {
        if (
          pollingInProgressRef.current
        ) {
          return;
        }

        pollingInProgressRef.current =
          true;

        setPolling(true);

        try {
          const response =
            await getWheelStatusRequest(
              session.id
            );

          if (cancelled) {
            return;
          }

          const updatedWheel =
            response.data?.wheel;

          if (!updatedWheel) {
            return;
          }

          setSession(
            (currentSession) => ({
              ...currentSession,
              ...updatedWheel,
            })
          );

          if (
            updatedWheel.status ===
            "READY"
          ) {
            setError("");
          }

          if (
            updatedWheel.status ===
            "CANCELLED"
          ) {
            setError(
              "Bu çark işlemi iptal edildi."
            );
          }

          if (
            updatedWheel.status ===
              "SPUN" &&
            updatedWheel.result
          ) {
            setResult(
              updatedWheel.result
            );
          }
        } catch (requestError) {
          if (!cancelled) {
            console.error(
              "Çark durumu kontrol edilemedi:",
              requestError
            );
          }
        } finally {
          pollingInProgressRef.current =
            false;

          if (!cancelled) {
            setPolling(false);
          }
        }
      };

    checkWheelStatus();

    const intervalId =
      window.setInterval(
        checkWheelStatus,
        STATUS_POLL_INTERVAL_MS
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );

      pollingInProgressRef.current =
        false;

      setPolling(false);
    };
  }, [
    open,
    session?.id,
    session?.status,
    getWheelStatusRequest,
  ]);

  const validateAmount = () => {
    const parsedAmount =
      Number(amount);

    if (
      !Number.isSafeInteger(
        parsedAmount
      ) ||
      parsedAmount <= 0
    ) {
      setError(
        "Çevrilecek puan sıfırdan büyük bir tam sayı olmalı."
      );

      return null;
    }

    if (
      parsedAmount >
      currentPoints
    ) {
      setError(
        "Kullanıcının yeterli puanı bulunmuyor."
      );

      return null;
    }

    return parsedAmount;
  };

  /*
   * Çarkı oluşturur.
   *
   * Backend WAITING_CHOICE döndürür.
   * Bundan sonra seçilen kullanıcı chatten !win veya !lose yazmalıdır.
   */
  const prepareWheel = async () => {
    const validAmount =
      validateAmount();

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

      const createdWheel =
        response.data?.wheel;

      if (!createdWheel?.id) {
        throw new Error(
          "Sunucu geçerli bir çark oturumu döndürmedi."
        );
      }

      setSession(createdWheel);
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.error ||
          requestError.message ||
          "Çark hazırlanamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * READY durumundaki çarkı döndürür.
   *
   * Backend sonucu hemen döndürür fakat görsel animasyon
   * 8 saniye boyunca devam eder.
   */
  const spinWheel = async () => {
    if (
      !session?.id ||
      session.status !== "READY" ||
      !session.user_choice ||
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
        await spinWheelRequest(
          session.id
        );

      const updatedWheel =
        response.data?.wheel;

      const backendResult =
        updatedWheel?.result;

      if (
        !RESULT_CONFIG[
          backendResult
        ]
      ) {
        throw new Error(
          "Sunucu geçersiz bir çark sonucu döndürdü."
        );
      }

      setSession(
        (currentSession) => ({
          ...currentSession,
          ...updatedWheel,
          status: "SPUN",
        })
      );

      setResult(backendResult);

      const baseRotation =
        RESULT_TARGET_ROTATION[
          backendResult
        ];

      /*
       * 10 tam tur + hedef segment açısı.
       *
       * Ufak sapma yalnızca görsel doğallık sağlar ve
       * pointerın segment dışına çıkmaması için sınırlıdır.
       */
      const safeOffset =
        Math.floor(
          Math.random() * 31
        ) - 15;

      const totalRotation =
        rotation +
        360 * 10 +
        baseRotation +
        safeOffset;

      window.requestAnimationFrame(
        () => {
          setRotation(
            totalRotation
          );
        }
      );

      spinTimerRef.current =
        window.setTimeout(() => {
          setSpinning(false);
          setShowResult(true);

          resultTimerRef.current =
            window.setTimeout(
              () => {
                setEffectActive(true);
              },
              120
            );
        }, SPIN_DURATION_MS);
    } catch (requestError) {
      setSpinning(false);

      setError(
        requestError.response?.data
          ?.error ||
          requestError.message ||
          "Çark çevrilemedi."
      );
    }
  };

  /*
   * Sonucu puan hesabına uygular.
   */
  const completeWheel =
    async () => {
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

        const completedWheel =
          response.data?.wheel;

        if (!completedWheel) {
          throw new Error(
            "Sunucu tamamlanan çark bilgisini döndürmedi."
          );
        }

        setSession(
          (currentSession) => ({
            ...currentSession,
            ...completedWheel,
            status: "COMPLETED",
          })
        );

        onCompleted(
          completedWheel
        );
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.error ||
            requestError.message ||
            "Çark işlemi tamamlanamadı."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * Açık çarkı iptal eder.
   *
   * Çark dönerken iptal edilmez.
   */
  const cancelWheel =
    useCallback(async () => {
      if (spinning) {
        setError(
          "Çark dönerken işlem iptal edilemez."
        );

        return false;
      }

      try {
        setLoading(true);
        setError("");

        if (
          session?.id &&
          session.status !==
            "COMPLETED" &&
          session.status !==
            "CANCELLED"
        ) {
          await cancelWheelRequest(
            session.id
          );
        }

        resetModal();
        onClose();

        return true;
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.error ||
            requestError.message ||
            "Çark işlemi iptal edilemedi."
        );

        return false;
      } finally {
        setLoading(false);
      }
    }, [
      spinning,
      session,
      cancelWheelRequest,
      resetModal,
      onClose,
    ]);

  /*
   * X, Escape veya dış alana tıklama.
   *
   * Açık işlem varsa önce backend tarafında iptal edilir.
   */
  const handleClose =
    useCallback(async () => {
      if (loading || spinning) {
        return;
      }

      if (
        session?.id &&
        session.status !==
          "COMPLETED" &&
        session.status !==
          "CANCELLED"
      ) {
        await cancelWheel();
        return;
      }

      resetModal();
      onClose();
    }, [
      loading,
      spinning,
      session,
      cancelWheel,
      resetModal,
      onClose,
    ]);

  /*
   * Escape ile kapatma.
   */
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
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

  const setQuickAmount = (
    value
  ) => {
    setAmount(String(value));
    setError("");
  };

  const isWaitingChoice =
    session?.status ===
    "WAITING_CHOICE";

  const isReady =
    session?.status === "READY";

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
        className={`wheel-modal-shell ${shellEffectClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-modal-title"
      >
        <div className="wheel-modal-orb wheel-modal-orb-one" />
        <div className="wheel-modal-orb wheel-modal-orb-two" />

        {/* Kullanıcı gerçekten kazandıysa konfeti */}
        {effectActive &&
          userWon && (
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

        {/* Yanlış tahminde kırmızı kaybetme efekti */}
        {effectActive &&
          !userWon &&
          result &&
          result !== "HOUSE" && (
            <div className="wheel-lose-effect-layer">
              <div className="wheel-lose-vignette" />

              {EMBER_ITEMS.map(
                (item) => (
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
                )
              )}
            </div>
          )}

        {/* HOUSE gelirse kasa efekti */}
        {effectActive &&
          result === "HOUSE" && (
            <div className="wheel-house-effect-layer">
              <span className="wheel-house-ray wheel-house-ray-one" />
              <span className="wheel-house-ray wheel-house-ray-two" />
              <span className="wheel-house-ray wheel-house-ray-three" />

              <div className="wheel-house-coins">
                {Array.from({
                  length: 18,
                }).map(
                  (_, index) => (
                    <span
                      key={index}
                      style={{
                        "--coin-index":
                          index,
                      }}
                    >
                      $
                    </span>
                  )
                )}
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
          {/* ÇARK GÖRSELİ */}
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
                  }).map(
                    (_, index) => (
                      <span
                        key={index}
                        style={{
                          transform:
                            `rotate(${
                              index *
                              15
                            }deg) ` +
                            "translateY(-196px)",
                        }}
                      />
                    )
                  )}
                </div>

                <div
                  className={`wheel-disc ${
                    spinning
                      ? "wheel-disc-spinning"
                      : ""
                  }`}
                  style={{
                    transform:
                      `rotate(${rotation}deg)`,

                    transitionDuration:
                      spinning
                        ? `${SPIN_DURATION_MS}ms`
                        : "0ms",
                  }}
                >
                  <div className="wheel-segment-lines" />

                  <div className="wheel-label wheel-label-win">
                    <span>🏆</span>
                    <strong>WIN</strong>
                    <small>KAZAN</small>
                  </div>

                  <div className="wheel-label wheel-label-lose">
                    <span>💀</span>
                    <strong>LOSE</strong>
                    <small>KAYBET</small>
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

          {/* SAĞ KONTROL PANELİ */}
          <div className="wheel-control-column">
            {/* 1. PUAN SEÇİMİ */}
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
                      onChange={(
                        event
                      ) => {
                        setAmount(
                          event.target
                            .value
                        );

                        setError("");
                      }}
                    />

                    <small>PUAN</small>
                  </div>
                </label>

                <div className="wheel-quick-amounts">
                  {[
                    1000,
                    5000,
                    10000,
                  ].map((value) => (
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
                  ))}

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
                    <small>WIN</small>
                    <strong>%33,3</strong>
                  </div>

                  <div className="wheel-chance-lose">
                    <span>💀</span>
                    <small>LOSE</small>
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

            {/* 2. CHAT SEÇİMİ BEKLENİYOR */}
            {session &&
              !result &&
              isWaitingChoice && (
                <div className="wheel-step-panel wheel-ready-panel">
                  <div className="wheel-step-header">
                    <span className="wheel-step-number">
                      02
                    </span>

                    <div>
                      <small>
                        Chat seçimi
                      </small>

                      <h3>
                        Kullanıcı bekleniyor
                      </h3>
                    </div>
                  </div>

                  <div className="wheel-ready-card">
                    <div className="wheel-ready-user">
                      <span>👤</span>

                      <div>
                        <small>
                          Seçim yapacak
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

                      <span>
                        PUAN
                      </span>
                    </div>
                  </div>

                  <div className="wheel-spinning-status">
                    <div className="wheel-spinning-orbit">
                      <span />
                      <span />
                      <span />
                    </div>

                    <small>
                      Chat dinleniyor
                    </small>

                    <h3>
                      Seçim bekleniyor
                    </h3>

                    <p>
                      Yalnızca{" "}
                      <strong>
                        @{user.username}
                      </strong>{" "}
                      seçim yapabilir.
                    </p>
                  </div>

                  <div className="wheel-chance-grid">
                    <div className="wheel-chance-win">
                      <span>🏆</span>
                      <small>
                        Chate yaz
                      </small>
                      <strong>
                        !win
                      </strong>
                    </div>

                    <div className="wheel-chance-lose">
                      <span>💀</span>
                      <small>
                        Chate yaz
                      </small>
                      <strong>
                        !lose
                      </strong>
                    </div>

                    <div className="wheel-chance-house">
                      <span>🔄</span>
                      <small>
                        Kontrol
                      </small>
                      <strong>
                        {polling
                          ? "Bakılıyor"
                          : "Aktif"}
                      </strong>
                    </div>
                  </div>

                  <p className="wheel-ready-description">
                    Kullanıcı Kick
                    chatine yalnızca{" "}
                    <strong>
                      !win
                    </strong>{" "}
                    veya{" "}
                    <strong>
                      !lose
                    </strong>{" "}
                    yazmalıdır. Puan
                    eklememelidir.
                  </p>

                  <button
                    type="button"
                    className="wheel-soft-cancel-button"
                    disabled={loading}
                    onClick={cancelWheel}
                  >
                    İşlemi iptal et
                  </button>
                </div>
              )}

            {/* 3. SEÇİM GELDİ, ÇARK HAZIR */}
            {session &&
              !result &&
              isReady && (
                <div className="wheel-step-panel wheel-ready-panel">
                  <div className="wheel-step-header">
                    <span className="wheel-step-number">
                      03
                    </span>

                    <div>
                      <small>
                        Seçim tamamlandı
                      </small>

                      <h3>
                        Çark çevrilebilir
                      </h3>
                    </div>
                  </div>

                  <div className="wheel-ready-card">
                    <div className="wheel-ready-user">
                      <span>
                        {choiceConfig?.icon ||
                          "🎯"}
                      </span>

                      <div>
                        <small>
                          Kullanıcının seçimi
                        </small>

                        <strong>
                          @{user.username}
                        </strong>
                      </div>
                    </div>

                    <div className="wheel-ready-amount">
                      <small>
                        Seçilen taraf
                      </small>

                      <strong>
                        {choiceConfig?.label}
                      </strong>
                    </div>
                  </div>

                  <div className="wheel-result-summary">
                    <div>
                      <small>
                        Risk miktarı
                      </small>

                      <strong>
                        {formattedAmount}
                      </strong>

                      <span>PUAN</span>
                    </div>

                    <div>
                      <small>
                        Durum
                      </small>

                      <strong>
                        SEÇİM ALINDI
                      </strong>
                    </div>
                  </div>

                  <p className="wheel-ready-description">
                    Kullanıcı{" "}
                    <strong>
                      {choiceConfig?.label}
                    </strong>{" "}
                    tarafını seçti. Aynı
                    taraf gelirse kazanacak;
                    farklı sonuç veya KASA
                    gelirse kaybedecek.
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

            {/* 4. ÇARK SONUCU */}
            {resultConfig && (
              <div
                className={`wheel-result-panel ${
                  showResult
                    ? "wheel-result-panel-visible"
                    : ""
                } wheel-result-panel-${
                  userWon
                    ? "win"
                    : result ===
                        "HOUSE"
                      ? "house"
                      : "lose"
                }`}
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
                      Çark yaklaşık 8
                      saniye boyunca
                      dönecek.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="wheel-result-symbol">
                      {userWon
                        ? "🎉"
                        : resultConfig.icon}
                    </div>

                    <small className="wheel-result-eyebrow">
                      Çark sonucu
                    </small>

                    <h3>
                      {resultConfig.title}
                    </h3>

                    <strong className="wheel-result-name">
                      {result}
                    </strong>

                    <p>
                      {resultDescription}
                    </p>

                    <div className="wheel-result-summary">
                      <div>
                        <small>
                          Kullanıcının seçimi
                        </small>

                        <strong>
                          {userChoice}
                        </strong>
                      </div>

                      <div>
                        <small>
                          Çarkın sonucu
                        </small>

                        <strong>
                          {result}
                        </strong>
                      </div>

                      <div>
                        <small>
                          İşlem miktarı
                        </small>

                        <strong>
                          {formattedAmount}
                        </strong>

                        <span>
                          PUAN
                        </span>
                      </div>

                      <div>
                        <small>
                          Nihai durum
                        </small>

                        <strong>
                          {userWon
                            ? "KAZANDI"
                            : "KAYBETTİ"}
                        </strong>
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
                Kullanıcının seçimi chat
                üzerinden alınır. Çark
                sonucu backend tarafından
                belirlenir. Puan yalnızca
                “İşlemi Tamamla”
                seçildiğinde güncellenir.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WheelModal;