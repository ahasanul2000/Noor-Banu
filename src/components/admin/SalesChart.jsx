"use client";

import { useState } from "react";
import { taka } from "@/lib/admin/format";

const dayLabel = (iso, opts) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

/** Daily sales, last 14 days: one series, so one colour and no legend (the card title names it). */
export function SalesChart({ days }) {
    const [active, setActive] = useState(null);
    if (days.every((d) => d.total === 0)) {
        return (
            <div className="h-52 flex items-center justify-center rounded-xl border border-dashed border-stone-200 text-sm text-stone-500">
                No sales in the last 14 days.
            </div>
        );
    }
    const max = Math.max(1, ...days.map((d) => d.total));
    // A rounded axis maximum so the gridlines land on readable amounts.
    const step = 10 ** Math.max(0, Math.floor(Math.log10(max)));
    const top = Math.ceil(max / step) * step;
    const ticks = [top, top / 2, 0];

    return (
        <div>
            <div className="relative h-52 pl-14">
                {/* Recessive gridlines + y labels */}
                {ticks.map((t) => (
                    <div key={t} className="absolute left-14 right-0 border-t border-stone-100" style={{ bottom: `${(t / top) * 100}%` }}>
                        <span className="absolute -left-14 -translate-y-1/2 w-12 text-right text-[11px] text-stone-400 tabular-nums">
                            {t >= 1000 ? `${Math.round(t / 100) / 10}k` : t}
                        </span>
                    </div>
                ))}

                <div className="absolute inset-0 left-14 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
                    {days.map((d, i) => {
                        const h = (d.total / top) * 100;
                        return (
                            // Hit target is the full column, larger than the bar itself.
                            <button
                                key={d.date}
                                type="button"
                                className="relative flex-1 h-full flex items-end justify-center group focus:outline-none"
                                onMouseEnter={() => setActive(i)}
                                onFocus={() => setActive(i)}
                                onBlur={() => setActive(null)}
                                aria-label={`${dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}: ${taka(d.total)}, ${d.orders} orders`}
                            >
                                <span
                                    className={`block w-full max-w-7 rounded-t-[4px] transition-colors ${
                                        active === i ? "bg-[#996515]" : "bg-[#064E3B]"
                                    } ${d.total === 0 ? "opacity-0" : ""}`}
                                    style={{ height: `${Math.max(h, d.total > 0 ? 1.5 : 0)}%` }}
                                />
                                {active === i && (
                                    <span
                                        role="tooltip"
                                        className={`pointer-events-none absolute z-10 bottom-full mb-2 w-max rounded-lg bg-stone-900 px-3 py-2 text-left text-xs text-white shadow-lg ${
                                            i < 3 ? "left-0" : i > days.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                                        }`}
                                        style={{ bottom: `calc(${Math.max(h, 0)}% + 6px)` }}
                                    >
                                        <span className="block text-stone-300">{dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                                        <span className="block font-bold text-sm tabular-nums">{taka(d.total)}</span>
                                        <span className="block text-stone-300">{d.orders} {d.orders === 1 ? "order" : "orders"}</span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* x labels: every other day keeps them from colliding */}
            <div className="flex gap-[2px] pl-14 mt-2">
                {days.map((d, i) => (
                    <span key={d.date} className="flex-1 text-center text-[10px] text-stone-400 tabular-nums">
                        {i % 2 === 0 || i === days.length - 1 ? dayLabel(d.date, { day: "numeric", month: "short" }) : ""}
                    </span>
                ))}
            </div>

            {/* Table view for screen readers */}
            <table className="sr-only">
                <caption>Daily sales, last 14 days</caption>
                <thead><tr><th>Day</th><th>Sales</th><th>Orders</th></tr></thead>
                <tbody>
                    {days.map((d) => (
                        <tr key={d.date}><td>{d.date}</td><td>{taka(d.total)}</td><td>{d.orders}</td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
