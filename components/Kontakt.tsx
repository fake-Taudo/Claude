"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/ui/Icons";

type Status = "idle" | "pending" | "success" | "error";

const fieldClass =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-fg placeholder:text-muted/60 transition-colors duration-200 hover:border-white/20 focus:border-accent focus:outline-none";

export function Kontakt() {
  const { contact } = site;
  const { form } = contact;
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");

    // Referenz sichern: nach dem await ist `event.currentTarget` bereits null
    const formElement = event.currentTarget;
    const payload = Object.fromEntries(new FormData(formElement).entries());

    try {
      const response = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      setStatus("success");
      formElement.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <Section id="kontakt" labelledBy="kontakt-title" className="overflow-hidden">
      {/* Dezenter Lichtschein hinter der Sektion */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]"
      />

      <Container className="relative">
        <SectionHeading
          id="kontakt-title"
          eyebrow={contact.eyebrow}
          title={contact.title}
          subtitle={contact.subtitle}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Kontaktdaten */}
          <Reveal className="h-full">
            <div className="card-surface flex h-full flex-col gap-7 rounded-card p-7">
              <div className="flex flex-col gap-3">
                <a
                  href={`mailto:${contact.email}`}
                  className="group flex items-center gap-3 text-sm transition-colors hover:text-accent"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-accent ring-1 ring-white/10">
                    <MailIcon className="size-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-muted">E-Mail</span>
                    <span className="font-medium">{contact.email}</span>
                  </span>
                </a>

                {contact.phones.map((entry) => (
                  <a
                    key={entry.number}
                    href={`tel:${entry.number.replace(/\s/g, "")}`}
                    className="group flex items-center gap-3 text-sm transition-colors hover:text-accent"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-accent ring-1 ring-white/10">
                      <PhoneIcon className="size-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs text-muted">{entry.label}</span>
                      <span className="font-medium">{entry.number}</span>
                    </span>
                  </a>
                ))}
              </div>

              <ul className="flex flex-col gap-3 border-t border-line pt-7">
                {contact.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Formular */}
          <Reveal delay={0.1}>
            <div className="card-surface rounded-card p-7">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex min-h-[22rem] flex-col items-center justify-center gap-3 text-center"
                  role="status"
                >
                  <span className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 text-accent-contrast">
                    <CheckIcon className="size-7" />
                  </span>
                  <h3 className="text-xl font-semibold">{form.successTitle}</h3>
                  <p className="max-w-sm text-sm leading-relaxed text-muted">
                    {form.successText}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Honeypot gegen Spam-Bots – für Menschen unsichtbar */}
                  <div aria-hidden className="hidden">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        {form.nameLabel}
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder={form.namePlaceholder}
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        {form.emailLabel}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={form.emailPlaceholder}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="company" className="text-sm font-medium">
                        {form.companyLabel}
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        placeholder={form.companyPlaceholder}
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="budget" className="text-sm font-medium">
                        {form.budgetLabel}
                      </label>
                      <select
                        id="budget"
                        name="budget"
                        defaultValue={form.budgetOptions[0]}
                        className={fieldClass}
                      >
                        {form.budgetOptions.map((option) => (
                          <option key={option} value={option} className="bg-[var(--surface)]">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      {form.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder={form.messagePlaceholder}
                      className={`${fieldClass} resize-y`}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      required
                      className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                    />
                    <label htmlFor="privacy" className="text-sm leading-relaxed text-muted">
                      {form.privacyLabel}{" "}
                      <Link href="/datenschutz" className="text-fg underline underline-offset-4 hover:text-accent">
                        Datenschutzerklärung
                      </Link>
                    </label>
                  </div>

                  {status === "error" ? (
                    <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {form.errorText}{" "}
                      <a href={`mailto:${contact.email}`} className="underline underline-offset-4">
                        {contact.email}
                      </a>
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === "pending"}
                    className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-4 text-base font-medium text-accent-contrast shadow-[0_16px_40px_-15px_rgba(139,92,246,0.95)] transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "pending" ? form.submitPendingLabel : form.submitLabel}
                    {status === "pending" ? null : (
                      <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
