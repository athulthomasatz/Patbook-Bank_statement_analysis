import React, { useEffect, useState } from "react";

export default function Footer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 5;
        return next > 20 ? 0 : next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const isRedTick = elapsed % 10 === 5;

  return (
    <footer className="mt-8 w-full border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
        <p className="font-mono text-sm tracking-wide text-slate-300">
          <span className="text-emerald-400">&gt;_</span> Crafted with 0s, 1s, and 100% pure Boolean logic // zero fluff <span className="mx-1 align-middle">⚙️</span>
        </p>
        <p className={`mt-1 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] ${isRedTick ? "text-red-300/80" : "text-emerald-300/80"}`}>
          <span className={`h-2.5 w-2.5 rounded-full animate-pulse ${isRedTick ? "bg-red-400" : "bg-emerald-400"}`} />
          Robotic mode: online
        </p>
        <p className="mt-2 font-mono text-sm text-slate-400">
          <a href="https://athulthomasatz.github.io/" target="_blank" rel="noopener noreferrer" className="ml-1 font-medium text-cyan-300 hover:text-cyan-200 hover:underline">Athul Thomas</a>
          <span className="mx-2">and</span>
          <a href="https://www.booleantechnologies.in/" target="_blank" rel="noopener noreferrer" className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline">Boolean technologies</a>
        </p>
      </div>
    </footer>
  );
}
