"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** ISO date (race day) plus optional HH:MM:SS UTC time */
  date: string;
  time?: string | null;
  className?: string;
}

function remaining(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

export function Countdown({ date, time, className }: CountdownProps) {
  const target = new Date(time ? `${date}T${time}Z` : `${date}T12:00:00Z`);
  const [parts, setParts] = useState(() => remaining(target));

  useEffect(() => {
    const id = setInterval(() => setParts(remaining(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  if (!parts) {
    return <p className={className}>Lights out!</p>;
  }

  const cells: [number, string][] = [
    [parts.days, "days"],
    [parts.hours, "hrs"],
    [parts.minutes, "min"],
    [parts.seconds, "sec"],
  ];

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      {cells.map(([value, unit]) => (
        <div
          key={unit}
          className="flex min-w-14 flex-col items-center rounded-lg rounded-tr-none border border-white/10 bg-black/40 px-2 py-1.5"
        >
          <span className="font-numeric text-xl font-bold tabular-nums sm:text-2xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-widest text-muted">{unit}</span>
        </div>
      ))}
    </div>
  );
}
