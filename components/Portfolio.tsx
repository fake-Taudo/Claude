import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Mockup } from "@/components/ui/Mockup";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Portfolio() {
  const { portfolio } = site;

  return (
    <Section id="projekte" labelledBy="projekte-title">
      <Container>
        <SectionHeading
          id="projekte-title"
          eyebrow={portfolio.eyebrow}
          title={portfolio.title}
          subtitle={portfolio.subtitle}
        />

        <ul className="mt-14 grid gap-6 md:grid-cols-2">
          {portfolio.items.map((project, index) => (
            <li key={project.title}>
              <Reveal delay={index * 0.08} className="h-full">
                <article className="card-surface group h-full overflow-hidden rounded-card p-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="transition-transform duration-500 group-hover:scale-[1.03]">
                      <Mockup variant={project.mockup} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 pt-5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium tracking-wide text-accent uppercase">
                        {project.category}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-line" />
                    </div>

                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {project.description}
                    </p>

                    <ul className="mt-1 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-muted"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={project.href}
                      className="mt-3 inline-flex w-fit items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
                    >
                      Ähnliches Projekt anfragen
                      <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
