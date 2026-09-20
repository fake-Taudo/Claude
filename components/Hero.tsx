import { site } from "@/content/site";
import { Container } from "@/components/ui/Section";
import { GradientMesh } from "@/components/ui/GradientMesh";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/Icons";

/**
 * Der Hero wird bewusst ohne JavaScript animiert (reines CSS).
 * Dadurch erscheint die Headline sofort beim ersten Rendern – das
 * verbessert Ladezeit-Messwerte (LCP) spürbar.
 * Die Einblend-Reihenfolge steuert `animationDelay`.
 */
export function Hero() {
  const { hero } = site;

  return (
    <section
      id="start"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16 sm:pt-32"
    >
      <GradientMesh />

      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <p
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-muted backdrop-blur sm:text-sm"
            style={{ animationDelay: "40ms" }}
          >
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {hero.badge}
          </p>

          {/* Headline */}
          <h1
            id="hero-title"
            className="animate-fade-up mt-7 max-w-5xl text-4xl leading-[1.08] font-semibold sm:text-6xl lg:text-[4.25rem]"
            style={{ animationDelay: "120ms" }}
          >
            {hero.headlineBefore}
            {/* Auf größeren Bildschirmen bewusst umbrechen */}
            <br className="hidden sm:block" />{" "}
            <span className="text-gradient">{hero.headlineHighlight}</span>{" "}
            {hero.headlineAfter}
          </h1>

          {/* Subline */}
          <p
            className="animate-fade-up mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "220ms" }}
          >
            {hero.subline}
          </p>

          {/* Buttons */}
          <div
            className="animate-fade-up mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
            style={{ animationDelay: "320ms" }}
          >
            <a
              href={hero.primaryCta.href}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-4 text-base font-medium text-accent-contrast shadow-[0_18px_45px_-15px_rgba(139,92,246,0.95)] transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
            >
              {hero.primaryCta.label}
              <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-white/[0.04] px-7 py-4 text-base font-medium text-fg backdrop-blur transition-all duration-300 hover:border-white/30 hover:bg-white/[0.09] active:scale-[0.98]"
            >
              {hero.secondaryCta.label}
            </a>
          </div>

          {/* Vertrauenszeile */}
          <ul
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted"
            style={{ animationDelay: "420ms" }}
          >
            {hero.trustLine.map((entry) => (
              <li key={entry} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-accent" />
                {entry}
              </li>
            ))}
          </ul>

          {/* Kennzahlen */}
          <dl
            className="animate-fade-up mt-14 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4"
            style={{ animationDelay: "520ms" }}
          >
            {hero.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse items-center gap-1 bg-[var(--bg)]/70 px-4 py-6 text-center backdrop-blur"
              >
                <dt className="text-xs text-muted sm:text-sm">{stat.label}</dt>
                <dd className="text-2xl font-semibold sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
