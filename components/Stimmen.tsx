import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { QuoteIcon, StarIcon } from "@/components/ui/Icons";

export function Stimmen() {
  const { testimonials } = site;

  return (
    <Section id="stimmen" labelledBy="stimmen-title">
      <Container>
        <SectionHeading
          id="stimmen-title"
          eyebrow={testimonials.eyebrow}
          title={testimonials.title}
          subtitle={testimonials.subtitle}
        />

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.items.map((testimonial, index) => (
            <li key={testimonial.name}>
              <Reveal delay={index * 0.08} className="h-full">
                <figure className="card-surface relative flex h-full flex-col rounded-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <QuoteIcon className="size-8 text-accent/35" />

                  <blockquote className="mt-4 flex-1 text-[0.975rem] leading-relaxed text-fg/90">
                    „{testimonial.quote}“
                  </blockquote>

                  <div
                    role="img"
                    aria-label="5 von 5 Sternen"
                    className="mt-6 flex gap-0.5 text-accent"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className="size-4" />
                    ))}
                  </div>

                  <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-5">
                    <span
                      aria-hidden
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-accent2/25 text-sm font-semibold text-fg ring-1 ring-white/10"
                    >
                      {testimonial.initials}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{testimonial.name}</span>
                      <span className="text-xs text-muted">{testimonial.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
