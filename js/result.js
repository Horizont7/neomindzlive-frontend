const API_BASE = "http://127.0.0.1:8000"; // prod: https://neomindz-server.onrender.com

function getUserId(){
  let id = localStorage.getItem("nm_user_id");
  if(!id){
    id = "user_" + crypto.randomUUID();
    localStorage.setItem("nm_user_id", id);
  }
  return id;
}
const USER_ID = getUserId();

function api(path, opts={}){
  const headers = Object.assign({
    "Content-Type":"application/json",
    "X-User-Id": USER_ID
  }, opts.headers || {});
  return fetch(API_BASE + path, Object.assign({}, opts, {headers}));
}

function qs(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

const sessionId = qs("session_id");

const lockedBox = document.getElementById("lockedBox");
const resultBox = document.getElementById("resultBox");
const hint = document.getElementById("hint");

const subText = document.getElementById("subText");
const iqText = document.getElementById("iqText");
const percText = document.getElementById("percText");
const sidText = document.getElementById("sidText");

document.getElementById("backBtn").addEventListener("click", ()=>history.back());

document.getElementById("downloadBtn")?.addEventListener("click", ()=>{
  alert("Report download will be added after payment + certificate PDF endpoint.");
});

document.getElementById("payBtn").addEventListener("click", async ()=>{
  // Hozircha: unlock endpoint (Paddle approval bo‘lmaganda ham ishlash uchun)
  // Keyin: create-checkout -> Paddle checkout -> webhook unlock
  hint.textContent = "Unlocking…";
  const res = await api("/api/payment/unlock", {
    method:"POST",
    body: JSON.stringify({ session_id: sessionId, paid: true, paddle_txn_id: "MANUAL" })
  });
  if(!res.ok){
    hint.textContent = "Unlock error: " + await res.text();
    return;
  }
  hint.textContent = "Unlocked. Loading result…";
  await loadResult();
});

async function loadResult(){
  if(!sessionId){
    subText.textContent = "No session_id. Please finish the test first.";
    lockedBox.style.display = "none";
    resultBox.style.display = "none";
    return;
  }

  subText.textContent = "Checking your unlock status…";
  sidText.textContent = sessionId;

  const res = await api("/api/test/result?session_id=" + encodeURIComponent(sessionId));
  if(res.ok){
    const data = await res.json();
    lockedBox.style.display = "none";
    resultBox.style.display = "block";
    subText.textContent = "Unlocked result is available.";
    iqText.textContent = data.iq ?? "—";
    percText.textContent = (data.percentile ?? "—") + "%";
    hint.textContent = "";
    return;
  }

  // Locked (402) bo‘lsa — payment ko‘rsatamiz
  if(res.status === 402){
    lockedBox.style.display = "grid";
    resultBox.style.display = "none";
    subText.textContent = "Your result is locked — payment required.";
    hint.textContent = "";
    return;
  }

  subText.textContent = "Error loading result.";
  hint.textContent = await res.text();
}

loadResult();
