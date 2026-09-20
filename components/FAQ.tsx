"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PlusIcon } from "@/components/ui/Icons";

export function FAQ() {
  const { faq } = site;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <Section id="faq" soft labelledBy="faq-title">
      <Container>
        <SectionHeading
          id="faq-title"
          eyebrow={faq.eyebrow}
          title={faq.title}
          subtitle={faq.subtitle}
        />

        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-3">
          {faq.items.map((entry, index) => {
            const isOpen = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <Reveal key={entry.question} delay={index * 0.05}>
                <div
                  className={`card-surface overflow-hidden rounded-2xl transition-colors duration-300 ${
                    isOpen ? "border-white/20" : "hover:border-white/15"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="text-base font-medium">{entry.question}</span>
                      <span
                        aria-hidden
                        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-fg transition-transform duration-300 ${
                          isOpen ? "rotate-45 border-accent/50 text-accent" : ""
                        }`}
                      >
                        <PlusIcon className="size-4" />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-sm leading-relaxed text-muted">
                          {entry.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
