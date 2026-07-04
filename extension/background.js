// Background service worker — handles auth token storage
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SET_TOKEN") {
    chrome.storage.local.set({ seevv_token: msg.token }, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "GET_TOKEN") {
    chrome.storage.local.get(["seevv_token"], (r) => sendResponse({ token: r.seevv_token || null }));
    return true;
  }
  if (msg.type === "CLEAR_TOKEN") {
    chrome.storage.local.remove(["seevv_token"], () => sendResponse({ ok: true }));
    return true;
  }
});
