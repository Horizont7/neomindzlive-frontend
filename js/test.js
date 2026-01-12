// ===== CONFIG =====
const API_BASE = (window.NEO_API_BASE || "https://neomindzlive-backend.onrender.com").replace(/\/$/, "");

// Backend stage_limits bilan mos:
const STAGE_LIMITS = { adaptive: 25, classic: 40, speed: 60 };
const TOTAL_QUESTIONS = STAGE_LIMITS.adaptive + STAGE_LIMITS.classic + STAGE_LIMITS.speed; // 125

// ===== SIMPLE USER ID (UNIFIED) =====
function getUserId() {
  let id = localStorage.getItem("neo_user_id");
  if (!id) {
    id = "user_" + crypto.randomUUID();
    localStorage.setItem("neo_user_id", id);
  }
  return id;
}
const USER_ID = getUserId();

const el = (id) => document.getElementById(id);

let sessionId = null;
let currentQuestion = null;
let selectedIndex = null;
let startedAt = 0;
let timer = null;
let timeLimit = 0;

// ===== API helper =====
function api(path, opts = {}) {
  const headers = Object.assign(
    {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-User-Id": USER_ID,
    },
    opts.headers || {}
  );
  return fetch(API_BASE + path, Object.assign({}, opts, { headers }));
}

function getStageOffset(stage) {
  if (stage === "adaptive") return 0;
  if (stage === "classic") return STAGE_LIMITS.adaptive;
  if (stage === "speed") return STAGE_LIMITS.adaptive + STAGE_LIMITS.classic;
  return 0;
}

function setProgress(stage, questionIndex) {
  const done = getStageOffset(stage) + Math.max(0, (questionIndex || 1) - 1);
  const pct = Math.max(0, Math.min(100, (done / TOTAL_QUESTIONS) * 100));
  el("barFill").style.width = pct + "%";
  el("progressText").textContent = `${Math.min(done + 1, TOTAL_QUESTIONS)}/${TOTAL_QUESTIONS}`;
}

function renderQuestion(q, stage, questionIndex) {
  currentQuestion = q;
  selectedIndex = null;
  startedAt = Date.now();
  el("nextBtn").disabled = true;

  const st = (stage || q.stage || "—").toUpperCase();
  el("stageChip").textContent = st;
  el("diffChip").textContent = `Difficulty: ${q.difficulty ?? "—"}`;

  el("prompt").textContent = q.prompt || "—";

  const letters = ["A", "B", "C", "D", "E", "F"];
  const wrap = el("choices");
  wrap.innerHTML = "";

  const choices = q.choices || q.options || [];
  if (!choices.length) {
    el("hint").textContent = "No choices found for this question.";
  } else {
    el("hint").textContent = "";
  }

  choices.forEach((c, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.innerHTML = `
      <div class="badge">${letters[idx] || idx + 1}</div>
      <div class="ctext">${c}</div>
    `;
    b.addEventListener("click", () => {
      [...wrap.querySelectorAll(".choice")].forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      selectedIndex = idx;
      el("nextBtn").disabled = false;
    });
    wrap.appendChild(b);
  });

  setProgress(stage || q.stage, questionIndex || 1);

  // timer
  timeLimit = Number(q.time_limit_sec || 0);
  clearInterval(timer);

  if (timeLimit > 0) {
    let left = timeLimit;
    el("timerText").textContent = left + "s";
    timer = setInterval(() => {
      left -= 1;
      el("timerText").textContent = left + "s";
      if (left <= 0) {
        clearInterval(timer);
        submitAnswer(true); // time-out => skip/force
      }
    }, 1000);
  } else {
    el("timerText").textContent = "—";
  }
}

async function startTest() {
  el("hint").textContent = "Starting test…";

  const res = await api("/api/test/start", { method: "POST", body: "{}" });
  const txt = await res.text();

  if (!res.ok) {
    el("hint").textContent = "Start error: " + txt;
    return;
  }

  const data = JSON.parse(txt);
  sessionId = data.session_id;
  localStorage.setItem("neo_session_id", sessionId);

  renderQuestion(data.question, data.stage, data.question_index);
}

function indexToLetter(idx) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return letters[idx] || null;
}

async function submitAnswer(force = false) {
  if (!sessionId || !currentQuestion) return;

  clearInterval(timer);
  el("nextBtn").disabled = true;
  el("hint").textContent = "Submitting…";

  // ✅ backend uchun answer format:
  // - tanlansa: "A"/"B"/"C"/"D"
  // - skip/time-out bo‘lsa: null
  let answer = null;
  if (!force && selectedIndex !== null) {
    answer = indexToLetter(selectedIndex);
  }

  const payload = { session_id: sessionId, answer };

  const res = await api("/api/test/answer", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const txt = await res.text();
  if (!res.ok) {
    el("hint").textContent = "Answer error: " + txt;
    return;
  }

  const data = JSON.parse(txt);

  if (data.finished) {
    window.location.href = `./result.html?session_id=${encodeURIComponent(sessionId)}`;
    return;
  }

  renderQuestion(data.question, data.stage, data.question_index);
  el("hint").textContent = "";
}

document.getElementById("nextBtn").addEventListener("click", () => submitAnswer(false));
document.getElementById("skipBtn").addEventListener("click", () => submitAnswer(true));

startTest();
