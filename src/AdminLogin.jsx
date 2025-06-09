// frontend/src/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "./config";


function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/admin/login`, {
        username,
        password
      });

      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("streamer_id", res.data.admin_id);

      navigate("/login"); // Giriş başarılıysa Kick login ekranına yönlendir
    } catch (err) {
      alert("Giriş başarısız: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl mb-6">🔐 Admin Girişi</h1>
      <input
        type="text"
        placeholder="Kullanıcı Adı"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-3 px-4 py-2 rounded bg-gray-800 border border-gray-600"
      />
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-3 px-4 py-2 rounded bg-gray-800 border border-gray-600"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded shadow"
      >
        Giriş Yap
      </button>
    </div>
  );
}

export default AdminLogin;
