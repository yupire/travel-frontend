"use client";

import { useState } from "react";
import type { DayPlan, SpotPlan, FoodRec } from "@/types/trip";

const WEATHER_ICONS: Record<string, string> = {
  sunny: "☀️",
  partly_cloudy: "⛅",
  cloudy: "☁️",
  rainy: "🌧️",
};

const WEATHER_BG: Record<string, string> = {
  sunny: "bg-amber-50 border-amber-200 text-amber-800",
  partly_cloudy: "bg-sky-50 border-sky-200 text-sky-800",
  cloudy: "bg-gray-100 border-gray-200 text-gray-700",
  rainy: "bg-blue-50 border-blue-200 text-blue-800",
};

const TYPE_BADGE: Record<string, string> = {
  indoor: "bg-purple-100 text-purple-700",
  outdoor: "bg-green-100 text-green-700",
};

function FoodList({ foods }: { foods: FoodRec[] }) {
  return (
    <div className="mt-2.5 space-y-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">附近美食</p>
      {foods.map((f) => (
        <div key={f.id} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate block">{f.name}</span>
            <span className="text-xs text-gray-500">{f.cuisine} · ⭐ {f.rating}</span>
          </div>
          <div className="ml-2 flex flex-col items-end text-xs shrink-0">
            <span className="font-semibold text-orange-600">{f.price_range}</span>
            <span className="text-gray-400">{f.distance_m < 1000 ? `${f.distance_m}m` : `${(f.distance_m / 1000).toFixed(1)}km`}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpotItem({ spot, index }: { spot: SpotPlan; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Transport connector */}
      {spot.transport_from_prev && (
        <div className="flex items-center gap-2 my-2 px-1">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {spot.transport_from_prev.mode} · {spot.transport_from_prev.duration_min}分钟
            {spot.transport_from_prev.cost > 0 ? ` · ¥${spot.transport_from_prev.cost}` : ""}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Spot card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <button
          className="w-full text-left p-4"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-800 text-white flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base">{spot.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[spot.type] ?? "bg-gray-100 text-gray-600"}`}>
                  {spot.type === "indoor" ? "室内" : "户外"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{spot.description}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span>⏱ {spot.duration_min >= 60 ? `${Math.floor(spot.duration_min / 60)}h${spot.duration_min % 60 ? (spot.duration_min % 60) + "m" : ""}` : `${spot.duration_min}m`}</span>
                <span>🕐 {spot.open_time}</span>
                {spot.ticket > 0 ? <span>🎫 ¥{spot.ticket}</span> : <span>🆓 免票</span>}
              </div>
              {/* Tags */}
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {spot.tags.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
          </div>
        </button>

        {/* Expanded: nearby foods */}
        {expanded && spot.nearby_foods.length > 0 && (
          <div className="px-4 pb-4">
            <FoodList foods={spot.nearby_foods} />
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  day: DayPlan;
}

export default function DayCard({ day }: Props) {
  const wCls = WEATHER_BG[day.weather.condition] ?? WEATHER_BG.cloudy;
  const wIcon = WEATHER_ICONS[day.weather.condition] ?? "🌤️";

  return (
    <div className="space-y-3 pb-6">
      {/* Day header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-base">
            第{day.day}天 · {day.date}
          </h2>
        </div>
        {/* Weather badge */}
        <div className={`flex items-center gap-1.5 border rounded-xl px-3 py-1.5 text-sm font-semibold ${wCls}`}>
          <span className="text-base">{wIcon}</span>
          <span>{day.weather.temp_low}°-{day.weather.temp_high}°C</span>
        </div>
      </div>

      {/* Weather description */}
      <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
        {wIcon} {day.weather.description}
      </p>

      {/* Spots */}
      <div>
        {day.spots.map((spot, i) => (
          <SpotItem key={spot.id} spot={spot} index={i} />
        ))}
      </div>

      {/* Daily reasoning */}
      {day.reasoning && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-brand-700 mb-1.5">今日行程解析</p>
          <p className="text-sm text-gray-700 leading-relaxed italic">{day.reasoning}</p>
        </div>
      )}
    </div>
  );
}
