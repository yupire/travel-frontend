export interface City {
  id: string;
  name: string;
  name_en: string;
  country: string;
}

export interface WeatherInfo {
  condition: "sunny" | "partly_cloudy" | "cloudy" | "rainy";
  temp_high: number;
  temp_low: number;
  description: string;
}

export interface FoodRec {
  id: string;
  name: string;
  cuisine: string;
  price_range: string;
  rating: number;
  distance_m: number;
}

export interface TransportInfo {
  mode: string;
  duration_min: number;
  cost: number;
  distance_km: number;
}

export interface SpotPlan {
  id: string;
  name: string;
  lat: number;
  lng: number;
  duration_min: number;
  open_time: string;
  ticket: number;
  type: "indoor" | "outdoor";
  tags: string[];
  description: string;
  nearby_foods: FoodRec[];
  transport_from_prev: TransportInfo | null;
}

export interface DayPlan {
  day: number;
  date: string;
  weather: WeatherInfo;
  spots: SpotPlan[];
  reasoning: string;
}

export interface TripResponse {
  city: string;
  start_date: string;
  end_date: string;
  total_days: number;
  itinerary: DayPlan[];
  summary: string;
}

export interface TripRequest {
  city: string;
  start_date: string;
  end_date: string;
}
