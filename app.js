'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector)
];

const phone = '+48608384429';

document.documentElement.classList.add('js');
$('#year').textContent = new Date().getFullYear();

// Menu mobilne.
const toggle = $('#menu-toggle');
toggle.hidden = false;

function closeMenu() {
  $('#navigation').classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Otwórz menu');
}

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';

  $('#navigation').classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute(
    'aria-label',
    open ? 'Zamknij menu' : 'Otwórz menu'
  );
});

$$('#navigation a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    toggle.getAttribute('aria-expanded') === 'true'
  ) {
    closeMenu();
    toggle.focus();
  }
});

// Telefon: od 9 do 15 cyfr, z opcjonalnymi separatorami.
$$('input[type=tel]').forEach(input => {
  const validate = () => {
    const digits = input.value.replace(/\D/g, '');

    const valid =
      /^[+\d\s()-]+$/.test(input.value) &&
      digits.length >= 9 &&
      digits.length <= 15;

    input.setCustomValidity(
      valid
        ? ''
        : 'Podaj poprawny numer telefonu: od 9 do 15 cyfr.'
    );
  };

  input.addEventListener('input', validate);
  input.addEventListener('change', validate);
});

// Odrzucenie pól wypełnionych samymi spacjami.
$$('input[required]:not([type]), textarea[required]').forEach(input => {
  input.addEventListener('input', () => {
    input.setCustomValidity(
      input.value.trim() ? '' : 'Uzupełnij to pole.'
    );
  });
});

function validateFields(root) {
  for (const field of $$('input, select, textarea', root)) {
    if (field.disabled) continue;

    field.dispatchEvent(new Event('input'));

    if (!field.reportValidity()) {
      return false;
    }
  }

  return true;
}

function focusHeading(element) {
  element.tabIndex = -1;
  element.focus({ preventScroll: true });

  element.scrollIntoView({
    block: 'nearest',
    behavior: 'auto'
  });
}

// Wyświetlenie wiadomości nie wysyła jej do firmy.
function showResult(form, message) {
  const result = $('.result', form);

  $('.message', result).value = message;
  $('.sms', result).href =
    `sms:${phone}?body=${encodeURIComponent(message)}`;

  $('.status', result).textContent = '';
  result.hidden = false;

  focusHeading($('h4', result));
}

// Kopiowanie i pobieranie wiadomości w obu formularzach.
$$('form').forEach(form => {
  const result = $('.result', form);

  form.addEventListener('input', event => {
    if (!event.target.closest('.result')) {
      result.hidden = true;
    }
  });

  $('.copy', result).addEventListener('click', async () => {
    const text = $('.message', result);

    try {
      await navigator.clipboard.writeText(text.value);
      $('.status', result).textContent = 'Skopiowano wiadomość.';
    } catch {
      text.focus();
      text.select();

      $('.status', result).textContent =
        'Zaznaczono treść. Użyj opcji Kopiuj w swoim urządzeniu.';
    }
  });

  $('.download', result).addEventListener('click', () => {
    const blob = new Blob(
      ['\uFEFF', $('.message', result).value],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = form.id === 'driver-form'
      ? 'KLARA-zgloszenie-kierowcy.txt'
      : 'KLARA-zapytanie-transportowe.txt';

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    $('.status', result).textContent =
      'Przygotowano plik do pobrania.';
  });
});

// Konfigurator zapytania transportowego.
const transport = $('#transport-form');

transport.querySelector('button[type=submit]').disabled = false;

const date = $('[name=date]', transport);

function localToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');
}

date.min = localToday();

transport.addEventListener('submit', event => {
  event.preventDefault();

  date.min = localToday();

  if (!validateFields(transport)) {
    return;
  }

  const data = new FormData(transport);
  const get = key => String(data.get(key) || '').trim();

  const message = [
    'Zapytanie transportowe — KLARA Logistics',
    `Załadunek: ${get('from')}`,
    `Rozładunek: ${get('to')}`,
    `Termin: ${get('date')}`,
    `Częstotliwość: ${get('frequency')}`,
    `Ładunek: ${get('cargo')}`,
    `Firma / kontakt: ${get('company')}`,
    `Telefon: ${get('phone')}`,
    'Proszę o kontakt w sprawie możliwości realizacji i wyceny.'
  ].join('\n');

  showResult(transport, message);
});

// Rekrutacja w trzech krokach.
const driver = $('#driver-form');
const steps = $$('[data-step]', driver);
const labels = ['doświadczenie', 'kontakt', 'podsumowanie'];

let step = 0;

function driverMessage() {
  const get = name => {
    return $(`[name="${name}"]`, driver).value.trim();
  };

  const lines = [
    'Zgłoszenie kierowcy C+E — KLARA Logistics',
    `Imię: ${get('name')}`,
    `Telefon: ${get('phone')}`,
    `Miejscowość: ${get('city')}`,
    `Doświadczenie: ${get('experience')}`,
    `Dostępność: ${get('availability')}`,
    'Posiadam prawo jazdy C+E.'
  ];

  if (get('preferences')) {
    lines.push(`Preferencje / pytania: ${get('preferences')}`);
  }

  return lines.join('\n');
}

function renderStep(moveFocus = true) {
  steps.forEach((fieldset, index) => {
    fieldset.hidden = index !== step;
    fieldset.disabled = index !== step;
  });

  $('#previous').hidden = step === 0;
  $('#next').hidden = step === 2;
  $('#finish').hidden = step !== 2;

  $('#step-label').textContent =
    `Krok ${step + 1} z 3 — ${labels[step]}`;

  $('#step-progress').value = step + 1;
  $('.result', driver).hidden = true;

  if (step === 2) {
    $('#driver-review').textContent = driverMessage();
  }

  if (moveFocus) {
    focusHeading($('legend', steps[step]));
  }
}

$('#next').addEventListener('click', () => {
  if (validateFields(steps[step]) && step < 2) {
    step++;
    renderStep();
  }
});

$('#previous').addEventListener('click', () => {
  if (step > 0) {
    step--;
    renderStep();
  }
});

driver.addEventListener('submit', event => {
  event.preventDefault();

  if (step < 2) {
    $('#next').click();
    return;
  }

  showResult(driver, driverMessage());
});

renderStep(false);
/* ============================================
   ANIMACJE PRZY SCROLLU (Intersection Observer)
   ============================================ */

(function initReveal() {
  const items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    // Starsza przeglądarka — pokazujemy wszystko od razu
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  items.forEach(el => observer.observe(el));
})();
/* ============================================
   PRZEŁĄCZNIK JĘZYKA PL / EN
   ============================================ */

(function initLang() {
  const STORAGE_KEY = 'klara-lang';
  const html = document.documentElement;
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  function applyLang(lang) {
    html.lang = lang === 'en' ? 'en' : 'pl';

    // Zwykłe teksty (data-pl / data-en)
    document.querySelectorAll('[data-pl][data-en]').forEach(el => {
      el.textContent = el.dataset[lang];
    });

    // Placeholdery
    document.querySelectorAll('[data-pl-placeholder][data-en-placeholder]').forEach(el => {
      el.placeholder = el.dataset[lang + 'Placeholder'];
    });

    // Przycisk — stan wizualny i aria
    toggle.setAttribute('aria-pressed', String(lang === 'en'));
    toggle.setAttribute(
      'aria-label',
      lang === 'en' ? 'Zmień język na polski' : 'Change language to English'
    );

    // Zapamiętaj wybór
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* prywatne okno – ignorujemy */ }

    // Ponownie odpal animacje reveal (nowe elementy mogą się pojawić)
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
  }

  toggle.addEventListener('click', () => {
    const current = html.lang === 'en' ? 'en' : 'pl';
    applyLang(current === 'pl' ? 'en' : 'pl');
  });

  // Wczytaj zapisany język (domyślnie polski)
  let saved = 'pl';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'pl';
  } catch (e) { /* ignore */ }

  applyLang(saved);
})();
/* ============================================
   CUSTOM DATE PICKER (PL / EN)
   ============================================ */

(function initDatePicker() {
  const input = document.querySelector('[name="date"]');
  if (!input) return;

  const wrapper = input.closest('label');
  if (!wrapper) return;

  // Ukrywamy natywny input, ale zostawiamy go w DOM,
  // żeby FormData go widział i walidacja HTML działała.
  input.type = 'hidden';

  // --- Słowniki ---
  const I18N = {
    pl: {
      months: [
        'styczeń','luty','marzec','kwiecień','maj','czerwiec',
        'lipiec','sierpień','wrzesień','październik','listopad','grudzień'
      ],
      weekdays: ['Pn','Wt','Śr','Cz','Pt','So','Nd'],
      placeholder: 'Wybierz datę',
      prev: 'Poprzedni miesiąc',
      next: 'Następny miesiąc',
      format: (d, m, y) => `${d} ${m} ${y}`
    },
    en: {
      months: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      weekdays: ['Mo','Tu','We','Th','Fr','Sa','Su'],
      placeholder: 'Select a date',
      prev: 'Previous month',
      next: 'Next month',
      format: (d, m, y) => `${m} ${d}, ${y}`
    }
  };

  function currentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'pl';
  }

  // --- Budowa UI ---
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'date-input';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="date-value is-placeholder"></span>
    <svg class="date-icon" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="17" rx="2"/>
      <path d="M3 10h18M8 2.5v4M16 2.5v4"/>
    </svg>
  `;

  const popup = document.createElement('div');
  popup.className = 'date-popup';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'false');
  popup.innerHTML = `
    <div class="date-popup-head">
      <button type="button" class="date-nav" data-nav="-1">‹</button>
      <div class="date-popup-title" aria-live="polite"></div>
      <button type="button" class="date-nav" data-nav="1">›</button>
    </div>
    <div class="date-weekdays" aria-hidden="true"></div>
    <div class="date-days" role="grid"></div>
  `;

  wrapper.appendChild(trigger);
  wrapper.appendChild(popup);

  const valueEl  = trigger.querySelector('.date-value');
  const titleEl  = popup.querySelector('.date-popup-title');
  const weekEl   = popup.querySelector('.date-weekdays');
  const daysEl   = popup.querySelector('.date-days');
  const prevBtn  = popup.querySelector('[data-nav="-1"]');
  const nextBtn  = popup.querySelector('[data-nav="1"]');

  // --- Stan ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = null; // Date lub null

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function fromISO(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDisplay(d) {
    const L = I18N[currentLang()];
    return L.format(d.getDate(), L.months[d.getMonth()], d.getFullYear());
  }

  function isSameDay(a, b) {
    return a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function renderWeekdays() {
    const L = I18N[currentLang()];
    weekEl.innerHTML = L.weekdays
      .map(d => `<span>${d}</span>`)
      .join('');
  }

  function renderCalendar() {
    const L = I18N[currentLang()];
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();

    titleEl.textContent = `${L.months[m]} ${y}`;
    prevBtn.setAttribute('aria-label', L.prev);
    nextBtn.setAttribute('aria-label', L.next);

    daysEl.innerHTML = '';

    // Poniedziałek = pierwszy dzień tygodnia
    const first = new Date(y, m, 1);
    const firstWeekday = (first.getDay() + 6) % 7; // 0 = Pn
    const start = new Date(y, m, 1 - firstWeekday);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = d.getDate();

      if (d.getMonth() !== m) btn.classList.add('is-other');
      if (isSameDay(d, today)) btn.classList.add('is-today');
      if (isSameDay(d, selected)) btn.classList.add('is-selected');

      if (d < today) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => selectDate(d));
      }

      daysEl.appendChild(btn);
    }
  }

  function renderTrigger() {
    const L = I18N[currentLang()];
    if (selected) {
      valueEl.textContent = formatDisplay(selected);
      valueEl.classList.remove('is-placeholder');
    } else {
      valueEl.textContent = L.placeholder;
      valueEl.classList.add('is-placeholder');
    }
  }

  function renderAll() {
    renderWeekdays();
    renderCalendar();
    renderTrigger();
  }

  function selectDate(d) {
    selected = d;
    input.value = toISO(d);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    renderAll();
    trigger.focus();
  }

  function open() {
    if (!popup.hidden) return;
    if (selected) {
      viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
    } else {
      viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    renderAll();
    popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onOutsideClick, true);
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (popup.hidden) return;
    popup.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKeydown);
  }

  function onOutsideClick(e) {
    if (!wrapper.contains(e.target)) close();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener('click', () => {
    popup.hidden ? open() : close();
  });

  prevBtn.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  // --- Inicjalizacja ---
  // Ustaw minimalną datę (dziś) i odczytaj ewentualną wartość
  input.min = toISO(today);

  if (input.value) {
    const d = fromISO(input.value);
    if (d && d >= today) selected = d;
  }

  renderAll();

  // --- Reakcja na zmianę języka ---
  // Nasłuchujemy zmiany atrybutu lang na <html>
  const htmlEl = document.documentElement;
  let lastLang = currentLang();

  new MutationObserver(() => {
    const now = currentLang();
    if (now !== lastLang) {
      lastLang = now;
      renderAll();
    }
  }).observe(htmlEl, { attributes: true, attributeFilter: ['lang'] });
})();