const state = {
  accessToken: null,
  refreshToken: null,
  apiKey: null,
  baseUrl: "https://developer.atomberg-iot.com",
  fans: [],
  demoMode: false,
};

const els = {
  apiKey: document.getElementById("apiKey"),
  refreshToken: document.getElementById("refreshToken"),
  baseUrl: document.getElementById("baseUrl"),
  fetchBtn: document.getElementById("fetchBtn"),
  clearBtn: document.getElementById("clearBtn"),
  demoBtn: document.getElementById("demoBtn"),
  fansStatus: document.getElementById("fansStatus"),
  fansContainer: document.getElementById("fansContainer"),
  fanCardTemplate: document.getElementById("fanCardTemplate"),
};

const storageKey = "breezeSyncCreds";

function loadSavedCreds() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.apiKey = parsed.apiKey || "";
    state.refreshToken = parsed.refreshToken || "";
    state.baseUrl = parsed.baseUrl || state.baseUrl;
    els.apiKey.value = state.apiKey;
    els.refreshToken.value = state.refreshToken;
    els.baseUrl.value = state.baseUrl;
  } catch (e) {
    console.error("Failed to parse saved creds", e);
  }
}

function saveCreds() {
  const payload = {
    apiKey: els.apiKey.value.trim(),
    refreshToken: els.refreshToken.value.trim(),
    baseUrl: els.baseUrl.value.trim() || state.baseUrl,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
  Object.assign(state, payload);
}

function clearCreds() {
  localStorage.removeItem(storageKey);
  state.apiKey = "";
  state.refreshToken = "";
  state.accessToken = null;
  els.apiKey.value = "";
  els.refreshToken.value = "";
  els.fansStatus.textContent = "Cleared. Enter credentials to continue.";
}

function setStatus(msg) {
  els.fansStatus.textContent = msg;
}

async function refreshAccessToken() {
  // Implementation matches typical OAuth2 refresh style.
  // Adjust endpoint/fields based on Atomberg docs if they differ.
  const url = `${state.baseUrl.replace(/\/$/, "")}/oauth/token`;
  const body = {
    grant_type: "refresh_token",
    refresh_token: state.refreshToken,
    api_key: state.apiKey,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) throw new Error("No access_token in response");
  state.accessToken = data.access_token;
  return state.accessToken;
}

async function fetchFans() {
  if (state.demoMode) {
    state.fans = getDemoFans();
    renderFans();
    setStatus("Demo mode — showing sample fans.");
    return;
  }

  setStatus("Refreshing token…");
  const token = await refreshAccessToken();
  setStatus("Fetching fans…");
  const url = `${state.baseUrl.replace(/\/$/, "")}/api/v1/fans`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch fans failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  state.fans = Array.isArray(data?.data) ? data.data : data.fans || data;
  renderFans();
  setStatus(`Loaded ${state.fans.length} fan(s).`);
}

async function sendFanCommand(fanId, payload, messageEl) {
  if (state.demoMode) {
    messageEl.textContent = "Demo mode: command accepted (not sent).";
    return;
  }
  const token = state.accessToken || (await refreshAccessToken());
  const url = `${state.baseUrl.replace(/\/$/, "")}/api/v1/fans/${fanId}/command`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Command failed (${res.status}): ${text}`);
  }
  messageEl.textContent = "Applied successfully.";
}

function getDemoFans() {
  return [
    {
      id: "demo-living",
      name: "Living Room",
      location: "Ground floor",
      online: true,
      speed: 3,
      mode: "breeze",
      power: true,
    },
    {
      id: "demo-bedroom",
      name: "Bedroom",
      location: "Upstairs",
      online: true,
      speed: 2,
      mode: "sleep",
      power: true,
    },
    {
      id: "demo-office",
      name: "Office",
      location: "Work zone",
      online: false,
      speed: 0,
      mode: "normal",
      power: false,
    },
  ];
}

function renderFans() {
  els.fansContainer.innerHTML = "";
  if (!state.fans?.length) {
    setStatus("No fans found. Confirm credentials and permissions.");
    return;
  }

  state.fans.forEach((fan) => {
    const clone = els.fanCardTemplate.content.firstElementChild.cloneNode(true);
    clone.querySelector(".fan-name").textContent = fan.name || "Unnamed fan";
    clone.querySelector(".fan-location").textContent = fan.location || "–";
    clone.querySelector(".fan-id").textContent = fan.id || fan.device_id || "unknown";
    clone.querySelector(".fan-speed").value = fan.speed ?? 0;
    clone.querySelector(".control-value").textContent = fan.speed ?? 0;
    clone.querySelector(".fan-mode").value = fan.mode || "normal";
    const statusEl = clone.querySelector(".fan-status");
    statusEl.textContent = fan.online ? "Online" : "Offline";
    statusEl.className = `eyebrow fan-status ${fan.online ? "status-online" : "status-offline"}`;
    const powerInput = clone.querySelector(".fan-power");
    powerInput.checked = !!fan.power;

    const messageEl = clone.querySelector(".fan-message");
    const speedInput = clone.querySelector(".fan-speed");
    speedInput.addEventListener("input", (e) => {
      clone.querySelector(".control-value").textContent = e.target.value;
    });

    clone.querySelector(".refresh-fan").addEventListener("click", async () => {
      messageEl.textContent = "Refreshing fan data…";
      try {
        await fetchFans();
        messageEl.textContent = "Refreshed.";
      } catch (err) {
        messageEl.textContent = err.message;
      }
    });

    clone.querySelector(".apply-fan").addEventListener("click", async () => {
      const payload = {
        speed: Number(speedInput.value),
        mode: clone.querySelector(".fan-mode").value,
        power: powerInput.checked,
      };
      messageEl.textContent = "Sending command…";
      try {
        await sendFanCommand(fan.id || fan.device_id, payload, messageEl);
      } catch (err) {
        console.error(err);
        messageEl.textContent = err.message;
      }
    });

    els.fansContainer.appendChild(clone);
  });
}

function enableDemo() {
  state.demoMode = true;
  state.fans = getDemoFans();
  renderFans();
  setStatus("Demo mode — sample data loaded.");
}

function disableDemo() {
  state.demoMode = false;
}

function wireEvents() {
  els.fetchBtn.addEventListener("click", async () => {
    disableDemo();
    saveCreds();
    try {
      setStatus("Preparing…");
      await fetchFans();
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  });

  els.clearBtn.addEventListener("click", () => {
    clearCreds();
    disableDemo();
    els.fansContainer.innerHTML = "";
  });

  els.demoBtn.addEventListener("click", () => {
    enableDemo();
  });
}

function init() {
  loadSavedCreds();
  wireEvents();
}

init();

