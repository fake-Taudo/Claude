import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Ablauf() {
  const { process } = site;

  return (
    <Section id="ablauf" soft labelledBy="ablauf-title">
      <Container>
        <SectionHeading
          id="ablauf-title"
          eyebrow={process.eyebrow}
          title={process.title}
          subtitle={process.subtitle}
        />

        <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Verbindungslinie auf großen Bildschirmen */}
          <span
            aria-hidden
            className="absolute top-[3.25rem] right-6 left-6 hidden h-px bg-gradient-to-r from-accent/40 via-accent2/40 to-transparent lg:block"
          />

          {process.steps.map((step, index) => (
            <li key={step.title} className="relative">
              <Reveal delay={index * 0.08} className="h-full">
                <article className="card-surface h-full rounded-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-semibold text-accent-contrast">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                      {step.duration}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
