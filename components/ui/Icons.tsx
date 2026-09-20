import type { SVGProps } from "react";
import type { IconName } from "@/content/site";

type Props = SVGProps<SVGSVGElement>;

const base: Props = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function DesignIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8.5A5.5 5.5 0 0 1 8.5 3h7A5.5 5.5 0 0 1 21 8.5v7a5.5 5.5 0 0 1-5.5 5.5h-7A5.5 5.5 0 0 1 3 15.5z" />
      <path d="M3 9h18" />
      <circle cx="6.5" cy="6" r=".6" fill="currentColor" stroke="none" />
      <path d="M8 13.5h4M8 17h7" />
    </svg>
  );
}

export function CodeIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="m8.5 8.5-4 3.5 4 3.5M15.5 8.5l4 3.5-4 3.5M13.5 5 10.5 19" />
    </svg>
  );
}

export function SearchIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  );
}

export function SupportIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2ZM20 13v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Z" />
      <path d="M17 18v.5a2.5 2.5 0 0 1-2.5 2.5H12" />
    </svg>
  );
}

export function RocketIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c3.5 2 5.5 5.5 5.5 9.5L14 16h-4l-3.5-3.5C6.5 8.5 8.5 5 12 3Z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M10 16c-1.5 1-2 2.6-2 5 2.4 0 4-.5 5-2M8.5 12.5 6 14M15.5 12.5 18 14" />
    </svg>
  );
}

export function ShieldIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function CheckIcon(props: Props) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ArrowRightIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function PlusIcon(props: Props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MailIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 8 7.1 4.6a2 2 0 0 0 2.2 0L20 8" />
    </svg>
  );
}

export function PhoneIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6L16.5 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

export function QuoteIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M9.5 6C6.9 7.3 5.3 9.6 5.3 12.8c0 2.9 1.7 4.9 4 4.9 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.2-3.1-3.2-.3 0-.7 0-.9.1.3-1.4 1.4-2.6 3-3.5zm9 0c-2.6 1.3-4.2 3.6-4.2 6.8 0 2.9 1.7 4.9 4 4.9 2 0 3.5-1.5 3.5-3.4 0-1.9-1.3-3.2-3.1-3.2-.3 0-.7 0-.9.1.3-1.4 1.4-2.6 3-3.5z" />
    </svg>
  );
}

export function StarIcon(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </svg>
  );
}

export function MenuIcon(props: Props) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: Props) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LogoMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect width="32" height="32" rx="9" fill="url(#logo-gradient)" />
      <path
        d="M11 21.5V10.5h2.6v4.6l4-4.6H21l-4.4 5 4.7 6h-3.3l-3.3-4.3-1.1 1.2v3.1z"
        fill="white"
      />
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Icon-Auflösung für die Leistungs-Karten (Namen siehe content/site.ts) */
export const iconMap: Record<IconName, (props: Props) => React.JSX.Element> = {
  design: DesignIcon,
  code: CodeIcon,
  rocket: RocketIcon,
  support: SupportIcon,
  search: SearchIcon,
  shield: ShieldIcon,
};
