"use client";

import { useState } from "react";
import type { TripResponse } from "@/types/trip";
import DayCard from "./DayCard";

interface Props {
  data: TripResponse;
}

export default function ItineraryView({ data }: Props) {
  const [activeDay, setActiveDay] = useState(1);
  const currentDay = data.itinerary.find((d) => d.day === activeDay) ?? data.itinerary[0];

  return (
    <div className="space-y-4">
      {/* Trip summary */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✈️</span>
          <span className="font-bold text-brand-800 text-sm">{data.city} · {data.total_days}天行程</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
      </div>

      {/* Day tabs — horizontal scroll */}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="flex gap-2 pb-1">
          {data.itinerary.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeDay === day.day
                  ? "bg-brand-800 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              <span className="block text-xs opacity-70">
                {day.date.slice(5).replace("-", "/")}
              </span>
              第{day.day}天
            </button>
          ))}
        </div>
      </div>

      {/* Active day card */}
      {currentDay && <DayCard day={currentDay} />}
    </div>
  );
}
