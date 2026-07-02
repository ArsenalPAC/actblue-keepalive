// Popup: the icon dropdown. Primary control surface: status, on/off switch, the
// keep-alive duration slider, and Check now. Advanced holds the ping cadence and
// URL. Reads live status from the background's storage writes; persists settings
// to local storage (nothing syncs). The background re-arms on every change.

const DEFAULTS = {
  enabled: true,
  durationHours: 3,
  intervalMinutes: 5,
  keepaliveUrl: "https://fundraising.app.actblue.com/",
};

// Slider ticks. hours: null means Unlimited. Index is the slider position.
const DURATION_TICKS = [
  { label: "30 minutes", hours: 0.5 },
  { label: "1 hour", hours: 1 },
  { label: "2 hours", hours: 2 },
  { label: "3 hours", hours: 3 },
  { label: "4 hours", hours: 4 },
  { label: "6 hours", hours: 6 },
  { label: "8 hours", hours: 8 },
  { label: "12 hours", hours: 12 },
  { label: "Unlimited", hours: null },
];

const STATE_LABELS = {
  alive: "Session alive",
  ended: "Session ended",
  paused: "Keepalive paused",
  offline: "ActBlue unreachable",
  disabled: "Keepalive off",
  unknown: "No check yet",
};

const $ = (id) => document.getElementById(id);

function indexForHours(hours) {
  const i = DURATION_TICKS.findIndex((t) => t.hours === hours);
  return i === -1 ? 3 : i;
}

function relTime(ts) {
  if (!ts) return "-";
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 60) return secs <= 5 ? "just now" : `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} hr ago`;
}

function renderStatus(status) {
  const state = (status && status.state) || "unknown";
  $("dot").className = `dot ${state}`;
  $("state").textContent = STATE_LABELS[state] || STATE_LABELS.unknown;
  $("message").textContent = (status && status.message) || "";
  $("lastCheck").textContent = relTime(status && status.lastCheck);
}

function renderSettings(settings) {
  $("enabled").checked = settings.enabled;
  const idx = indexForHours(settings.durationHours);
  $("duration").value = String(idx);
  $("durationValue").textContent = DURATION_TICKS[idx].label;
  $("intervalMinutes").value = settings.intervalMinutes;
  $("keepaliveUrl").value = settings.keepaliveUrl;
}

async function getSettings() {
  return chrome.storage.local.get(DEFAULTS);
}

function flashSaved() {
  const el = $("saved");
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1300);
}

function normalizeUrl(raw) {
  const fallback = DEFAULTS.keepaliveUrl;
  try {
    const u = new URL((raw || "").trim());
    const onActBlue = u.hostname === "actblue.com" || u.hostname.endsWith(".actblue.com");
    if (!onActBlue || u.protocol !== "https:") return fallback;
    return u.toString();
  } catch (_) {
    return fallback;
  }
}

// Show a transient state while the background re-arms and checks; the live
// status listener below replaces it with the real result.
function showChecking() {
  $("state").textContent = "Checking...";
}

async function load() {
  renderSettings(await getSettings());
  renderStatus(await chrome.runtime.sendMessage({ type: "get-status" }));
}

// Live status: the background writes status to local storage; reflect it without
// guessing at timing.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.status) renderStatus(changes.status.newValue);
});

// On/off switch: persist immediately; background re-arms on the storage change.
$("enabled").addEventListener("change", async () => {
  showChecking();
  await chrome.storage.local.set({ enabled: $("enabled").checked });
});

// Duration slider: live label on drag, persist on release.
$("duration").addEventListener("input", () => {
  $("durationValue").textContent = DURATION_TICKS[Number($("duration").value)].label;
});
$("duration").addEventListener("change", async () => {
  showChecking();
  const tick = DURATION_TICKS[Number($("duration").value)];
  await chrome.storage.local.set({ durationHours: tick.hours });
  flashSaved();
});

// Advanced settings save.
$("save").addEventListener("click", async () => {
  showChecking();
  const intervalMinutes = Math.max(1, Math.min(60, Number($("intervalMinutes").value) || 5));
  const keepaliveUrl = normalizeUrl($("keepaliveUrl").value);
  $("intervalMinutes").value = intervalMinutes;
  $("keepaliveUrl").value = keepaliveUrl;
  await chrome.storage.local.set({ intervalMinutes, keepaliveUrl });
  flashSaved();
});

// Check now also extends the keep-alive window (background re-arms).
$("checkNow").addEventListener("click", async () => {
  showChecking();
  renderStatus(await chrome.runtime.sendMessage({ type: "check-now" }));
});

$("aboutLink").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("about.html") });
});

load();
