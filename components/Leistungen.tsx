import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { iconMap, CheckIcon } from "@/components/ui/Icons";

export function Leistungen() {
  const { services } = site;

  return (
    <Section id="leistungen" labelledBy="leistungen-title">
      <Container>
        <SectionHeading
          id="leistungen-title"
          eyebrow={services.eyebrow}
          title={services.title}
          subtitle={services.subtitle}
        />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.items.map((service, index) => {
            const Icon = iconMap[service.icon];

            return (
              <li key={service.title}>
                <Reveal delay={index * 0.08} className="h-full">
                  <article className="card-surface group relative h-full overflow-hidden rounded-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                    {/* Dezenter Schimmer beim Hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />

                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 to-accent2/20 text-accent ring-1 ring-white/10">
                      <Icon className="size-5.5" />
                    </span>

                    <h3 className="mt-5 text-lg font-semibold">{service.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">
                      {service.description}
                    </p>

                    <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-5">
                      {service.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
