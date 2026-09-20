/**
 * Erzeugt das Markup für den eigenständigen HTML-Export.
 * Die CSS-Klassen sind identisch mit den React-Komponenten in components/,
 * damit beide Varianten exakt gleich aussehen.
 */
import { site } from "../content/site.ts";
import { icons, type IconKey } from "./icons.ts";

/** Sonderzeichen für HTML maskieren */
export const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Element, das beim Scrollen sanft eingeblendet wird */
const reveal = (content: string, delay = 0, cls = "") =>
  `<div class="reveal ${cls}"${delay ? ` style="transition-delay:${delay}ms"` : ""}>${content}</div>`;

const container = (content: string, cls = "") =>
  `<div class="mx-auto w-full max-w-6xl px-5 sm:px-8 ${cls}">${content}</div>`;

const eyebrow = (text: string) =>
  `<span class="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted uppercase">
     <span aria-hidden="true" class="size-1.5 rounded-full bg-gradient-to-r from-accent to-accent2"></span>${esc(text)}
   </span>`;

const heading = (id: string, eyebrowText: string, title: string, subtitle?: string) =>
  reveal(
    `<div class="flex flex-col items-center text-center gap-4">
       ${eyebrow(eyebrowText)}
       <h2 id="${id}" class="max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl md:text-[2.75rem]">${esc(title)}</h2>
       ${subtitle ? `<p class="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">${esc(subtitle)}</p>` : ""}
     </div>`,
  );

/* ------------------------------------------------------------------ Header */
function header(prefix: string) {
  return `
<header id="site-header" class="fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b border-transparent">
  ${container(`
    <div class="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
      <a href="index.html" class="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="${esc(site.brand.name)} – Startseite">
        ${icons.logo("size-8 shrink-0")}
        <span class="text-[0.975rem]">${esc(site.brand.name)}</span>
      </a>
      <nav aria-label="Hauptnavigation" class="hidden md:block">
        <ul class="flex items-center gap-1">
          ${site.nav
            .map(
              (item) =>
                `<li><a href="${prefix}${item.href}" class="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-fg">${esc(item.label)}</a></li>`,
            )
            .join("")}
        </ul>
      </nav>
      <div class="flex items-center gap-2">
        <a href="${prefix}${site.hero.primaryCta.href}" class="hidden rounded-full bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-medium text-accent-contrast shadow-[0_10px_30px_-12px_rgba(139,92,246,0.9)] transition-all duration-300 hover:brightness-110 active:scale-[0.98] sm:inline-flex">${esc(site.hero.primaryCta.label)}</a>
        <button type="button" id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Menü öffnen"
          class="inline-flex size-10 items-center justify-center rounded-full border border-line text-fg transition-colors hover:bg-white/[0.06] md:hidden">
          <span data-menu-icon="open">${icons.menu("size-5")}</span>
          <span data-menu-icon="close" hidden>${icons.close("size-5")}</span>
        </button>
      </div>
    </div>`)}
  <div id="mobile-menu" hidden class="overflow-hidden border-t border-line bg-[var(--bg)]/95 backdrop-blur-xl md:hidden">
    ${container(`
      <nav aria-label="Mobile Navigation" class="py-4">
        <ul class="flex flex-col">
          ${site.nav
            .map(
              (item) =>
                `<li><a href="${prefix}${item.href}" data-menu-link class="block rounded-xl px-2 py-3.5 text-base text-muted transition-colors hover:bg-white/[0.05] hover:text-fg">${esc(item.label)}</a></li>`,
            )
            .join("")}
        </ul>
        <a href="${prefix}${site.hero.primaryCta.href}" data-menu-link class="mt-3 mb-2 flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent2 px-6 py-3.5 text-base font-medium text-accent-contrast">${esc(site.hero.primaryCta.label)}</a>
      </nav>`)}
  </div>
</header>`;
}

/* -------------------------------------------------------------------- Hero */
function hero() {
  const h = site.hero;
  return `
<section id="start" aria-labelledby="hero-title" class="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16 sm:pt-32">
  ${mesh()}
  ${container(
    `<div class="flex flex-col items-center text-center">
      <p class="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-muted backdrop-blur sm:text-sm" style="animation-delay:40ms">
        <span class="relative flex size-2" aria-hidden="true">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75"></span>
          <span class="relative inline-flex size-2 rounded-full bg-accent"></span>
        </span>${esc(h.badge)}
      </p>
      <h1 id="hero-title" class="animate-fade-up mt-7 max-w-5xl text-4xl leading-[1.08] font-semibold sm:text-6xl lg:text-[4.25rem]" style="animation-delay:120ms">
        ${esc(h.headlineBefore)}<br class="hidden sm:block"> <span class="text-gradient">${esc(h.headlineHighlight)}</span> ${esc(h.headlineAfter)}
      </h1>
      <p class="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg" style="animation-delay:220ms">${esc(h.subline)}</p>
      <div class="animate-fade-up mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center" style="animation-delay:320ms">
        <a href="${h.primaryCta.href}" class="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-4 text-base font-medium text-accent-contrast shadow-[0_18px_45px_-15px_rgba(139,92,246,0.95)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]">
          ${esc(h.primaryCta.label)}${icons.arrowRight("size-4 transition-transform duration-300 group-hover:translate-x-1")}
        </a>
        <a href="${h.secondaryCta.href}" class="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-white/[0.04] px-7 py-4 text-base font-medium text-fg backdrop-blur transition-all duration-300 hover:border-white/30 hover:bg-white/[0.09] active:scale-[0.98]">${esc(h.secondaryCta.label)}</a>
      </div>
      <ul class="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted" style="animation-delay:420ms">
        ${h.trustLine.map((t) => `<li class="flex items-center gap-2">${icons.check("size-4 text-accent")}${esc(t)}</li>`).join("")}
      </ul>
      <dl class="animate-fade-up mt-14 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4" style="animation-delay:520ms">
        ${h.stats
          .map(
            (s) => `<div class="flex flex-col-reverse items-center gap-1 bg-[var(--bg)]/70 px-4 py-6 text-center backdrop-blur">
              <dt class="text-xs text-muted sm:text-sm">${esc(s.label)}</dt>
              <dd class="text-2xl font-semibold sm:text-3xl">${esc(s.value)}</dd>
            </div>`,
          )
          .join("")}
      </dl>
    </div>`,
    "relative",
  )}
</section>`;
}

function mesh() {
  return `<div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
  <div class="absolute -top-[22rem] left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_65%)] opacity-30 blur-3xl animate-mesh-a"></div>
  <div class="absolute top-[12%] -left-[14rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,var(--accent-2)_0%,transparent_65%)] opacity-25 blur-3xl animate-mesh-b"></div>
  <div class="absolute -right-[12rem] bottom-[-8rem] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_65%)] opacity-20 blur-3xl animate-mesh-c"></div>
  <div class="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent_75%)]"></div>
  <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--bg)]"></div>
</div>`;
}

/* -------------------------------------------------------------- Leistungen */
function services() {
  const s = site.services;
  return `
<section id="leistungen" aria-labelledby="leistungen-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg">
  ${container(`
    ${heading("leistungen-title", s.eyebrow, s.title, s.subtitle)}
    <ul class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      ${s.items
        .map((item, i) =>
          `<li>${reveal(
            `<article class="card-surface group relative h-full overflow-hidden rounded-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              <span aria-hidden="true" class="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              <span class="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 to-accent2/20 text-accent ring-1 ring-white/10">${icons[item.icon as IconKey]("size-5.5")}</span>
              <h3 class="mt-5 text-lg font-semibold">${esc(item.title)}</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-muted">${esc(item.description)}</p>
              <ul class="mt-5 flex flex-col gap-2 border-t border-line pt-5">
                ${item.bullets.map((b) => `<li class="flex items-start gap-2 text-sm text-muted">${icons.check("mt-0.5 size-4 shrink-0 text-accent")}${esc(b)}</li>`).join("")}
              </ul>
            </article>`,
            i * 80,
            "h-full",
          )}</li>`,
        )
        .join("")}
    </ul>`)}
</section>`;
}

/* ------------------------------------------------------------------ Ablauf */
function process() {
  const p = site.process;
  return `
<section id="ablauf" aria-labelledby="ablauf-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg-soft">
  ${container(`
    ${heading("ablauf-title", p.eyebrow, p.title, p.subtitle)}
    <ol class="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <span aria-hidden="true" class="absolute top-[3.25rem] right-6 left-6 hidden h-px bg-gradient-to-r from-accent/40 via-accent2/40 to-transparent lg:block"></span>
      ${p.steps
        .map((step, i) =>
          `<li class="relative">${reveal(
            `<article class="card-surface h-full rounded-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              <div class="flex items-center justify-between gap-3">
                <span class="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-semibold text-accent-contrast">${String(i + 1).padStart(2, "0")}</span>
                <span class="rounded-full border border-line px-3 py-1 text-xs text-muted">${esc(step.duration)}</span>
              </div>
              <h3 class="mt-5 text-lg font-semibold">${esc(step.title)}</h3>
              <p class="mt-2.5 text-sm leading-relaxed text-muted">${esc(step.description)}</p>
            </article>`,
            i * 80,
            "h-full",
          )}</li>`,
        )
        .join("")}
    </ol>`)}
</section>`;
}

/* --------------------------------------------------------------- Portfolio */
function mockup(variant: "browser" | "app" | "shop") {
  const bar = (w: string, dim = false) =>
    `<span class="block h-2 rounded-full ${dim ? "bg-white/10" : "bg-white/20"}" style="width:${w}"></span>`;

  const contents: Record<string, string> = {
    browser: `<div class="flex h-full flex-col gap-3 p-4">
      <div class="relative flex flex-[1.4] flex-col justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-br from-accent/40 to-accent2/25 px-4">
        <span class="block h-2.5 w-3/5 rounded-full bg-white/45"></span>
        <span class="block h-2 w-2/5 rounded-full bg-white/25"></span>
        <span class="mt-1 block h-6 w-20 rounded-full bg-white/80"></span>
      </div>
      <div class="flex flex-1 gap-2">
        ${[0, 1, 2]
          .map(
            () => `<div class="flex flex-1 flex-col justify-end gap-1.5 rounded-md bg-white/[0.06] p-2.5">
              <span class="block size-4 rounded-md bg-accent/50"></span>${bar("80%", true)}${bar("55%", true)}
            </div>`,
          )
          .join("")}
      </div>
    </div>`,
    app: `<div class="flex h-full gap-3 p-4">
      <div class="flex w-1/4 flex-col gap-2 rounded-lg bg-white/[0.05] p-2">
        ${[0, 1, 2, 3].map((i) => `<div class="h-2.5 rounded-full ${i === 0 ? "bg-accent/70" : "bg-white/12"}"></div>`).join("")}
      </div>
      <div class="flex flex-1 flex-col gap-3">
        <div class="grid grid-cols-2 gap-2">
          <div class="h-12 rounded-lg bg-white/[0.07]"></div>
          <div class="h-12 rounded-lg bg-gradient-to-br from-accent2/40 to-accent/25"></div>
        </div>
        <div class="flex flex-1 items-end gap-1.5 rounded-lg bg-white/[0.05] p-3">
          ${[40, 65, 35, 80, 55, 95, 70].map((h) => `<div class="flex-1 rounded-sm bg-gradient-to-t from-accent/70 to-accent2/70" style="height:${h}%"></div>`).join("")}
        </div>
      </div>
    </div>`,
    shop: `<div class="grid h-full grid-cols-2 gap-3 p-4">
      <div class="rounded-lg bg-gradient-to-br from-accent2/40 to-transparent"></div>
      <div class="flex flex-col justify-center gap-2">
        ${bar("85%")}${bar("60%", true)}${bar("70%", true)}
        <span class="mt-2 block h-7 w-24 rounded-full bg-gradient-to-r from-accent to-accent2"></span>
      </div>
      <div class="col-span-2 grid grid-cols-3 gap-2">
        ${[0, 1, 2].map(() => `<div class="flex flex-col justify-end gap-1.5 rounded-md bg-white/[0.06] p-2.5">${bar("70%", true)}${bar("45%", true)}</div>`).join("")}
      </div>
    </div>`,
  };

  return `<div aria-hidden="true" class="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-[#0d0d16]">
    <div class="flex items-center gap-1.5 border-b border-line bg-white/[0.03] px-3 py-2.5">
      <span class="size-2 rounded-full bg-white/20"></span><span class="size-2 rounded-full bg-white/15"></span><span class="size-2 rounded-full bg-white/10"></span>
      <span class="ml-2 h-3 w-1/3 rounded-full bg-white/[0.07]"></span>
    </div>
    <div class="h-[calc(100%-2.6rem)]">${contents[variant]}</div>
  </div>`;
}

function portfolio() {
  const p = site.portfolio;
  return `
<section id="projekte" aria-labelledby="projekte-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg">
  ${container(`
    ${heading("projekte-title", p.eyebrow, p.title, p.subtitle)}
    <ul class="mt-14 grid gap-6 md:grid-cols-2">
      ${p.items
        .map((project, i) =>
          `<li>${reveal(
            `<article class="card-surface group h-full overflow-hidden rounded-card p-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              <div class="relative overflow-hidden rounded-xl">
                <div class="transition-transform duration-500 group-hover:scale-[1.03]">${mockup(project.mockup)}</div>
              </div>
              <div class="flex flex-col gap-3 p-4 pt-5">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-medium tracking-wide text-accent uppercase">${esc(project.category)}</span>
                  <span aria-hidden="true" class="h-px flex-1 bg-line"></span>
                </div>
                <h3 class="text-xl font-semibold">${esc(project.title)}</h3>
                <p class="text-sm leading-relaxed text-muted">${esc(project.description)}</p>
                <ul class="mt-1 flex flex-wrap gap-2">
                  ${project.tags.map((t) => `<li class="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted">${esc(t)}</li>`).join("")}
                </ul>
                <a href="${project.href}" class="mt-3 inline-flex w-fit items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent">
                  Ähnliches Projekt anfragen${icons.arrowRight("size-4 transition-transform duration-300 group-hover:translate-x-1")}
                </a>
              </div>
            </article>`,
            i * 80,
            "h-full",
          )}</li>`,
        )
        .join("")}
    </ul>`)}
</section>`;
}

/* ------------------------------------------------------------------ Preise */
function pricing() {
  const p = site.pricing;
  return `
<section id="preise" aria-labelledby="preise-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg-soft">
  ${container(`
    ${heading("preise-title", p.eyebrow, p.title, p.subtitle)}
    <ul class="mt-14 grid items-start gap-6 lg:grid-cols-3">
      ${p.plans
        .map((plan, i) => {
          const f = plan.featured;
          const badge = "badge" in plan && plan.badge ? plan.badge : "";
          return `<li class="${f ? "lg:-mt-4" : ""}">${reveal(
            `<article class="relative flex h-full flex-col rounded-card p-7 transition-all duration-300 ${
              f
                ? "border border-accent/40 bg-gradient-to-b from-accent/[0.12] to-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(139,92,246,0.9)]"
                : "card-surface hover:-translate-y-1 hover:border-white/20"
            }">
              ${f && badge ? `<span class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-accent2 px-4 py-1.5 text-xs font-medium whitespace-nowrap text-accent-contrast shadow-lg">${esc(badge)}</span>` : ""}
              <h3 class="text-lg font-semibold">${esc(plan.name)}</h3>
              <p class="mt-1.5 min-h-[2.75rem] text-sm text-muted">${esc(plan.description)}</p>
              <p class="mt-6 flex items-baseline gap-2">
                <span class="text-4xl font-semibold tracking-tight">${esc(plan.price)}</span>
                <span class="text-sm text-muted">${esc(plan.priceNote)}</span>
              </p>
              <ul class="mt-7 flex flex-1 flex-col gap-3 border-t border-line pt-7">
                ${plan.features.map((feat) => `<li class="flex items-start gap-2.5 text-sm">${icons.check("mt-0.5 size-4 shrink-0 text-accent")}<span class="text-muted">${esc(feat)}</span></li>`).join("")}
              </ul>
              <a href="${plan.cta.href}" class="mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
                f
                  ? "bg-gradient-to-r from-accent to-accent2 text-accent-contrast shadow-[0_14px_35px_-14px_rgba(139,92,246,0.95)] hover:brightness-110"
                  : "border border-line-strong bg-white/[0.04] text-fg hover:border-white/30 hover:bg-white/[0.08]"
              }">${esc(plan.cta.label)}</a>
            </article>`,
            i * 80,
            "h-full",
          )}</li>`;
        })
        .join("")}
    </ul>
    ${reveal(`<p class="mt-8 text-center text-sm text-muted">${esc(p.note)}</p>`, 100)}`)}
</section>`;
}

/* ----------------------------------------------------------- Kundenstimmen */
function testimonials() {
  const t = site.testimonials;
  return `
<section id="stimmen" aria-labelledby="stimmen-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg">
  ${container(`
    ${heading("stimmen-title", t.eyebrow, t.title, t.subtitle)}
    <ul class="mt-14 grid gap-5 md:grid-cols-3">
      ${t.items
        .map((item, i) =>
          `<li>${reveal(
            `<figure class="card-surface relative flex h-full flex-col rounded-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
              ${icons.quote("size-8 text-accent/35")}
              <blockquote class="mt-4 flex-1 text-[0.975rem] leading-relaxed text-fg/90">„${esc(item.quote)}“</blockquote>
              <div role="img" aria-label="5 von 5 Sternen" class="mt-6 flex gap-0.5 text-accent">${[0, 1, 2, 3, 4].map(() => icons.star("size-4")).join("")}</div>
              <figcaption class="mt-5 flex items-center gap-3 border-t border-line pt-5">
                <span aria-hidden="true" class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-accent2/25 text-sm font-semibold text-fg ring-1 ring-white/10">${esc(item.initials)}</span>
                <span class="flex flex-col">
                  <span class="text-sm font-medium">${esc(item.name)}</span>
                  <span class="text-xs text-muted">${esc(item.role)}</span>
                </span>
              </figcaption>
            </figure>`,
            i * 80,
            "h-full",
          )}</li>`,
        )
        .join("")}
    </ul>`)}
</section>`;
}

/* --------------------------------------------------------------------- FAQ */
function faq() {
  const f = site.faq;
  return `
<section id="faq" aria-labelledby="faq-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg-soft">
  ${container(`
    ${heading("faq-title", f.eyebrow, f.title, f.subtitle)}
    <div class="mx-auto mt-14 flex max-w-3xl flex-col gap-3">
      ${f.items
        .map((entry, i) =>
          reveal(
            `<div class="faq-item card-surface overflow-hidden rounded-2xl transition-colors duration-300 hover:border-white/15">
              <h3>
                <button type="button" id="faq-btn-${i}" aria-expanded="false" aria-controls="faq-panel-${i}"
                  class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                  <span class="text-base font-medium">${esc(entry.question)}</span>
                  <span aria-hidden="true" class="faq-icon inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-fg transition-transform duration-300">${icons.plus("size-4")}</span>
                </button>
              </h3>
              <div id="faq-panel-${i}" role="region" aria-labelledby="faq-btn-${i}" class="faq-panel" hidden>
                <p class="px-6 pb-6 text-sm leading-relaxed text-muted">${esc(entry.answer)}</p>
              </div>
            </div>`,
            i * 50,
          ),
        )
        .join("")}
    </div>`)}
</section>`;
}

/* ----------------------------------------------------------------- Kontakt */
function contact() {
  const c = site.contact;
  const form = c.form;
  const field =
    "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-fg placeholder:text-muted/60 transition-colors duration-200 hover:border-white/20 focus:border-accent focus:outline-none";

  return `
<section id="kontakt" aria-labelledby="kontakt-title" class="relative scroll-mt-24 py-20 sm:py-28 bg-bg overflow-hidden">
  <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]"></div>
  ${container(
    `${heading("kontakt-title", c.eyebrow, c.title, c.subtitle)}
    <div class="mt-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      ${reveal(
        `<div class="card-surface flex h-full flex-col gap-7 rounded-card p-7">
          <div class="flex flex-col gap-3">
            <a href="mailto:${esc(c.email)}" class="group flex items-center gap-3 text-sm transition-colors hover:text-accent">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-accent ring-1 ring-white/10">${icons.mail("size-5")}</span>
              <span class="flex flex-col"><span class="text-xs text-muted">E-Mail</span><span class="font-medium">${esc(c.email)}</span></span>
            </a>
            ${c.phones
              .map(
                (entry) => `<a href="tel:${entry.number.replace(/\s/g, "")}" class="group flex items-center gap-3 text-sm transition-colors hover:text-accent">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-accent ring-1 ring-white/10">${icons.phone("size-5")}</span>
              <span class="flex flex-col"><span class="text-xs text-muted">${esc(entry.label)}</span><span class="font-medium">${esc(entry.number)}</span></span>
            </a>`,
              )
              .join("")}
          </div>
          <ul class="flex flex-col gap-3 border-t border-line pt-7">
            ${c.highlights.map((h) => `<li class="flex items-start gap-2.5 text-sm text-muted">${icons.check("mt-0.5 size-4 shrink-0 text-accent")}${esc(h)}</li>`).join("")}
          </ul>
        </div>`,
        0,
        "h-full",
      )}
      ${reveal(
        `<div class="card-surface rounded-card p-7">
          <div id="form-success" hidden class="flex min-h-[22rem] flex-col items-center justify-center gap-3 text-center" role="status">
            <span class="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-contrast">${icons.check("size-7")}</span>
            <h3 class="text-xl font-semibold">${esc(form.successTitle)}</h3>
            <p class="max-w-sm text-sm leading-relaxed text-muted">Dein E-Mail-Programm wurde geöffnet. Sobald du die Nachricht abschickst, melde ich mich innerhalb von 24 Stunden.</p>
          </div>
          <form id="kontakt-form" class="flex flex-col gap-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label for="name" class="text-sm font-medium">${esc(form.nameLabel)}</label>
                <input id="name" name="name" type="text" required autocomplete="name" placeholder="${esc(form.namePlaceholder)}" class="${field}">
              </div>
              <div class="flex flex-col gap-2">
                <label for="email" class="text-sm font-medium">${esc(form.emailLabel)}</label>
                <input id="email" name="email" type="email" required autocomplete="email" placeholder="${esc(form.emailPlaceholder)}" class="${field}">
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label for="company" class="text-sm font-medium">${esc(form.companyLabel)}</label>
                <input id="company" name="company" type="text" autocomplete="organization" placeholder="${esc(form.companyPlaceholder)}" class="${field}">
              </div>
              <div class="flex flex-col gap-2">
                <label for="budget" class="text-sm font-medium">${esc(form.budgetLabel)}</label>
                <select id="budget" name="budget" class="${field}">
                  ${form.budgetOptions.map((o) => `<option value="${esc(o)}" class="bg-[var(--surface)]">${esc(o)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label for="message" class="text-sm font-medium">${esc(form.messageLabel)}</label>
              <textarea id="message" name="message" rows="5" required placeholder="${esc(form.messagePlaceholder)}" class="${field} resize-y"></textarea>
            </div>
            <div class="flex items-start gap-3">
              <input id="privacy" name="privacy" type="checkbox" required class="mt-0.5 size-4 shrink-0 accent-[var(--accent)]">
              <label for="privacy" class="text-sm leading-relaxed text-muted">${esc(form.privacyLabel)}
                <a href="datenschutz.html" class="text-fg underline underline-offset-4 hover:text-accent">Datenschutzerklärung</a>
              </label>
            </div>
            <button type="submit" class="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-4 text-base font-medium text-accent-contrast shadow-[0_16px_40px_-15px_rgba(139,92,246,0.95)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]">
              ${esc(form.submitLabel)}${icons.arrowRight("size-4 transition-transform duration-300 group-hover:translate-x-1")}
            </button>
            <p class="text-center text-xs text-muted">Das Formular öffnet dein E-Mail-Programm mit der fertigen Nachricht.</p>
          </form>
        </div>`,
        100,
      )}
    </div>`,
    "relative",
  )}
</section>`;
}

/* ------------------------------------------------------------------ Footer */
function footer(prefix: string) {
  const f = site.footer;
  const link = (href: string) =>
    href.startsWith("#") ? `${prefix}${href}` : href.replace(/^\/(.+)$/, "$1.html");

  return `
<footer class="border-t border-line bg-bg-soft">
  ${container(`
    <div class="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
      <div class="flex max-w-sm flex-col gap-4">
        <a href="index.html" class="flex items-center gap-2.5 font-semibold tracking-tight">${icons.logo("size-8")}${esc(site.brand.name)}</a>
        <p class="text-sm leading-relaxed text-muted">${esc(f.description)}</p>
        <ul class="mt-1 flex flex-wrap gap-2">
          ${f.social.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer" class="inline-flex rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-fg">${esc(s.label)}</a></li>`).join("")}
        </ul>
      </div>
      ${f.columns
        .map(
          (col) => `<nav aria-label="${esc(col.title)}">
        <h2 class="text-sm font-semibold">${esc(col.title)}</h2>
        <ul class="mt-4 flex flex-col gap-2.5">
          ${col.links.map((l) => `<li><a href="${link(l.href)}" class="text-sm text-muted transition-colors hover:text-fg">${esc(l.label)}</a></li>`).join("")}
        </ul>
      </nav>`,
        )
        .join("")}
    </div>
    <div class="flex flex-col items-center justify-between gap-3 border-t border-line py-7 text-xs text-muted sm:flex-row">
      <p>© ${new Date().getFullYear()} ${esc(site.brand.legalName)}. Alle Rechte vorbehalten.</p>
      <p>${esc(site.brand.claim)}</p>
    </div>`)}
</footer>`;
}

/* ------------------------------------------------------------ Seitenaufbau */
export function homeBody() {
  return [
    header(""),
    `<main id="hauptinhalt">`,
    hero(),
    services(),
    process(),
    portfolio(),
    pricing(),
    testimonials(),
    faq(),
    contact(),
    `</main>`,
    footer(""),
  ].join("\n");
}

export function legalBody(title: string, updated: string, sections: string) {
  return [
    header("index.html"),
    `<main id="hauptinhalt">
      <article class="relative pt-32 pb-24 sm:pt-40">
        <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)]"></div>
        ${container(
          `<a href="index.html" class="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">${icons.arrowRight("size-4 rotate-180")}Zurück zur Startseite</a>
          <h1 class="mt-6 text-3xl font-semibold sm:text-4xl">${esc(title)}</h1>
          <p class="mt-3 text-sm text-muted">Stand: ${esc(updated)}</p>
          <div class="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-muted">${sections}</div>`,
          "relative max-w-3xl",
        )}
      </article>
    </main>`,
    footer("index.html"),
  ].join("\n");
}

export { site };
