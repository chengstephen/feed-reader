"use client";

import { DAYS_SHOWN } from "@/lib/constants";

interface DateTabsProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  countsByDay: number[];
}

function getDayLabel(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function DateTabs({ selectedIndex, onSelect, countsByDay }: DateTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {Array.from({ length: DAYS_SHOWN }, (_, i) => {
        const count = countsByDay[i] ?? 0;
        const isActive = selectedIndex === i;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
            }`}
          >
            <span>{getDayLabel(i)}</span>
            {count > 0 && (
              <span
                className={`mt-0.5 text-xs font-normal ${
                  isActive ? "text-indigo-200" : "text-gray-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
