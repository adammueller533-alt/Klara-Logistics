'use strict';

/* ============================================
   PRZEŁĄCZNIK JĘZYKA PL / EN — wspólny dla bloga
   ============================================ */

(function initLang() {
  const STORAGE_KEY = 'klara-lang';
  const html = document.documentElement;
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  function applyLang(lang) {
    html.lang = lang === 'en' ? 'en' : 'pl';

    // Zwykłe teksty
    document.querySelectorAll('[data-pl][data-en]').forEach(el => {
      el.textContent = el.dataset[lang];
    });

    // Placeholdery
    document.querySelectorAll('[data-pl-placeholder][data-en-placeholder]').forEach(el => {
      el.placeholder = el.dataset[lang + 'Placeholder'];
    });

    // Przycisk
    toggle.setAttribute('aria-pressed', String(lang === 'en'));
    toggle.setAttribute(
      'aria-label',
      lang === 'en' ? 'Zmień język na polski' : 'Change language to English'
    );

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* prywatne okno */ }
  }

  toggle.addEventListener('click', () => {
    const current = html.lang === 'en' ? 'en' : 'pl';
    applyLang(current === 'pl' ? 'en' : 'pl');
  });

  // Wczytaj zapisany język
  let saved = 'pl';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'pl';
  } catch (e) { /* ignore */ }

  applyLang(saved);
})();