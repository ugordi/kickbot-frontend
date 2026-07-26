import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./config";
import "./App.css";

const CLIENT_ID = "01JW4J0KESK96WVH0WEE2FGFCY";
const REDIRECT_URI = "https://212sbot.com/login";

function generateCodeVerifier() {
  const array = new Uint32Array(32);

  window.crypto.getRandomValues(array);

  return Array.from(
    array,
    (dec) => ("0" + dec.toString(16)).substr(-2)
  ).join("");
}

function base64urlencode(buffer) {
  return btoa(
    String.fromCharCode(
      ...new Uint8Array(buffer)
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(
  codeVerifier
) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  const digest =
    await window.crypto.subtle.digest(
      "SHA-256",
      data
    );

  return base64urlencode(digest);
}

function Login() {
  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const url = new URL(
      window.location.href
    );

    const code =
      url.searchParams.get("code");

    const state =
      url.searchParams.get("state");

    const codeVerifier =
      localStorage.getItem("verifier");

    const savedState =
      localStorage.getItem("state");

    if (
      code &&
      state &&
      codeVerifier
    ) {
      if (state !== savedState) {
        console.error(
          "State uyuşmazlığı.",
          {
            expected: savedState,
            received: state,
          }
        );

        setMessage(
          "Giriş doğrulanamadı. Lütfen tekrar deneyin."
        );

        localStorage.removeItem(
          "verifier"
        );

        localStorage.removeItem(
          "state"
        );

        window.history.replaceState(
          {},
          "",
          "/login"
        );

        return;
      }

      setIsLoading(true);
      setMessage(
        "Kick hesabınız doğrulanıyor..."
      );

      axios
        .post(
          `${BACKEND_URL.replace(
            /\/api\/?$/,
            ""
          )}/auth/callback`,
          {
            code,
            code_verifier:
              codeVerifier,
            redirect_uri:
              REDIRECT_URI,
          }
        )
        .then((response) => {
          localStorage.setItem(
            "access_token",
            response.data.access_token
          );

          localStorage.setItem(
            "streamer_id",
            response.data.user_id
          );

          localStorage.removeItem(
            "verifier"
          );

          localStorage.removeItem(
            "state"
          );

          window.history.replaceState(
            {},
            "",
            "/"
          );

          window.location.href = "/";
        })
        .catch((error) => {
          console.error(
            "Login hatası:",
            error.response?.data ||
              error.message
          );

          setIsLoading(false);

          setMessage(
            error.response?.data?.error ||
              "Giriş sırasında bir hata oluştu."
          );
        });
    }
  }, []);

  const loginKick = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      localStorage.removeItem(
        "verifier"
      );

      localStorage.removeItem(
        "state"
      );

      const codeVerifier =
        generateCodeVerifier();

      const codeChallenge =
        await generateCodeChallenge(
          codeVerifier
        );

      const state =
        Math.random()
          .toString(36)
          .substring(2) +
        Date.now().toString(36);

      localStorage.setItem(
        "verifier",
        codeVerifier
      );

      localStorage.setItem(
        "state",
        state
      );

      const authorizationUrl =
        "https://id.kick.com/oauth/authorize" +
        "?response_type=code" +
        `&client_id=${encodeURIComponent(
          CLIENT_ID
        )}` +
        `&redirect_uri=${encodeURIComponent(
          REDIRECT_URI
        )}` +
        `&scope=${encodeURIComponent(
          "user:read channel:read chat:write events:subscribe"
        )}` +
        `&state=${encodeURIComponent(
          state
        )}` +
        `&code_challenge=${encodeURIComponent(
          codeChallenge
        )}` +
        "&code_challenge_method=S256";

      window.location.href =
        authorizationUrl;
    } catch (error) {
      console.error(
        "Kick yönlendirme hatası:",
        error
      );

      setIsLoading(false);

      setMessage(
        "Kick giriş bağlantısı oluşturulamadı."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-glow login-glow-one" />
      <div className="login-background-glow login-glow-two" />

      <main className="login-card">
        <div className="login-badge">
          <span className="login-badge-dot" />

          Kick Chatbot Yönetim Sistemi
        </div>

        <div className="login-brand">
          <div className="login-brand-name">
            212S
          </div>

          <div className="login-brand-cross">
            ×
          </div>

          <div className="login-brand-name">
            UGORDİ
          </div>
        </div>

        <h1>
          Kick Chatbot Paneli
        </h1>

        <p className="login-description">
          Yayın puanlarını, çekilişleri,
          bahisleri ve dükkan sistemini
          tek panel üzerinden yönetin.
        </p>

        <div className="login-features">
          <div className="login-feature">
            <span>💎</span>

            <div>
              <strong>
                Puan Sistemi
              </strong>

              <small>
                İzleyici puanlarını
                yönetin
              </small>
            </div>
          </div>

          <div className="login-feature">
            <span>🎁</span>

            <div>
              <strong>
                Çekiliş ve Bet
              </strong>

              <small>
                Etkileşimi artırın
              </small>
            </div>
          </div>

          <div className="login-feature">
            <span>🛒</span>

            <div>
              <strong>
                Chat Dükkanı
              </strong>

              <small>
                Özel ödüller sunun
              </small>
            </div>
          </div>
        </div>

        {message && (
          <div className="login-message">
            {message}
          </div>
        )}

        <button
          type="button"
          className="login-kick-button"
          onClick={loginKick}
          disabled={isLoading}
        >
          <span className="login-kick-icon">
            K
          </span>

          <span className="login-kick-content">
            <strong>
              {isLoading
                ? "Kick'e Yönlendiriliyor..."
                : "Kick ile Giriş Yap"}
            </strong>

            <small>
              Yayıncı hesabınızla devam edin
            </small>
          </span>

          <span className="login-arrow">
            →
          </span>
        </button>

        <div className="login-security">
          <span>🔒</span>

          Güvenli OAuth bağlantısı
        </div>

        <div className="login-partners">
          <span>212S</span>
          <span className="login-partner-separator">
            ×
          </span>
          <span>UGORDİ</span>
        </div>
      </main>

      <footer className="login-footer">
        <p>
          212S × UGORDİ Kick Chatbot Paneli
        </p>

        <a
          href="https://kick.com/ugordi"
          target="_blank"
          rel="noopener noreferrer"
        >
          kick.com/ugordi
        </a>
      </footer>
    </div>
  );
}

export default Login;