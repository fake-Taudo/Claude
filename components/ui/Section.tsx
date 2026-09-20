import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
  soft = false,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Leicht abgesetzter Hintergrund für abwechselnde Sektionen */
  soft?: boolean;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative scroll-mt-24 py-20 sm:py-28 ${
        soft ? "bg-bg-soft" : "bg-bg"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted uppercase">
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-gradient-to-r from-accent to-accent2"
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <Reveal>
      <div className={`flex flex-col ${alignment} gap-4`}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          id={id}
          className="max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl md:text-[2.75rem]"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
