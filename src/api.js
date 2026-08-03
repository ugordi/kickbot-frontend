// === frontend/src/api.js ===

import axios from "axios";

const API_BASE = "https://212sbot.com/api";

/*
 * Ortak Axios istemcisi.
 *
 * Timeout sayesinde sunucu cevap vermezse istek sonsuza kadar beklemez.
 */
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// KULLANICI PUANLARI
// =========================

/**
 * Yayıncıya ait kullanıcıların puan listesini getirir.
 */
export const getPoints = (streamer_id) =>
  api.get(`/points/${streamer_id}`);

/**
 * Belirli bir kullanıcının puanını günceller.
 */
export const updatePoints = (
  streamer_id,
  user_id,
  points
) =>
  api.post("/points/update", {
    streamer_id,
    user_id,
    points,
  });

/**
 * Yayıncıya ait bütün kullanıcıların puanlarını sıfırlar.
 */
export const resetAllPoints = (
  streamer_id
) =>
  api.post("/points/reset", {
    streamer_id,
  });

/**
 * Yayıncı için kazanan kullanıcı seçer.
 */
export const drawWinner = (
  streamer_id
) =>
  api.post("/draw", {
    streamer_id,
  });

// =========================
// YAYINCI AYARLARI
// =========================

/**
 * Yayıncı puan ayarlarını getirir.
 */
export const getSettings = (
  streamer_id
) =>
  api.get(`/settings/${streamer_id}`);

/**
 * Yayıncı puan ayarlarını günceller.
 */
export const updateSettings = (
  streamer_id,
  settings
) =>
  api.post("/settings/update", {
    streamer_id,
    ...settings,
  });

// =========================
// VERGİ
// =========================

/**
 * Kullanıcı puanlarına yüzdelik vergi uygular.
 */
export const applyTax = (
  streamer_id,
  percentage
) =>
  api.post("/points/tax", {
    streamer_id,
    percentage,
  });

// =========================
// ÇARK
// =========================

/**
 * Yeni çark işlemi oluşturur.
 *
 * Oluşturulduktan sonra durum:
 *
 * WAITING_CHOICE
 *
 * Seçilen kullanıcı chatte !win veya !lose yazmalıdır.
 * Bu aşamada henüz puan değiştirilmez.
 */
export const createWheel = (
  streamer_id,
  user_id,
  amount
) =>
  api.post("/wheel/create", {
    streamer_id,
    user_id,
    amount,
  });

/**
 * Çarkın en güncel durumunu getirir.
 *
 * Modal bu isteği yaklaşık 2 saniyede bir çağırır.
 *
 * WAITING_CHOICE:
 * Kullanıcı henüz seçim yapmadı.
 *
 * READY:
 * Kullanıcı !win veya !lose seçimini yaptı.
 *
 * SPUN:
 * Çark çevrildi ve sonuç belirlendi.
 */
export const getWheelStatus = (
  wheel_id
) =>
  api.get(`/wheel/${wheel_id}`);

/**
 * Çarkı çevirir.
 *
 * Yalnızca status READY olduğunda çalışır.
 * Sonucu backend güvenli şekilde belirler:
 *
 * WIN
 * LOSE
 * HOUSE
 */
export const spinWheel = (
  wheel_id
) =>
  api.post("/wheel/spin", {
    wheel_id,
  });

/**
 * Çark sonucunu kullanıcının puanına uygular.
 *
 * Kullanıcının seçimi sonuçla aynıysa puan kazanır.
 * Farklıysa veya HOUSE geldiyse puan kaybeder.
 */
export const completeWheel = (
  wheel_id
) =>
  api.post("/wheel/complete", {
    wheel_id,
  });

/**
 * Açık çark işlemini iptal eder.
 *
 * WAITING_CHOICE, READY veya SPUN durumlarında iptal edilebilir.
 * Puan değişmez.
 */
export const cancelWheel = (
  wheel_id
) =>
  api.post("/wheel/cancel", {
    wheel_id,
  });

/**
 * Yayıncıya ait son 100 çark işlemini getirir.
 */
export const getWheelHistory = (
  streamer_id
) =>
  api.get(
    `/wheel/history/${streamer_id}`
  );

export default api;