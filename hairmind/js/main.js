/* Friseur HairMind – kleines Vanilla-JS ohne Abhängigkeiten.
   Ohne JavaScript bleibt die Seite vollständig lesbar. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  /* ------------------------------------------------------------------
     Öffnungszeiten (Ortszeit Korschenbroich)
     Schlüssel: 0 = Sonntag … 6 = Samstag. Werte in Minuten ab 0:00 Uhr.
     ------------------------------------------------------------------ */
  var HOURS = {
    2: [9 * 60, 18 * 60],
    3: [9 * 60, 18 * 60],
    4: [9 * 60, 18 * 60],
    5: [9 * 60, 18 * 60],
    6: [9 * 60, 14 * 60]
  };

  /* Zusätzliche Schließtage (Feiertage, Urlaub), Format 'JJJJ-MM-TT'.
     Beispiel: ['2026-12-24', '2026-12-26'] */
  var CLOSED_DATES = [];

  var DAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var TIME_ZONE = 'Europe/Berlin';
  var PHONE = '02161\u00a05640891';

  function berlinNow() {
    var parts = {};
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (p) {
      parts[p.type] = p.value;
    });
    var y = Number(parts.year);
    var m = Number(parts.month);
    var d = Number(parts.day);
    return {
      day: new Date(Date.UTC(y, m - 1, d)),
      minutes: Number(parts.hour) * 60 + Number(parts.minute)
    };
  }

  function isoDate(utcDay) {
    return utcDay.toISOString().slice(0, 10);
  }

  function addDays(utcDay, n) {
    return new Date(utcDay.getTime() + n * 86400000);
  }

  function hoursFor(utcDay) {
    if (CLOSED_DATES.indexOf(isoDate(utcDay)) !== -1) return null;
    return HOURS[utcDay.getUTCDay()] || null;
  }

  function formatTime(minutes) {
    var m = minutes % 60;
    return Math.floor(minutes / 60) + ':' + (m < 10 ? '0' : '') + m;
  }

  function openingStatus() {
    var now = berlinNow();
    var today = hoursFor(now.day);

    if (today && now.minutes >= today[0] && now.minutes < today[1]) {
      return { open: true, state: 'Jetzt geöffnet', rest: ', bis ' + formatTime(today[1]) };
    }

    for (var i = 0; i < 60; i++) {
      var day = addDays(now.day, i);
      var h = hoursFor(day);
      if (!h || (i === 0 && now.minutes >= h[0])) continue;

      var when = DAY_SHORT[day.getUTCDay()];
      if (i === 0) when = 'heute';
      if (i >= 7) when += ' ' + day.getUTCDate() + '.' + (day.getUTCMonth() + 1) + '.';
      return { open: false, state: 'Geschlossen', rest: ', öffnet ' + when + ' ' + formatTime(h[0]) };
    }
    return { open: false, state: 'Geschlossen', rest: '' };
  }

  var statusEl = document.querySelector('[data-status]');

  function renderStatus() {
    var s = openingStatus();
    if (statusEl) {
      statusEl.innerHTML = '';
      var state = document.createElement('span');
      state.className = 'status__state';
      state.textContent = s.state;
      statusEl.appendChild(state);
      statusEl.appendChild(document.createTextNode(s.rest));
      statusEl.setAttribute('data-open', s.open ? 'true' : 'false');
    }
  }

  function markToday() {
    var table = document.querySelector('[data-hours]');
    if (!table) return;
    var weekday = String(berlinNow().day.getUTCDay());
    Array.prototype.forEach.call(table.querySelectorAll('tr[data-day]'), function (row) {
      var isToday = row.getAttribute('data-day') === weekday;
      row.classList.toggle('is-today', isToday);
      var tag = row.querySelector('.today-tag');
      if (isToday && !tag) {
        tag = document.createElement('span');
        tag.className = 'today-tag';
        tag.textContent = 'heute';
        row.querySelector('th').appendChild(tag);
      } else if (!isToday && tag) {
        tag.remove();
      }
    });
  }

  renderStatus();
  markToday();
  window.setInterval(function () {
    renderStatus();
    markToday();
  }, 60000);

  /* ------------------------------------------------------------------
     Menü auf kleinen Bildschirmen
     ------------------------------------------------------------------ */
  var nav = document.querySelector('.site-nav');
  var toggle = nav && nav.querySelector('.menu-toggle');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) setMenu(false);
    });

    window.matchMedia('(min-width: 60rem)').addEventListener('change', function () {
      setMenu(false);
    });
  }

  /* ------------------------------------------------------------------
     Sanftes Einblenden beim Scrollen (nur ohne „Bewegung reduzieren“)
     Elemente, die beim Laden schon sichtbar sind, bleiben unverändert.
     ------------------------------------------------------------------ */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('is-pending');
        observer.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------
     Terminanfrage
     Nimmt Wunschzeiten an, keine verbindlichen Buchungen.
     Versandweg über data-Attribute am Formular (siehe README):
       data-endpoint  Formular-Endpunkt (POST), hat Vorrang
       data-mailto    E-Mail-Adresse, öffnet das E-Mail-Programm
     ------------------------------------------------------------------ */
  var form = document.getElementById('anfrage');
  if (!form) return;

  form.noValidate = true;

  var statusOut = form.querySelector('[data-form-status]');
  var done = document.querySelector('[data-form-done]');
  var doneText = document.querySelector('[data-form-done-text]');
  var dateInput = form.elements.wunschtag;
  var timeGroup = document.getElementById('f-zeit');

  dateInput.min = isoDate(berlinNow().day);

  function configured(value) {
    value = (value || '').trim();
    return value && value.indexOf('[[') === -1 ? value : '';
  }

  function setError(field, message) {
    var isGroup = field === timeGroup;
    var errorEl = document.getElementById(field.id + '-fehler');
    var target = isGroup ? field.querySelector('.choice') : field;

    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      if (isGroup) {
        target.setAttribute('data-invalid', 'true');
        field.setAttribute('aria-describedby', errorEl.id);
      } else {
        field.setAttribute('aria-invalid', 'true');
        var described = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (described.indexOf(errorEl.id) === -1) described.unshift(errorEl.id);
        field.setAttribute('aria-describedby', described.join(' '));
      }
    } else {
      errorEl.textContent = '';
      errorEl.hidden = true;
      if (isGroup) {
        target.removeAttribute('data-invalid');
        field.removeAttribute('aria-describedby');
      } else {
        field.removeAttribute('aria-invalid');
        var rest = (field.getAttribute('aria-describedby') || '').split(' ').filter(function (id) {
          return id && id !== errorEl.id;
        });
        if (rest.length) field.setAttribute('aria-describedby', rest.join(' '));
        else field.removeAttribute('aria-describedby');
      }
    }
  }

  function selectedTime() {
    var checked = form.querySelector('input[name="wunschzeit"]:checked');
    return checked ? checked.value : '';
  }

  function validators() {
    var name = form.elements.name;
    var phone = form.elements.telefon;

    return [
      [name, function () {
        if (name.value.trim().length < 2) return 'Bitte geben Sie Ihren Namen an.';
      }],
      [phone, function () {
        var value = phone.value.trim();
        if (!value) return 'Bitte geben Sie eine Telefonnummer an, damit wir Sie zurückrufen können.';
        if (!/^[0-9+()\/\-\s]+$/.test(value) || value.replace(/\D/g, '').length < 6) {
          return 'Bitte prüfen Sie die Telefonnummer.';
        }
      }],
      [dateInput, function () {
        var value = dateInput.value;
        if (!value) return 'Bitte wählen Sie einen Wunschtag.';
        var parts = value.split('-').map(Number);
        var day = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        if (isNaN(day.getTime())) return 'Bitte wählen Sie einen Wunschtag.';
        if (value < dateInput.min) return 'Bitte wählen Sie einen Tag ab heute.';
        var weekday = day.getUTCDay();
        if (weekday === 0 || weekday === 1) {
          return 'Montags und sonntags ist geschlossen. Bitte wählen Sie Dienstag bis Samstag.';
        }
        if (!hoursFor(day)) return 'An diesem Tag ist der Salon geschlossen. Bitte wählen Sie einen anderen Tag.';
      }],
      [timeGroup, function () {
        var time = selectedTime();
        if (!time) return 'Bitte wählen Sie eine Wunschzeit.';
        if (time === 'Nachmittag' && dateInput.value) {
          var p = dateInput.value.split('-').map(Number);
          if (new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() === 6) {
            return 'Samstags ist bis 14:00 geöffnet. Bitte wählen Sie Vormittag oder Mittag.';
          }
        }
      }]
    ];
  }

  function validate() {
    var firstInvalid = null;
    validators().forEach(function (pair) {
      var message = pair[1]();
      setError(pair[0], message);
      if (message && !firstInvalid) firstInvalid = pair[0];
    });
    return firstInvalid;
  }

  var attempted = false;
  form.addEventListener('input', function () {
    if (attempted) validate();
  });
  form.addEventListener('change', function () {
    if (attempted) validate();
  });

  function formatDay(value) {
    var p = value.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2])).toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    });
  }

  function mailtoUrl(address) {
    var f = form.elements;
    var lines = [
      'Terminanfrage über die Website (Wunschzeit, keine feste Buchung)',
      '',
      'Name: ' + f.name.value.trim(),
      'Telefon: ' + f.telefon.value.trim(),
      'Wunschtag: ' + formatDay(f.wunschtag.value),
      'Wunschzeit: ' + selectedTime()
    ];
    if (f.leistung.value) lines.push('Leistung: ' + f.leistung.value);
    if (f.nachricht.value.trim()) lines.push('', 'Nachricht:', f.nachricht.value.trim());
    return 'mailto:' + address +
      '?subject=' + encodeURIComponent('Terminanfrage: ' + f.name.value.trim()) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function showDone(text) {
    form.hidden = true;
    doneText.textContent = text;
    done.hidden = false;
    done.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    attempted = true;
    statusOut.textContent = '';

    // Spam-Falle ausgefüllt: still beenden
    if (form.elements.website.value) {
      showDone('Wir rufen Sie zur Bestätigung zurück.');
      return;
    }

    var invalid = validate();
    if (invalid) {
      (invalid === timeGroup ? timeGroup.querySelector('input') : invalid).focus();
      return;
    }

    var endpoint = configured(form.getAttribute('data-endpoint'));
    var mailto = configured(form.getAttribute('data-mailto'));
    var button = form.querySelector('button[type="submit"]');

    if (endpoint) {
      button.disabled = true;
      statusOut.textContent = 'Wird gesendet …';
      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        showDone('Wir rufen Sie zur Bestätigung zurück.');
      }).catch(function () {
        button.disabled = false;
        statusOut.textContent = 'Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder rufen Sie an: ' + PHONE + '.';
      });
      return;
    }

    if (mailto) {
      window.location.href = mailtoUrl(mailto);
      showDone('Ihr E-Mail-Programm öffnet sich mit der fertigen Anfrage. Bitte senden Sie die E-Mail dort ab. Wir rufen Sie dann zur Bestätigung zurück.');
      return;
    }

    statusOut.textContent = 'Die Online-Anfrage ist noch nicht freigeschaltet. Bitte rufen Sie uns an: ' + PHONE + '.';
  });
})();
