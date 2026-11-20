"use client";

import { useId, useMemo, useState } from "react";

/**
 * One-series daily bar chart. Single hue (validated against the dark surface), thin bars with a
 * 2px gap and rounded data-ends on a zero baseline, recessive grid, hover/focus tooltip, and a
 * table view so no value is reachable by hover alone.
 */
export interface BarPoint {
  day: string; // YYYY-MM-DD
  value: number;
}

const BAR = "#22a596";
const BAR_ACTIVE = "#3fe6cf";
const W = 640;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 22, left: 40 };

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * pow >= max) return step * pow;
  return 10 * pow;
}

function dateLabel(day: string, long = false) {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en", { day: "numeric", month: "short", ...(long ? { weekday: "short" } : {}), timeZone: "UTC" });
}

/** Top-rounded bar anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function BarChart({ title, unit, data }: { title: string; unit: string; data: BarPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const id = useId();
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.value))), [data]);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.max(2, slot - 2); // 2px surface gap between bars
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const total = data.reduce((s, d) => s + d.value, 0);
  const point = active !== null ? data[active] : null;

  return (
    <figure className="panel p-4 sm:p-5 space-y-3" aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <figcaption id={`${id}-t`} className="text-sm font-medium">
          {title}
        </figcaption>
        <p className="text-xs text-text-dim">
          {full.format(total)} {unit} in {data.length} days
        </p>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-dim">No data yet.</p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label={`${title}: ${full.format(total)} ${unit} over ${data.length} days`}
            onPointerLeave={() => setActive(null)}
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - box.left) / box.width) * W - PAD.left;
              const i = Math.floor(x / slot);
              setActive(i >= 0 && i < data.length ? i : null);
            }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-border" strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="fill-text-faint" fontSize={11}>
                  {compact.format(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const h = (d.value / max) * innerH;
              return (
                <path
                  key={d.day}
                  d={barPath(PAD.left + i * slot + 1, PAD.top + innerH - h, barW, h)}
                  fill={active === i ? BAR_ACTIVE : BAR}
                />
              );
            })}
            {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
              <text
                key={i}
                x={PAD.left + i * slot + slot / 2}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                className="fill-text-faint"
                fontSize={11}
              >
                {dateLabel(data[i]!.day)}
              </text>
            ))}
          </svg>
          {point && active !== null && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-bg-raised px-2.5 py-1.5 text-xs shadow-panel whitespace-nowrap"
              style={{ left: `${((PAD.left + active * slot + slot / 2) / W) * 100}%` }}
            >
              <span className="text-text-dim">{dateLabel(point.day, true)}</span>{" "}
              <span className="ml-2 font-medium text-text">
                {full.format(point.value)} {unit}
              </span>
            </div>
          )}
        </div>
      )}

      {data.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs text-text-dim hover:text-text">
            {showTable ? "Hide table" : "Show as table"}
          </button>
          {showTable && (
            <table className="mt-2 w-full text-xs">
              <thead>
                <tr className="text-left text-text-dim">
                  <th className="py-1 font-medium">Day</th>
                  <th className="py-1 font-medium text-right">{unit}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.day} className="border-t border-border-subtle">
                    <td className="py-1">{dateLabel(d.day, true)}</td>
                    <td className="py-1 text-right tabular-nums">{full.format(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </figure>
  );
}
