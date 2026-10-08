import { useEffect, useRef, useState } from "react";

function EnergyCoreVisual() {
  const containerRef = useRef(null);
  const disposeRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cancelled = false;
    let started = false;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          observer.disconnect();
          try {
            const { createEnergyCoreScene } = await import(
              "../three/energyCoreScene"
            );

            if (cancelled) return;

            disposeRef.current = createEnergyCoreScene(container, {
              reducedMotion: prefersReducedMotion,
            });
          } catch (error) {
            console.error(
              "EnergyCore scene failed to initialize:",
              error
            );
            if (!cancelled) {
              setFailed(true);
            }
          }
        }
      },
      { rootMargin: "400px 0px", threshold: 0 }
    );

    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, []);

  if (failed) {
    return (
      <div
        className="energy-core-fallback"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="energy-core-visual"
      aria-hidden="true"
    />
  );
}

export default EnergyCoreVisual;
