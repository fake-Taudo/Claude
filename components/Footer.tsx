import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Section";
import { LogoMark } from "@/components/ui/Icons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-soft">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div className="flex max-w-sm flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold tracking-tight"
            >
              <LogoMark className="size-8" />
              {site.brand.name}
            </Link>
            <p className="text-sm leading-relaxed text-muted">
              {site.footer.description}
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {site.footer.social.map((entry) => (
                <li key={entry.label}>
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-fg"
                  >
                    {entry.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {site.footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-fg"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-fg"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line py-7 text-xs text-muted sm:flex-row">
          <p>
            © {year} {site.brand.legalName}. Alle Rechte vorbehalten.
          </p>
          <p>{site.brand.claim}</p>
        </div>
      </Container>
    </footer>
  );
}
