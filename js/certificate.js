function pad2(n){ return String(n).padStart(2,"0"); }
function formatDate(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function randId(){
  // short but “official looking” id
  const a = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(a).map(x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function interpretation(score){
  const s = Number(score);
  if (s >= 130) return "Very Superior (Top range)";
  if (s >= 120) return "Superior";
  if (s >= 110) return "High Average";
  if (s >= 90)  return "Average";
  if (s >= 80)  return "Low Average";
  return "Below Average";
}

// ---- Data source (localStorage) ----
// You can set these from your test flow:
// localStorage.setItem("nm_fullname","John Doe")
// localStorage.setItem("nm_score","118")
// localStorage.setItem("nm_session","S-2026-0001")

const fullName = localStorage.getItem("nm_fullname") || "John Doe";
const score = localStorage.getItem("nm_score") || "118";
const session = localStorage.getItem("nm_session") || ("S-" + randId().slice(0,8));
const testType = localStorage.getItem("nm_test_type") || "Adaptive";
const duration = localStorage.getItem("nm_duration") || "15–20 minutes";

let certId = localStorage.getItem("nm_cert_id");
if(!certId){
  certId = "NM-" + randId().slice(0,12);
  localStorage.setItem("nm_cert_id", certId);
}
let issue = localStorage.getItem("nm_issue_date");
if(!issue){
  issue = formatDate(new Date());
  localStorage.setItem("nm_issue_date", issue);
}

// Verification URL (backendda verify sahifa qilasiz)
const verifyUrl = `https://neomindzlive.com/verify/${encodeURIComponent(certId)}`;

document.getElementById("fullName").textContent = fullName;
document.getElementById("iqScore").textContent = score;
document.getElementById("scoreNote").textContent = "Interpretation: " + interpretation(score);
document.getElementById("certId").textContent = certId;
document.getElementById("issueDate").textContent = issue;
document.getElementById("testType").textContent = testType;
document.getElementById("sessionId").textContent = session;
document.getElementById("duration").textContent = duration;

const a = document.getElementById("verifyLink");
a.textContent = verifyUrl;
a.href = verifyUrl;

// If PNG signature exists, hide SVG. If not, SVG stays.
const sigImg = document.getElementById("signatureImg");
sigImg.addEventListener("load", () => {
  document.getElementById("signatureSvg").style.display = "none";
});

// If PNG seal exists, hide SVG. If not, SVG stays.
const sealImg = document.getElementById("sealImg");
sealImg.addEventListener("load", () => {
  document.getElementById("sealSvg").style.display = "none";
});

document.getElementById("btnPrint").onclick = () => window.print();

document.getElementById("btnReset").onclick = () => {
  ["nm_fullname","nm_score","nm_session","nm_test_type","nm_duration","nm_cert_id","nm_issue_date"]
    .forEach(k=>localStorage.removeItem(k));
  location.reload();
};
