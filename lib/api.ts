import type { City, TripRequest, TripResponse } from "@/types/trip";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getCities(): Promise<City[]> {
  const res = await fetch(`${BASE_URL}/cities`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return data.cities as City[];
}

export async function planTrip(req: TripRequest): Promise<TripResponse> {
  const res = await fetch(`${BASE_URL}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail ?? "规划失败，请稍后再试");
  }
  return res.json() as Promise<TripResponse>;
}
