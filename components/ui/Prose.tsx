import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { ArrowRightIcon } from "@/components/ui/Icons";

/** Layout für Textseiten wie Impressum und Datenschutz */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="relative pt-32 pb-24 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)]"
      />

      <Container className="relative max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
          Zurück zur Startseite
        </Link>

        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Stand: {updated}</p>

        <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-muted">
          {children}
        </div>
      </Container>
    </article>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}
