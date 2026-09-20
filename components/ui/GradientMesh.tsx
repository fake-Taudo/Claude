/**
 * Animierter Hintergrund aus weichen Farbflächen (Gradient-Mesh).
 * Reines CSS – keine Bilder, kein JavaScript, dadurch sehr performant.
 */
export function GradientMesh({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Farbflächen */}
      <div className="absolute -top-[22rem] left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_65%)] opacity-30 blur-3xl animate-mesh-a" />
      <div className="absolute top-[12%] -left-[14rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,var(--accent-2)_0%,transparent_65%)] opacity-25 blur-3xl animate-mesh-b" />
      <div className="absolute -right-[12rem] bottom-[-8rem] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_65%)] opacity-20 blur-3xl animate-mesh-c" />

      {/* Feines Raster */}
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent_75%)]" />

      {/* Weicher Übergang zum nächsten Abschnitt */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--bg)]" />
    </div>
  );
}
