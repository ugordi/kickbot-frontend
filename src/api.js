// === frontend/src/api.js ===

import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Kullanıcı puanları
export const getPoints = (streamer_id) =>
  axios.get(`${API_BASE}/points/${streamer_id}`);

export const updatePoints = (streamer_id, user_id, points) =>
  axios.post(`${API_BASE}/points/update`, {
    streamer_id,
    user_id,
    points,
  });

export const resetAllPoints = (streamer_id) =>
  axios.post(`${API_BASE}/points/reset`, { streamer_id });

export const drawWinner = (streamer_id) =>
  axios.post(`${API_BASE}/draw`, { streamer_id });

// Yayıncı ayarları
export const getSettings = (streamer_id) =>
  axios.get(`${API_BASE}/settings/${streamer_id}`);

export const updateSettings = (streamer_id, settings) =>
  axios.post(`${API_BASE}/settings/update`, {
    streamer_id,
    ...settings,
  });
