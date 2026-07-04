const API_BASE = "https://seevv.onrender.com/api";

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["seevv_token"], (r) => resolve(r.seevv_token || null));
  });
}

async function init() {
  // Try to prefill from content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.__seevvJobData || null,
      });
      const data = result?.[0]?.result;
      if (data?.title)   document.getElementById("jobTitle").value = data.title;
      if (data?.company) document.getElementById("company").value  = data.company;
    } catch { /* content script not injected on this page */ }
  }
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  const jobTitle   = document.getElementById("jobTitle").value.trim();
  const company    = document.getElementById("company").value.trim();
  const statusEl   = document.getElementById("status");
  const btn        = document.getElementById("saveBtn");

  if (!jobTitle || !company) {
    statusEl.className = "status err";
    statusEl.textContent = "Please fill in both fields.";
    return;
  }

  const token = await getToken();
  if (!token) {
    statusEl.className = "status err";
    statusEl.innerHTML = 'Not signed in. <a href="https://seevv.io/login" target="_blank">Sign in to Seevv →</a>';
    return;
  }

  btn.disabled = true;
  statusEl.textContent = "";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ job_title: jobTitle, company_name: company, job_url: tab?.url, status: "saved" }),
    });
    if (!res.ok) throw new Error("Save failed");
    statusEl.className = "status ok";
    statusEl.textContent = "Saved to your tracker!";
    setTimeout(() => window.close(), 1500);
  } catch {
    statusEl.className = "status err";
    statusEl.textContent = "Failed to save. Try again.";
    btn.disabled = false;
  }
});

init();
