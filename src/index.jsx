// === frontend/src/index.jsx ===


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import GiveawayPanel from "./GiveawayPanel.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css"; 
import BetPanel from "./BetPanel.jsx";
import AdminLogin from "./AdminLogin.jsx";
import ShopPanel from "./ShopPanel.jsx"; 


ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/giveaway" element={<GiveawayPanel />} />
        <Route path="/bet" element={<BetPanel/>} />
        <Route path="/shop" element={<ShopPanel />} />
      </Routes>
    </BrowserRouter>
  
);