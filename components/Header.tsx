"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Section";
import { LogoMark, MenuIcon, CloseIcon } from "@/components/ui/Icons";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollen sperren, solange das mobile Menü offen ist
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-[var(--bg)]/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
            aria-label={`${site.brand.name} – Startseite`}
          >
            <LogoMark className="size-8 shrink-0" />
            <span className="text-[0.975rem]">{site.brand.name}</span>
          </Link>

          <nav aria-label="Hauptnavigation" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={site.hero.primaryCta.href}
              className="hidden rounded-full bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-medium text-accent-contrast shadow-[0_10px_30px_-12px_rgba(139,92,246,0.9)] transition-all duration-300 hover:brightness-110 active:scale-[0.98] sm:inline-flex"
            >
              {site.hero.primaryCta.label}
            </a>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              className="inline-flex size-10 items-center justify-center rounded-full border border-line text-fg transition-colors hover:bg-white/[0.06] md:hidden"
            >
              {open ? (
                <CloseIcon className="size-5" />
              ) : (
                <MenuIcon className="size-5" />
              )}
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-line bg-[var(--bg)]/95 backdrop-blur-xl md:hidden"
          >
            <Container>
              <nav aria-label="Mobile Navigation" className="py-4">
                <ul className="flex flex-col">
                  {site.nav.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-2 py-3.5 text-base text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={site.hero.primaryCta.href}
                  onClick={() => setOpen(false)}
                  className="mt-3 mb-2 flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent2 px-6 py-3.5 text-base font-medium text-accent-contrast"
                >
                  {site.hero.primaryCta.label}
                </a>
              </nav>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
