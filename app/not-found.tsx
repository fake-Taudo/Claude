import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { GradientMesh } from "@/components/ui/GradientMesh";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden pt-24">
      <GradientMesh />
      <Container className="relative text-center">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">
          Fehler 404
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Diese Seite gibt es nicht.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Vielleicht wurde sie verschoben oder der Link hat sich vertippt. Zurück
          zur Startseite geht es hier entlang.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-3.5 text-base font-medium text-accent-contrast transition-all hover:brightness-110"
        >
          Zur Startseite
        </Link>
      </Container>
    </section>
  );
}
