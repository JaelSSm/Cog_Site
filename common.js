// Handles the HU / EN language toggle and persists the choice.

(function () {
  'use strict';

  var STORAGE_KEY = 'ce.lang';
  var VALID = ['hu', 'en'];

  function setLang(lang) {
    if (VALID.indexOf(lang) === -1) return;
    document.documentElement.lang = lang;
    var buttons = document.querySelectorAll('.lang-toggle button');
    buttons.forEach(function (b) {
      var active = b.dataset.lang === lang;
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
      b.classList.toggle('active', active);
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
  }

  function init() {
    // Wire up buttons
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });
    // Restore preference
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID.indexOf(saved) !== -1) setLang(saved);
    } catch (e) { /* private mode */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();