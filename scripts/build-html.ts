/**
 * Erzeugt eine eigenständige HTML-Fassung der Website in `dist/`.
 *
 *   npm run html
 *
 * Ergebnis: index.html, impressum.html, datenschutz.html – jede Datei enthält
 * CSS und Schriften eingebettet und funktioniert ohne Server und ohne Internet.
 * Inhalte stammen unverändert aus content/site.ts.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homeBody, legalBody, esc, site } from "./sections.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(root, ".html-build");
const dist = join(root, "dist");

/* -------------------------------------------------------- Interaktion (JS) */
const script = `
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header beim Scrollen absetzen
  var header = document.getElementById("site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobiles Menü
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    toggle.querySelector('[data-menu-icon="open"]').hidden = open;
    toggle.querySelector('[data-menu-icon="close"]').hidden = !open;
    header.classList.toggle("is-scrolled", open || window.scrollY > 16);
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", function () {
    setMenu(menu.hidden);
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-menu-link]"), function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) setMenu(false);
  });

  // FAQ-Akkordeon
  var buttons = document.querySelectorAll(".faq-item button");
  Array.prototype.forEach.call(buttons, function (button) {
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    var item = button.closest(".faq-item");

    function close(animate) {
      button.setAttribute("aria-expanded", "false");
      item.classList.remove("is-open");
      if (animate && !reduce) {
        panel.style.height = panel.scrollHeight + "px";
        requestAnimationFrame(function () { panel.style.height = "0px"; });
        window.setTimeout(function () { panel.hidden = true; panel.style.height = ""; }, 300);
      } else {
        panel.hidden = true;
        panel.style.height = "";
      }
    }

    function open() {
      button.setAttribute("aria-expanded", "true");
      item.classList.add("is-open");
      panel.hidden = false;
      if (reduce) return;
      panel.style.height = "0px";
      requestAnimationFrame(function () { panel.style.height = panel.scrollHeight + "px"; });
      window.setTimeout(function () { panel.style.height = ""; }, 300);
    }

    button.addEventListener("click", function () {
      var isOpen = button.getAttribute("aria-expanded") === "true";
      Array.prototype.forEach.call(buttons, function (other) {
        if (other !== button && other.getAttribute("aria-expanded") === "true") {
          other.click();
        }
      });
      if (isOpen) close(true); else open();
    });
  });
  // Erste Frage beim Laden geöffnet
  if (buttons.length) buttons[0].click();

  // Sanftes Einblenden beim Scrollen
  var revealed = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealed, function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -80px 0px" });
    Array.prototype.forEach.call(revealed, function (el) { observer.observe(el); });
  }

  // Kontaktformular: öffnet das E-Mail-Programm mit fertiger Nachricht
  var form = document.getElementById("kontakt-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var lines = [
        "Name: " + (data.get("name") || ""),
        "E-Mail: " + (data.get("email") || ""),
        data.get("company") ? "Unternehmen: " + data.get("company") : "",
        "Budget: " + (data.get("budget") || ""),
        "",
        data.get("message") || ""
      ].filter(Boolean);
      var href =
        "mailto:" + EMAIL +
        "?subject=" + encodeURIComponent("Anfrage über die Website: " + (data.get("name") || "")) +
        "&body=" + encodeURIComponent(lines.join("\\n"));
      window.location.href = href;
      form.hidden = true;
      document.getElementById("form-success").hidden = false;
    });
  }
})();
`.replace("EMAIL", JSON.stringify(site.contact.email));

/* ---------------------------------------------------------- Zusatz-Styles */
const extraCss = `
:root { --font-inter: "Inter"; }

/* Einblenden beim Scrollen (ersetzt Framer Motion) */
.reveal { opacity: 0; transform: translate3d(0, 18px, 0); transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
.reveal.is-visible { opacity: 1; transform: none; }

/* Header-Zustand beim Scrollen */
#site-header.is-scrolled { border-color: var(--line); background-color: color-mix(in oklab, var(--bg) 80%, transparent); backdrop-filter: blur(16px); }

/* FAQ-Akkordeon */
.faq-panel { overflow: hidden; transition: height .3s cubic-bezier(.22,1,.36,1); }
.faq-item.is-open { border-color: color-mix(in oklab, #fff 20%, transparent); }
.faq-item.is-open .faq-icon { transform: rotate(45deg); color: var(--accent); border-color: color-mix(in oklab, var(--accent) 50%, transparent); }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .faq-panel { transition: none !important; }
}
`;

/* ------------------------------------------------------------ Rechtstexte */
const legal = site.legal;
const mailLink = `<a href="mailto:${esc(legal.email)}" class="text-fg underline underline-offset-4 hover:text-accent">${esc(legal.email)}</a>`;
const block = (title: string, body: string) =>
  `<section class="flex flex-col gap-3"><h2 class="text-lg font-semibold text-fg">${esc(title)}</h2>${body}</section>`;
const hint = (text: string) =>
  `<p class="rounded-xl border border-line bg-white/[0.03] p-4 text-xs"><strong class="text-fg">Hinweis:</strong> ${text}</p>`;

const impressumSections = [
  hint(
    "Diese Seite enthält Platzhalter. Ersetze die Angaben in <code class=\"text-fg\">content/site.ts</code> (Abschnitt <code class=\"text-fg\">legal</code>) durch deine echten Daten und lass den Text vor dem Livegang rechtlich prüfen.",
  ),
  block(
    "Angaben gemäß § 5 DDG",
    `<p>${esc(legal.company)}<br>${esc(legal.owner)}<br>${esc(legal.street)}<br>${esc(legal.city)}<br>${esc(legal.country)}</p>`,
  ),
  block(
    "Kontakt",
    `<p>Telefon: ${esc(legal.phone)}<br>Telefon (alternativ): ${esc(legal.phoneSecondary)}<br>E-Mail: ${mailLink}</p>`,
  ),
  block("Umsatzsteuer-Identifikationsnummer", `<p>Gemäß § 27 a Umsatzsteuergesetz: ${esc(legal.vatId)}</p>`),
  block("Verantwortlich für den Inhalt", `<p>${esc(legal.owner)}, ${esc(legal.street)}, ${esc(legal.city)}</p>`),
  block(
    "EU-Streitschlichtung",
    `<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-fg underline underline-offset-4 hover:text-accent">ec.europa.eu/consumers/odr</a>. Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
  ),
  block(
    "Haftung für Inhalte und Links",
    `<p>Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für Inhalte externer Links ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Inhalte umgehend.</p>`,
  ),
].join("");

const datenschutzSections = [
  hint(
    "Dies ist eine Muster-Datenschutzerklärung als Platzhalter. Passe sie an deine tatsächlich eingesetzten Dienste an und lass sie vor dem Livegang rechtlich prüfen.",
  ),
  block(
    "1. Verantwortliche Stelle",
    `<p>${esc(legal.company)}, ${esc(legal.owner)}<br>${esc(legal.street)}, ${esc(legal.city)}<br>E-Mail: ${mailLink}</p>`,
  ),
  block(
    "2. Hosting",
    `<p>Diese Website wird bei einem externen Dienstleister gehostet: ${esc(legal.hosting)}. Beim Aufruf der Seite werden automatisch Server-Logfiles verarbeitet (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browsertyp). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO – unser berechtigtes Interesse an einem sicheren und stabilen Betrieb.</p>`,
  ),
  block(
    "3. Kontaktformular und E-Mail-Kontakt",
    `<p>Wenn du uns über das Formular oder per E-Mail kontaktierst, verarbeiten wir die von dir angegebenen Daten (Name, E-Mail-Adresse, Unternehmen, Budget-Rahmen und Nachricht), um deine Anfrage zu beantworten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f DSGVO. Die Daten werden gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>`,
  ),
  block(
    "4. Cookies und Analyse",
    `<p>Diese Website setzt keine Tracking-Cookies und bindet keine externen Analysedienste ein. Schriftarten werden lokal ausgeliefert, es entsteht dadurch keine Verbindung zu Servern Dritter. Sollten später Analyse- oder Marketing-Dienste hinzukommen, holen wir vorab deine Einwilligung über einen Cookie-Banner ein.</p>`,
  ),
  block(
    "5. Deine Rechte",
    `<p>Du hast jederzeit das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen die Verarbeitung (Art. 21). Wende dich dafür an die oben genannte Adresse. Außerdem steht dir ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu.</p>`,
  ),
  block(
    "6. SSL-/TLS-Verschlüsselung",
    `<p>Diese Seite nutzt aus Sicherheitsgründen eine TLS-Verschlüsselung. Du erkennst sie an der Adresszeile deines Browsers, die mit „https://“ beginnt.</p>`,
  ),
].join("");

/* ------------------------------------------------------------ Seitengerüst */
function page(opts: { title: string; description: string; body: string; noindex?: boolean }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta name="theme-color" content="#07070c">
<meta name="color-scheme" content="dark">
${opts.noindex ? '<meta name="robots" content="noindex, follow">' : ""}
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${esc(site.brand.name)}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(opts.title)}">
<meta name="twitter:description" content="${esc(opts.description)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(readFileSync(join(root, "app/icon.svg"), "utf8"))}">
<!--STYLE-->
<noscript><style>.reveal{opacity:1!important;transform:none!important}.faq-panel{display:block!important}</style></noscript>
</head>
<body class="antialiased">
<a href="#hauptinhalt" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-accent-contrast">Zum Inhalt springen</a>
${opts.body}
<!--SCRIPT-->
</body>
</html>`;
}

/* ------------------------------------------------------------------ Ablauf */
rmSync(tmp, { recursive: true, force: true });
rmSync(dist, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(dist, { recursive: true });

const pages = [
  {
    file: "index.html",
    html: page({ title: site.seo.title, description: site.seo.description, body: homeBody() }),
  },
  {
    file: "impressum.html",
    html: page({
      title: `Impressum | ${site.brand.name}`,
      description: `Impressum und Anbieterkennzeichnung von ${site.brand.name}.`,
      body: legalBody("Impressum", legal.lastUpdated, impressumSections),
      noindex: true,
    }),
  },
  {
    file: "datenschutz.html",
    html: page({
      title: `Datenschutzerklärung | ${site.brand.name}`,
      description: `Informationen zum Datenschutz bei ${site.brand.name}.`,
      body: legalBody("Datenschutzerklärung", legal.lastUpdated, datenschutzSections),
      noindex: true,
    }),
  },
];

// 1. Rohfassungen schreiben – daraus liest Tailwind die verwendeten Klassen
for (const p of pages) writeFileSync(join(tmp, p.file), p.html);

// 2. CSS kompilieren
const globals = readFileSync(join(root, "app/globals.css"), "utf8").replace('@import "tailwindcss";', "");
const cssIn = join(tmp, "_input.css");
const cssOut = join(tmp, "_output.css");
writeFileSync(
  cssIn,
  `@import "tailwindcss" source(none);\n@source "${tmp}";\n${globals}\n${extraCss}`,
);
execFileSync("npx", ["@tailwindcss/cli", "-i", cssIn, "-o", cssOut, "--minify"], {
  cwd: root,
  stdio: "pipe",
});

// 3. Schriften als Base64 einbetten (Inter, lateinische Zeichensätze)
const mediaDir = join(root, ".next/static/media");
const nextCss = readdirSync(join(root, ".next/static/chunks"))
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(join(root, ".next/static/chunks", f), "utf8"))
  .join("");

// Nur der lateinische Zeichensatz wird eingebettet – er deckt Deutsch
// vollständig ab und hält die Datei klein. Brauchst du osteuropäische
// Sonderzeichen (ć, ő, ř …), ergänze hier "U+100-2BA" (latin-ext, +85 KB).
const wanted = ["U+??,U+131"];
const faces = (nextCss.match(/@font-face\{[^}]*\}/g) ?? [])
  .filter((face) => wanted.some((w) => face.includes(w)))
  .map((face) => {
    const file = face.match(/\.\.\/media\/([^)]+)\)/)?.[1];
    if (!file) return "";
    const data = readFileSync(join(mediaDir, file)).toString("base64");
    return face.replace(
      /url\(\.\.\/media\/[^)]+\)/,
      `url(data:font/woff2;base64,${data})`,
    );
  })
  .filter(Boolean)
  .join("\n");

if (!faces) throw new Error("Keine Inter-Schriftschnitte gefunden – bitte zuerst `npm run build` ausführen.");

const css = faces + "\n" + readFileSync(cssOut, "utf8");

// 4. Endfassungen schreiben
for (const p of pages) {
  const html = p.html
    .replace("<!--STYLE-->", `<style>${css}</style>`)
    .replace("<!--SCRIPT-->", `<script>${script}</script>`);
  writeFileSync(join(dist, p.file), html);
  console.log(`  dist/${p.file}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
}

rmSync(tmp, { recursive: true, force: true });
console.log("\nFertig. Öffne dist/index.html im Browser.");
