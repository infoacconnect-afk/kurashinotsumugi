// Temporary, same-tab handoff. No answers in URLs, analytics or network requests.
(function () {
  'use strict';
  const key = 'tsumugi.diagnosis.v1';
  const ttl = 30 * 60 * 1000;
  function clear() { try { sessionStorage.removeItem(key); } catch (_) {} }
  function read() {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      if (raw.length > 24000) { clear(); return null; }
      const value = JSON.parse(raw);
      if (value.version !== 1 || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 4000 ||
          !Number.isFinite(value.createdAt) || Date.now() - value.createdAt < 0 || Date.now() - value.createdAt >= ttl) {
        clear(); return null;
      }
      return value;
    } catch (_) { clear(); return null; }
  }
  function save(text) {
    clear();
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) return false;
    try {
      sessionStorage.setItem(key, JSON.stringify({ version: 1, createdAt: Date.now(), text }));
      return !!read();
    } catch (_) { return false; }
  }
  window.tsumugiDiagnosisTransfer = { read, save, clear };
})();
