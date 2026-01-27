const $ = (id) => document.getElementById(id);

const consoleEl = $("console");
const statusText = $("statusText");
const chipBackend = $("chipBackend");

const EMAIL = "you@example.com"; // <-- change this

function log(line) {
  const t = new Date().toLocaleTimeString();
  consoleEl.textContent = `[${t}] ${line}\n` + consoleEl.textContent;
}

function setStatus(text) {
  statusText.textContent = text;
}

$("year").textContent = new Date().getFullYear();
$("emailLink").textContent = EMAIL;
$("emailLink").href = `mailto:${EMAIL}`;

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    setStatus("Email copied ✅");
    log("Copied email to clipboard.");
  } catch {
    setStatus("Copy failed (browser blocked) ⚠️");
    log("Clipboard copy failed.");
  }
}

$("btnCopyEmail").addEventListener("click", copyEmail);
$("copySmall").addEventListener("click", copyEmail);

// --- Catchy animated button #3: magnetic feel (JS) ---
const magBtn = document.querySelector(".btnMag");
magBtn.addEventListener("mousemove", (e) => {
  const r = magBtn.getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width / 2)) / 18;
  const dy = (e.clientY - (r.top + r.height / 2)) / 18;
  magBtn.style.transform = `translate(${dx}px, ${dy}px)`;
});
magBtn.addEventListener("mouseleave", () => {
  magBtn.style.transform = "";
});

// --- AI Demo button (placeholder now; connect backend later) ---
async function runAiDemo() {
  setStatus("Running AI demo…");
  log("AI demo started (placeholder).");

  // Later we will connect a Render backend:
  // const res = await fetch("https://YOUR-BACKEND.onrender.com/run");
  // const data = await res.json();
  // log("AI response received.");
  // consoleEl.textContent = JSON.stringify(data, null, 2);

const BACKEND = "https://YOUR-BACKEND.onrender.com";

async function runDubDemo() {
  const res = await fetch(`${BACKEND}/api/dub`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrl: "https://example.com/video.mp4",
      targetLanguage: "es"
    })

  const data = await res.json();
  document.getElementById("console").textContent = JSON.stringify(data, null, 2);
}

$("btnRunAi").addEventListener("click", runAiDemo);
$("miniRunAi").addEventListener("click", runAiDemo);

// Small delight: keyboard shortcut
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    setStatus("Tip: Run AI demo or copy email ✨");
    log("Pressed Ctrl/Cmd+K.");
  }
});
