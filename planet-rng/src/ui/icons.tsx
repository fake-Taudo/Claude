// Flat vector icon set (24x24, currentColor). Consistent across platforms, unlike emoji.
import type { JSX } from 'preact';

const P: Record<string, JSX.Element> = {
  bag: (
    <>
      <path d="M6 8h12l1 12H5L6 8Z" fill="currentColor" opacity=".25" />
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5C6.5 4 9.5 4 12 5.5v14c-2.5-1.5-5.5-1.5-8 0v-14Z" fill="currentColor" opacity=".25" />
      <path d="M4 5.5C6.5 4 9.5 4 12 5.5v14c-2.5-1.5-5.5-1.5-8 0v-14Z" />
      <path d="M20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0v-14Z" />
    </>
  ),
  shop: (
    <>
      <path d="M4 9h16v11H4z" fill="currentColor" opacity=".25" />
      <path d="M4 9h16v11H4zM3 9l2-5h14l2 5" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  anvil: (
    <>
      <path d="M3 7h13c0 3 2 4 5 4-1 2-4 3-7 3v2l3 3H6l3-3v-2C6 14 3 11 3 7Z" fill="currentColor" opacity=".25" />
      <path d="M3 7h13c0 3 2 4 5 4-1 2-4 3-7 3v2l3 3H6l3-3v-2C6 14 3 11 3 7Z" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      <path d="M7.5 15h9l1.6 3a1 1 0 0 1-.9 1.5H6.8a1 1 0 0 1-.9-1.5L7.5 15Z" fill="currentColor" opacity=".5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3Z" fill="currentColor" opacity=".3" />
      <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3Z" />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />
    </>
  ),
  rebirth: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity=".35" />
      <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" />
      <path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8" fill="currentColor" opacity=".2" />
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4Z" />
      <path d="M6 4a2 2 0 0 0-2 2v2h2M10 9h5M10 13h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8l1.6 2.3 2.7-.7.6 2.7 2.6 1-.9 2.6 1.8 2.1-2.2 1.7.3 2.8-2.8.3-1.3 2.5-2.4-1.4-2.4 1.4-1.3-2.5-2.8-.3.3-2.8-2.2-1.7 1.8-2.1-.9-2.6 2.6-1 .6-2.7 2.7.7L12 2.8Z" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="currentColor" opacity=".3" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9.5v5" />
    </>
  ),
  clover: (
    <>
      <path d="M12 12c-4-1-6-3-4.5-5.5S12 6 12 8c0-2 3-4 4.5-1.5S16 11 12 12Zm0 0c-1 4-3 6-5.5 4.5S6 12 8 12c-2 0-4-3-1.5-4.5" fill="currentColor" opacity=".3" />
      <path d="M12 12C8 11 6 9 7.5 6.5S12 6 12 8c0-2 3-4 4.5-1.5S16 11 12 12Zm0 0c4 1 6 3 4.5 5.5S12 18 12 16c0 2-3 4-4.5 1.5S8 13 12 12Zm0 0 1.5 8" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 5 13.5h6L10 22l9-12h-6.5L13 2Z" fill="currentColor" opacity=".3" />
      <path d="M13 2 5 13.5h6L10 22l9-12h-6.5L13 2Z" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" opacity=".2" />
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
  starFill: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" opacity=".3" />
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  auto: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M10 9l5 3-5 3V9Z" fill="currentColor" />
    </>
  ),
  quick: (
    <>
      <path d="M4 6l7 6-7 6V6Z" fill="currentColor" opacity=".4" />
      <path d="M4 6l7 6-7 6V6ZM12 6l7 6-7 6V6Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" opacity=".35" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="currentColor" opacity=".3" />
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </>
  ),
  amulet: (
    <>
      <path d="M5 3c0 5 3 7 7 8 4-1 7-3 7-8" />
      <path d="M12 11l4.5 4.5L12 21l-4.5-5.5L12 11Z" fill="currentColor" opacity=".35" />
      <path d="M12 11l4.5 4.5L12 21l-4.5-5.5L12 11Z" />
    </>
  ),
  hourglass: (
    <>
      <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />
      <path d="M9.5 19h5l-2.5-3-2.5 3Z" fill="currentColor" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" fill="currentColor" opacity=".5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  gauntlet: (
    <>
      <path d="M7 21v-6L5 9.5a1.4 1.4 0 0 1 2.6-1L9 11V4.5a1.4 1.4 0 0 1 2.8 0V10V3.5a1.4 1.4 0 0 1 2.8 0V10V5a1.4 1.4 0 0 1 2.8 0v9c0 3-1.5 5-3.4 7H7Z" fill="currentColor" opacity=".3" />
      <path d="M7 21v-6L5 9.5a1.4 1.4 0 0 1 2.6-1L9 11V4.5a1.4 1.4 0 0 1 2.8 0V10V3.5a1.4 1.4 0 0 1 2.8 0V10V5a1.4 1.4 0 0 1 2.8 0v9c0 3-1.5 5-3.4 7H7Z" />
    </>
  ),
  starburst: (
    <>
      <path d="m12 2 2 6.5L20.5 6 17 12l3.5 6-6.5-2.5L12 22l-2-6.5L3.5 18 7 12 3.5 6 10 8.5 12 2Z" fill="currentColor" opacity=".3" />
      <path d="m12 2 2 6.5L20.5 6 17 12l3.5 6-6.5-2.5L12 22l-2-6.5L3.5 18 7 12 3.5 6 10 8.5 12 2Z" />
    </>
  ),
  meteor: (
    <>
      <circle cx="15.5" cy="15.5" r="4.5" fill="currentColor" opacity=".35" />
      <circle cx="15.5" cy="15.5" r="4.5" />
      <path d="M3 3l9 9M7 3l6 6M3 7l6 6" />
    </>
  ),
  fog: <path d="M4 8h12M7 12h13M3 16h11M9 20h9" />,
  snow: <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" />,
  crystal: (
    <>
      <path d="m12 2 6 6-6 14L6 8l6-6Z" fill="currentColor" opacity=".3" />
      <path d="m12 2 6 6-6 14L6 8l6-6ZM6 8h12M12 2v20" />
    </>
  ),
  blackhole: (
    <>
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill="currentColor" opacity=".3" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  volume: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4V9Z" fill="currentColor" opacity=".3" />
      <path d="M4 9h4l5-4v14l-5-4H4V9ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  mute: <path d="M4 9h4l5-4v14l-5-4H4V9ZM17 9l5 6M22 9l-5 6" />,
  fullscreen: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  planet: (
    <>
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity=".35" />
      <circle cx="12" cy="12" r="6" />
      <ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-20 12 12)" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />,
  upload: <path d="M12 21V9M7 14l5-5 5 5M4 4h16" />,
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <path d="M6 10h1M10 10h1M14 10h1M18 10h0M7 14h10" />
    </>
  ),
  feed: <path d="M4 6h16M4 12h10M4 18h13" />,
  potion: (
    <>
      <path d="M10 3h4M10.5 3v4.5a6.5 6.5 0 1 0 3 0V3" />
      <path d="M6.5 14a5.5 5.5 0 0 0 11 0Z" fill="currentColor" opacity=".55" />
    </>
  ),
  tutorial: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5" />
    </>
  ),
};

export type IconName = keyof typeof P | string;

export function Icon({ name, size = 22, class: cls, stroke = 2 }: { name: IconName; size?: number; class?: string; stroke?: number }) {
  return (
    <svg
      class={`icon${cls ? ` ${cls}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {P[name] ?? P.sparkles}
    </svg>
  );
}
