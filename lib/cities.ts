import { cacheLife } from "next/cache";
import type { City } from "@/types/trip";

const BASE_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// Server-only: called from Server Components with `use cache`.
// City list is stable data — cache it for the lifetime of a deployment.
export async function getCities(): Promise<City[]> {
  "use cache";
  cacheLife("max");
  const res = await fetch(`${BASE_URL}/cities`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  const data = await res.json();
  return data.cities as City[];
}
