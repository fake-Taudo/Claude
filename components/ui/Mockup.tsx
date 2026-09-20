/**
 * Platzhalter-Mockups für den Portfolio-Bereich.
 * Rein per CSS gezeichnet – ersetze sie später durch echte Screenshots
 * (siehe README, Abschnitt "Bilder austauschen").
 */

type Variant = "browser" | "app" | "shop";

function Bar({ w, dim = false }: { w: string; dim?: boolean }) {
  return (
    <span
      className={`block h-2 rounded-full ${dim ? "bg-white/10" : "bg-white/20"}`}
      style={{ width: w }}
    />
  );
}

function BrowserContent() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="relative flex flex-[1.4] flex-col justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-br from-accent/40 to-accent2/25 px-4">
        <span className="block h-2.5 w-3/5 rounded-full bg-white/45" />
        <span className="block h-2 w-2/5 rounded-full bg-white/25" />
        <span className="mt-1 block h-6 w-20 rounded-full bg-white/80" />
      </div>
      <div className="flex flex-1 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-1 flex-col justify-end gap-1.5 rounded-md bg-white/[0.06] p-2.5"
          >
            <span className="block size-4 rounded-md bg-accent/50" />
            <Bar w="80%" dim />
            <Bar w="55%" dim />
          </div>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <div className="flex h-full gap-3 p-4">
      <div className="flex w-1/4 flex-col gap-2 rounded-lg bg-white/[0.05] p-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2.5 rounded-full ${i === 0 ? "bg-accent/70" : "bg-white/12"}`}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 rounded-lg bg-white/[0.07]" />
          <div className="h-12 rounded-lg bg-gradient-to-br from-accent2/40 to-accent/25" />
        </div>
        <div className="flex flex-1 items-end gap-1.5 rounded-lg bg-white/[0.05] p-3">
          {[40, 65, 35, 80, 55, 95, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-accent/70 to-accent2/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ShopContent() {
  return (
    <div className="grid h-full grid-cols-2 gap-3 p-4">
      <div className="rounded-lg bg-gradient-to-br from-accent2/40 to-transparent" />
      <div className="flex flex-col justify-center gap-2">
        <Bar w="85%" />
        <Bar w="60%" dim />
        <Bar w="70%" dim />
        <span className="mt-2 block h-7 w-24 rounded-full bg-gradient-to-r from-accent to-accent2" />
      </div>
      <div className="col-span-2 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-end gap-1.5 rounded-md bg-white/[0.06] p-2.5"
          >
            <Bar w="70%" dim />
            <Bar w="45%" dim />
          </div>
        ))}
      </div>
    </div>
  );
}

const contents: Record<Variant, () => React.JSX.Element> = {
  browser: BrowserContent,
  app: AppContent,
  shop: ShopContent,
};

export function Mockup({ variant = "browser" }: { variant?: Variant }) {
  const Content = contents[variant];

  return (
    <div
      aria-hidden
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-[#0d0d16]"
    >
      {/* Browserleiste */}
      <div className="flex items-center gap-1.5 border-b border-line bg-white/[0.03] px-3 py-2.5">
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/10" />
        <span className="ml-2 h-3 w-1/3 rounded-full bg-white/[0.07]" />
      </div>

      <div className="h-[calc(100%-2.6rem)]">
        <Content />
      </div>
    </div>
  );
}
