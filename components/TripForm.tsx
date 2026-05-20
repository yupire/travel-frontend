"use client";

import { useState } from "react";
import { planTrip } from "@/lib/api";
import type { City, TripResponse } from "@/types/trip";
import ItineraryView from "./ItineraryView";

interface Props {
  cities: City[];
}

const today = new Date().toISOString().split("T")[0];
const threeDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

export default function TripForm({ cities }: Props) {
  const [city, setCity] = useState(cities[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(threeDaysLater);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripResponse | null>(null);

  const cityLabel = cities.find((c) => c.id === city);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !startDate || !endDate) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await planTrip({ city, start_date: startDate, end_date: endDate });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "规划失败，请检查后端服务是否启动");
    } finally {
      setLoading(false);
    }
  }

  if (cities.length === 0) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        无法连接后端服务，请先启动 FastAPI（<code>uvicorn main:app --reload</code>）
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* City select */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
            目的地
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.country}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              出发日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              返回日期
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-800 text-white font-semibold rounded-xl py-3.5 text-base active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "AI规划中…" : `规划${cityLabel ? cityLabel.name : ""}行程`}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-700 rounded-full animate-spin" />
          <p className="text-sm">AI正在规划您的专属行程…</p>
          <p className="text-xs text-gray-400">查询天气 · 匹配路线 · 推荐美食</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && <ItineraryView data={result} />}
    </div>
  );
}
