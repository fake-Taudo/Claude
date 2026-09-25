/**
 * Studio Kern – Interaktionen
 * ---------------------------------------------------------------------------
 * Reines JavaScript ohne Abhängigkeiten. Wird mit `defer` geladen.
 *
 * 1. Header: feine Linie nach dem Scrollen
 * 2. Mobiles Menü
 * 3. Header-Button erst nach dem Hero einblenden
 * 4. Einblenden beim Scrollen
 * 5. Ablauf: Zeitleiste folgt dem Scrollen
 * 6. Kontaktformular (Web3Forms, ersatzweise E-Mail-Programm)
 * 7. Jahreszahl im Footer
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const nav = document.querySelector("[data-nav]");

  /* 1. HEADER ------------------------------------------------------------ */
  if (nav) {
    const updateNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();
  }

  /* 2. MOBILES MENÜ ------------------------------------------------------ */
  const toggle = document.querySelector("[data-nav-toggle]");

  if (nav && toggle) {
    const menu = document.getElementById(toggle.getAttribute("aria-controls"));
    // Solange das Menü offen ist, sind Inhalt und Footer für Tastatur und Screenreader gesperrt
    const background = document.querySelectorAll("main, footer");
    const desktop = window.matchMedia("(min-width: 834px)");

    const setMenu = (open) => {
      nav.classList.toggle("is-open", open);
      root.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      background.forEach((el) => { el.inert = open; });
    };

    toggle.addEventListener("click", () => {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Klick auf einen Menüpunkt schließt das Menü
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Beim Wechsel auf Desktop-Breite das Menü zurücksetzen
    desktop.addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  /* 3. HEADER-BUTTON ERST NACH DEM HERO ---------------------------------- */
  // Solange der große Button im Hero zu sehen ist, bleibt der im Header verborgen.
  const heroCta = document.querySelector("[data-hero-cta]");

  if (nav && nav.hasAttribute("data-cta-auto")) {
    if (heroCta && "IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          nav.classList.toggle("show-cta", scrolledPast);
        },
        { rootMargin: `-${nav.offsetHeight}px 0px 0px 0px` }
      ).observe(heroCta);
    } else {
      nav.classList.add("show-cta");
    }
  }

  /* 4. EINBLENDEN BEIM SCROLLEN ------------------------------------------ */
  const revealItems = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // nur einmal einblenden
        });
      },
      // Element wird eingeblendet, sobald es etwas über den unteren Rand gescrollt ist
      { rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* 5. ABLAUF: ZEITLEISTE FOLGT DEM SCROLLEN ----------------------------- */
  // Die blaue Linie wächst bis zur „Lesehöhe“ (60 % der Fensterhöhe);
  // jeder Schritt, dessen Punkt diese Höhe erreicht hat, wird aktiv.
  const steps = document.querySelector("[data-steps]");

  if (steps) {
    const items = [...steps.querySelectorAll(".step")];
    const dotCenter = parseFloat(getComputedStyle(steps).getPropertyValue("--dot-center")) || 10.5;
    let dots = []; // Position jedes Punktes innerhalb der Liste (ändert sich beim Scrollen nicht)
    let queued = false;

    // Erst alles lesen, dann alles schreiben – so muss der Browser das Layout
    // nie vorzeitig berechnen. remeasure = Positionen der Punkte neu bestimmen.
    const sync = (remeasure) => {
      queued = false;
      if (remeasure) dots = items.map((item) => item.offsetTop + dotCenter);
      const top = steps.getBoundingClientRect().top;
      const readingLine = window.innerHeight * 0.6;
      const span = dots[dots.length - 1] - dots[0];
      const progress = Math.min(Math.max((readingLine - top - dots[0]) / span, 0), 1);

      if (remeasure) {
        // Linie genau vom ersten bis zum letzten Punkt spannen
        steps.style.setProperty("--track-top", `${dots[0]}px`);
        steps.style.setProperty("--track-h", `${span}px`);
      }
      steps.style.setProperty("--progress", progress.toFixed(4));
      items.forEach((item, i) => {
        item.classList.toggle("is-active", top + dots[i] <= readingLine + 1);
      });
    };

    window.addEventListener("scroll", () => {
      if (queued || !dots.length) return;
      queued = true;
      requestAnimationFrame(() => sync(false));
    }, { passive: true });

    // Messen, sobald das Layout steht, und erneut bei Größenänderungen
    // (Schrift geladen, Fenster gedreht …). Der ResizeObserver meldet sich
    // auch direkt nach dem ersten Layout.
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => sync(true)).observe(steps);
    } else {
      requestAnimationFrame(() => sync(true));
      window.addEventListener("resize", () => requestAnimationFrame(() => sync(true)));
    }
  }

  /* 6. KONTAKTFORMULAR --------------------------------------------------- */
  const form = document.querySelector("[data-contact-form]");

  if (form) {
    const PLACEHOLDER_KEY = "DEIN-ACCESS-KEY";
    const fallbackEmail = form.dataset.fallbackEmail;
    const fieldsWrap = form.querySelector("[data-form-fields]");
    const success = form.querySelector("[data-form-success]");
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector('[type="submit"]');
    const submitLabel = submit.textContent;
    const fields = form.querySelectorAll("[required]");

    // Verständliche Fehlermeldungen statt der Browser-Standardtexte
    const errorText = (field) => {
      const v = field.validity;
      if (v.valid) return "";
      if (field.type === "checkbox") return "Bitte stimmen Sie der Datenschutzerklärung zu.";
      if (v.valueMissing) {
        return field.type === "email"
          ? "Bitte geben Sie Ihre E-Mail-Adresse an."
          : "Bitte füllen Sie dieses Feld aus.";
      }
      if (v.typeMismatch) return "Bitte geben Sie eine gültige E-Mail-Adresse an.";
      if (v.tooShort) return `Bitte schreiben Sie mindestens ${field.minLength} Zeichen.`;
      return "Bitte prüfen Sie Ihre Eingabe.";
    };

    const validate = (field) => {
      const message = errorText(field);
      const output = document.getElementById(`${field.id}-error`);
      if (output) output.textContent = message;
      field.setAttribute("aria-invalid", String(Boolean(message)));
      return !message;
    };

    // Erst nach dem ersten Verlassen eines Feldes prüfen, danach bei jeder Eingabe
    fields.forEach((field) => {
      field.addEventListener("blur", () => validate(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validate(field);
      });
      field.addEventListener("change", () => {
        if (field.type === "checkbox") validate(field);
      });
    });

    const setStatus = (message, isError = false) => {
      status.classList.toggle("is-error", isError);
      status.textContent = message;
    };

    const setPending = (pending) => {
      submit.disabled = pending;
      submit.textContent = pending ? "Wird gesendet …" : submitLabel;
    };

    const showSuccess = () => {
      fieldsWrap.hidden = true;
      success.hidden = false;
      success.focus();
    };

    // Ersatzweg ohne Access Key: E-Mail-Programm mit vorbereiteter Nachricht öffnen
    const openMailProgram = (data) => {
      const lines = [
        `Name: ${data.get("name")}`,
        `E-Mail: ${data.get("email")}`,
        data.get("company") ? `Unternehmen: ${data.get("company")}` : null,
        `Projektart: ${data.get("project_type")}`,
        `Budget-Rahmen: ${data.get("budget")}`,
        "",
        data.get("message"),
      ].filter((line) => line !== null);

      const subject = encodeURIComponent(data.get("subject"));
      const body = encodeURIComponent(lines.join("\r\n"));
      window.location.href = `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;

      setStatus("Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die vorbereitete Nachricht dort ab.");
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus("");

      // Alle Pflichtfelder prüfen und zum ersten Fehler springen
      const invalid = [...fields].filter((field) => !validate(field));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      const data = new FormData(form);
      if (data.get("botcheck")) return; // Honeypot ausgefüllt → Spam-Bot

      const key = String(data.get("access_key") || "").trim();
      if (!key || key === PLACEHOLDER_KEY) {
        openMailProgram(data);
        return;
      }

      setPending(true);
      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: data,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.message || response.statusText);
        form.reset();
        showSuccess();
      } catch (error) {
        console.error("Kontaktformular:", error);
        status.classList.add("is-error");
        status.innerHTML =
          "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder schreiben Sie direkt an " +
          `<a href="mailto:${fallbackEmail}">${fallbackEmail}</a>.`;
      } finally {
        setPending(false);
      }
    });
  }

  /* 7. JAHRESZAHL IM FOOTER ---------------------------------------------- */
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = year; });
})();
