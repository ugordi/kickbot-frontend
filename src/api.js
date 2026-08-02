// === frontend/src/api.js ===

import axios from "axios";

const API_BASE = "https://212sbot.com/api";

function getAdminToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token")
  );
}

function getAuthConfig() {
  const token = getAdminToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

// =========================
// KULLANICI PUANLARI
// =========================

export const getPoints = (streamer_id) =>
  axios.get(
    `${API_BASE}/points/${streamer_id}`
  );

export const updatePoints = (
  streamer_id,
  user_id,
  points
) =>
  axios.post(`${API_BASE}/points/update`, {
    streamer_id,
    user_id,
    points,
  });

export const resetAllPoints = (
  streamer_id
) =>
  axios.post(`${API_BASE}/points/reset`, {
    streamer_id,
  });

export const drawWinner = (
  streamer_id
) =>
  axios.post(`${API_BASE}/draw`, {
    streamer_id,
  });

// =========================
// YAYINCI AYARLARI
// =========================

export const getSettings = (
  streamer_id
) =>
  axios.get(
    `${API_BASE}/settings/${streamer_id}`
  );

export const updateSettings = (
  streamer_id,
  settings
) =>
  axios.post(
    `${API_BASE}/settings/update`,
    {
      streamer_id,
      ...settings,
    }
  );

// =========================
// VERGİ
// =========================

export const applyTax = (
  streamer_id,
  percentage
) =>
  axios.post(`${API_BASE}/points/tax`, {
    streamer_id,
    percentage,
  });

// =========================
// ÇARK
// =========================

// Yeni çark oturumu oluşturur.
// Henüz puanı değiştirmez.
export const createWheel = (
  streamer_id,
  user_id,
  amount
) =>
  axios.post(
    `${API_BASE}/wheel/create`,
    {
      streamer_id,
      user_id,
      amount,
    },
    getAuthConfig()
  );

// Çark sonucunu backend'de belirler.
// WIN, LOSE veya HOUSE döner.
export const spinWheel = (wheel_id) =>
  axios.post(
    `${API_BASE}/wheel/spin`,
    {
      wheel_id,
    },
    getAuthConfig()
  );

// Çark sonucunu kullanıcının puanına uygular.
export const completeWheel = (
  wheel_id
) =>
  axios.post(
    `${API_BASE}/wheel/complete`,
    {
      wheel_id,
    },
    getAuthConfig()
  );

// Çarkı iptal eder.
// Kullanıcı puanı değişmez.
export const cancelWheel = (wheel_id) =>
  axios.post(
    `${API_BASE}/wheel/cancel`,
    {
      wheel_id,
    },
    getAuthConfig()
  );

// Çark geçmişini getirir.
export const getWheelHistory = (
  streamer_id
) =>
  axios.get(
    `${API_BASE}/wheel/history/${streamer_id}`,
    getAuthConfig()
  );