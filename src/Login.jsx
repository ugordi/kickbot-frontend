import { useEffect } from "react";
import axios from "axios";

const CLIENT_ID = "01JW4J0KESK96WVH0WEE2FGFCY";
const CLIENT_SECRET = "15f602dbebb70fea4ee7f007e26e13d0f77d60ebdef8ed8b65a261912679e4b3";
const REDIRECT_URI = "http://localhost:3000/login";

function generateCodeVerifier() {
  const array = new Uint32Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ("0" + dec.toString(16)).substr(-2)).join("");
}

function base64urlencode(str) {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

function Login() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const code_verifier = localStorage.getItem("verifier");
    const savedState = localStorage.getItem("state");

    if (code && state && code_verifier) {
      if (state !== savedState) {
        console.error("❌ State uyuşmazlığı. Beklenen:", savedState, "Gelen:", state);
        alert("Giriş başarısız (state uyuşmazlığı). Lütfen yeniden giriş yapın.");
        localStorage.removeItem("verifier");
        localStorage.removeItem("state");
        window.location.href = "/login";
        return;
      }

      console.log("💡 Code geldi mi?", code);
      console.log("💡 Verifier var mı?", code_verifier);
      console.log("🔐 GÖNDERİLEN VERİ:", {
        code,
        code_verifier,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });

      axios.post("http://localhost:5000/auth/callback", {
        code,
        code_verifier,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      })
        .then(res => {
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("streamer_id", res.data.user_id);
          window.history.replaceState({}, "", "/");
          window.location.href = "/";
        })
        .catch(err => {
          console.error("❌ Login Hatası:", err.response?.data || err.message);
        });
    }
  }, []);

  const loginKick = async () => {
    // önce önceki verifier ve state temizleniyor
    localStorage.removeItem("verifier");
    localStorage.removeItem("state");

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = Math.random().toString(36).substring(2);

    localStorage.setItem("verifier", codeVerifier);
    localStorage.setItem("state", state);

    const url = `https://id.kick.com/oauth/authorize?response_type=code` +
      `&client_id=${CLIENT_ID}` +
      `&redirect_uri=${REDIRECT_URI}` +
      `&scope=user:read channel:read chat:write events:subscribe` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    window.location.href = url;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Kick ile Giriş</h1>
      <button
        onClick={loginKick}
        className="bg-green-600 text-white px-6 py-3 rounded shadow"
      >
        Giriş Yap
      </button>
    </div>
  );
}

export default Login;
