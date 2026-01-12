// js/api.js
const API_BASE = "https://neomindzlive-backend.onrender.com"; 
// agar sende boshqa domen bo'lsa: Swaggerdagi domenni aynan qo'yasan

function getUserId() {
  let id = localStorage.getItem("nm_user_id");
  if (!id) {
    id = "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
    localStorage.setItem("nm_user_id", id);
  }
  return id;
}

async function apiFetch(path, { method = "GET", body = null, headers = {} } = {}) {
  const url = API_BASE + path;

  const finalHeaders = {
    "Accept": "application/json",
    "X-User-Id": getUserId(),        // ✅ TEMP AUTH shu bilan ishlaydi
    ...headers,
  };

  const opts = { method, headers: finalHeaders };

  if (body !== null) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  // Render "sleep" bo'lsa 1-chi so'rov sekin bo'lishi mumkin -> retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const msg = data?.detail ? JSON.stringify(data.detail) : (data ? JSON.stringify(data) : res.statusText);
        throw new Error(msg);
      }
      return data;
    } catch (e) {
      if (attempt === 1) throw e;
      await new Promise(r => setTimeout(r, 1200));
    }
  }
}

// ===== API endpoints wrapper =====
window.NM_API = {
  health: () => apiFetch("/api/health"),

  access: () => apiFetch("/api/test/access"),
  start: () => apiFetch("/api/test/start", { method: "POST", body: {} }),
  answer: (session_id, answer) => apiFetch("/api/test/answer", { method: "POST", body: { session_id, answer } }),

  status: () => apiFetch("/api/test/status"),
  result: (session_id) => apiFetch(`/api/test/result?session_id=${encodeURIComponent(session_id)}`),

  // payment unlock (keyinchalik Paddle token bilan)
  unlock: (unlock_token) => apiFetch("/api/payment/unlock", { method: "POST", body: { unlock_token } }),
};
