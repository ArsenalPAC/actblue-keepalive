// ActBlue Session Keepalive. Background service worker.
//
// Keeps an active ActBlue session warm for a chosen duration. While the
// keepalive window is open, a timer fires a credentialed GET at ActBlue often
// enough to beat the idle timeout; the browser attaches the existing session
// cookie automatically, which re-stamps the session's sliding expiry. When the
// duration elapses the keepalive pauses and the session is allowed to idle out
// on its own. Set the duration to Unlimited to keep it warm for as long as the
// browser runs. We never read or store the cookie itself; we only observe
// whether a request came back authenticated.

const ALARM_NAME = "actblue-keepalive";

const DEFAULTS = {
  enabled: true,
  // How long to keep the session warm. null means Unlimited (no auto-pause).
  durationHours: 3,
  // Ping cadence in minutes (advanced). Must be short enough to beat the idle
  // timeout. MV3 alarms enforce a 1-minute floor in production.
  intervalMinutes: 5,
  keepaliveUrl: "https://secure.actblue.com/my-dashboards",
};

// ---- settings + runtime state (all local; nothing syncs) -------------------

async function getSettings() {
  const s = await chrome.storage.local.get(DEFAULTS);
  s.intervalMinutes = Math.max(1, Number(s.intervalMinutes) || DEFAULTS.intervalMinutes);
  if (s.durationHours !== null) {
    const n = Number(s.durationHours);
    s.durationHours = n > 0 ? n : DEFAULTS.durationHours;
  }
  return s;
}

async function getStatus() {
  const { status } = await chrome.storage.local.get("status");
  return status || { state: "unknown", lastCheck: null, message: "No check yet." };
}

async function setStatus(next) {
  await chrome.storage.local.set({ status: next });
  await paintBadge(next.state);
}

// armedAt marks when the current keepalive window started.
async function getArmedAt() {
  const { armedAt } = await chrome.storage.local.get("armedAt");
  return armedAt || null;
}

async function arm() {
  await chrome.storage.local.set({ armedAt: Date.now() });
}

function formatDuration(hours) {
  if (hours === null) return "Unlimited";
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

// ---- badge (neutral palette; no alarm-red) ---------------------------------

async function paintBadge(state) {
  const map = {
    alive: { text: "", color: "#2e7d32" }, // calm green
    ended: { text: "!", color: "#b26a00" }, // muted amber
    paused: { text: "", color: "#9e9e9e" }, // neutral grey: window done
    offline: { text: "", color: "#757575" },
    disabled: { text: "", color: "#9e9e9e" },
    unknown: { text: "", color: "#9e9e9e" },
  };
  const b = map[state] || map.unknown;
  try {
    await chrome.action.setBadgeBackgroundColor({ color: b.color });
    await chrome.action.setBadgeText({ text: b.text });
  } catch (_) {
    // action API can be momentarily unavailable during worker spin-up; ignore.
  }
}

// ---- the keepalive ping -----------------------------------------------------

async function runKeepalive() {
  const settings = await getSettings();

  if (!settings.enabled) {
    await setStatus({ state: "disabled", lastCheck: Date.now(), message: "Keepalive is off." });
    return;
  }

  // Enforce the keepalive window unless the duration is Unlimited.
  if (settings.durationHours !== null) {
    let armedAt = await getArmedAt();
    if (!armedAt) {
      await arm();
      armedAt = Date.now();
    }
    const windowMs = settings.durationHours * 3600 * 1000;
    if (Date.now() - armedAt >= windowMs) {
      // Window done: stop pinging until a re-arm, and keep the prior lastCheck
      // so the timestamp reflects the last real ping, not this no-op.
      await chrome.alarms.clear(ALARM_NAME);
      const prev = await getStatus();
      await setStatus({
        state: "paused",
        lastCheck: prev.lastCheck,
        message: `Kept your session warm for ${formatDuration(settings.durationHours)}. Use "Check now" to extend.`,
      });
      return;
    }
  }

  const prev = await getStatus();
  let next;

  try {
    const res = await fetch(settings.keepaliveUrl, {
      method: "GET",
      credentials: "include",
      redirect: "manual",
      cache: "no-store",
    });

    if (res.type === "opaqueredirect" || res.status === 0) {
      next = { state: "ended", lastCheck: Date.now(), message: "Session ended. Sign in to ActBlue to resume." };
    } else if (res.status === 401 || res.status === 403) {
      next = { state: "ended", lastCheck: Date.now(), message: "Session ended. Sign in to ActBlue to resume." };
    } else if (res.ok) {
      next = { state: "alive", lastCheck: Date.now(), message: "Session alive." };
    } else {
      next = { state: "offline", lastCheck: Date.now(), message: `Unexpected response (${res.status}).` };
    }
  } catch (_) {
    next = { state: "offline", lastCheck: Date.now(), message: "ActBlue is unreachable right now." };
  }

  await setStatus(next);

  // One quiet notification only on the alive -> ended transition.
  if (next.state === "ended" && prev.state !== "ended") {
    try {
      await chrome.notifications.create("actblue-session-ended", {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "ActBlue session ended",
        message: "Sign in to ActBlue to resume. Keepalive will pick it back up automatically.",
        priority: 0,
      });
    } catch (_) {
      // notifications can be unavailable; status + badge still reflect it.
    }
  }
}

// ---- alarm wiring -----------------------------------------------------------

async function rescheduleAlarm() {
  const { enabled, intervalMinutes } = await getSettings();
  await chrome.alarms.clear(ALARM_NAME);
  if (enabled) {
    // No delayInMinutes: the immediate runKeepalive() covers "now", and the
    // first periodic tick lands at +intervalMinutes (avoids the sub-1-minute
    // alarm warning and a duplicate early ping).
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: intervalMinutes });
  } else {
    await setStatus({ state: "disabled", lastCheck: Date.now(), message: "Keepalive is off." });
  }
}

// Start (or restart) the keepalive window and run a check now. Concurrent calls
// coalesce, with a trailing re-run if another trigger arrives mid-flight, so the
// install-time double trigger and rapid settings changes do not double-fetch.
let armRunInFlight = null;
let armRunPending = false;

async function armAndRunOnce() {
  const { enabled } = await getSettings();
  if (!enabled) {
    await rescheduleAlarm(); // clears the alarm and sets the disabled status
    return getStatus();
  }
  await arm();
  await rescheduleAlarm();
  await runKeepalive();
  return getStatus();
}

function armAndRun() {
  if (armRunInFlight) {
    armRunPending = true;
    return armRunInFlight;
  }
  armRunInFlight = (async () => {
    let result = await armAndRunOnce();
    while (armRunPending) {
      armRunPending = false;
      result = await armAndRunOnce();
    }
    return result;
  })().finally(() => {
    armRunInFlight = null;
  });
  return armRunInFlight;
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(Object.keys(DEFAULTS));
  await chrome.storage.local.set({ ...DEFAULTS, ...current });
  await armAndRun();
});

chrome.runtime.onStartup.addListener(armAndRun);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) runKeepalive();
});

// React to settings changes from the popup immediately, and treat a settings
// change as the start of a fresh keepalive window. (status/armedAt are not
// watched, so this never re-triggers itself.)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.enabled || changes.durationHours || changes.intervalMinutes || changes.keepaliveUrl) {
    armAndRun();
  }
});

// Popup actions: "Check now" also re-arms the window ("extend").
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "check-now") {
    armAndRun()
      .then(sendResponse)
      .catch(() => getStatus().then(sendResponse));
    return true;
  }
  if (msg && msg.type === "get-status") {
    getStatus().then(sendResponse).catch(() => sendResponse(null));
    return true;
  }
});
