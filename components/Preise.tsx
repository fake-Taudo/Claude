import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/ui/Icons";

export function Preise() {
  const { pricing } = site;

  return (
    <Section id="preise" soft labelledBy="preise-title">
      <Container>
        <SectionHeading
          id="preise-title"
          eyebrow={pricing.eyebrow}
          title={pricing.title}
          subtitle={pricing.subtitle}
        />

        <ul className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {pricing.plans.map((plan, index) => {
            const featured = plan.featured;

            return (
              <li key={plan.name} className={featured ? "lg:-mt-4" : ""}>
                <Reveal delay={index * 0.08} className="h-full">
                  <article
                    className={`relative flex h-full flex-col rounded-card p-7 transition-all duration-300 ${
                      featured
                        ? "border border-accent/40 bg-gradient-to-b from-accent/[0.12] to-[var(--surface)] shadow-[0_30px_80px_-40px_rgba(139,92,246,0.9)]"
                        : "card-surface hover:-translate-y-1 hover:border-white/20"
                    }`}
                  >
                    {featured && "badge" in plan && plan.badge ? (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-accent2 px-4 py-1.5 text-xs font-medium whitespace-nowrap text-accent-contrast shadow-lg">
                        {plan.badge}
                      </span>
                    ) : null}

                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1.5 min-h-[2.75rem] text-sm text-muted">{plan.description}</p>

                    <p className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted">{plan.priceNote}</span>
                    </p>

                    <ul className="mt-7 flex flex-1 flex-col gap-3 border-t border-line pt-7">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                          <span className="text-muted">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={plan.cta.href}
                      className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
                        featured
                          ? "bg-gradient-to-r from-accent to-accent2 text-accent-contrast shadow-[0_14px_35px_-14px_rgba(139,92,246,0.95)] hover:brightness-110"
                          : "border border-line-strong bg-white/[0.04] text-fg hover:border-white/30 hover:bg-white/[0.08]"
                      }`}
                    >
                      {plan.cta.label}
                    </a>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal delay={0.1}>
          <p className="mt-8 text-center text-sm text-muted">{pricing.note}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
