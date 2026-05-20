import { getCities } from "@/lib/api";
import TripForm from "@/components/TripForm";
import type { City } from "@/types/trip";

export const dynamic = "force-dynamic";

export default async function Page() {
  let cities: City[] = [];
  try {
    cities = await getCities();
  } catch {
    // Backend not running yet — form will show an error state
  }

  return (
    <main className="flex flex-col flex-1">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-brand-800 text-white px-5 py-4 shadow-md">
        <h1 className="text-lg font-bold tracking-wide">AI旅行规划助手</h1>
        <p className="text-xs text-brand-100 mt-0.5">智能行程 · 天气适配 · 美食推荐</p>
      </header>

      {/* Body */}
      <div className="flex-1 px-4 py-5">
        <TripForm cities={cities} />
      </div>
    </main>
  );
}
