interface GeocodeResult {
  label: string;
  address: string;
  lat: number;
  lon: number;
  source: string;
}

export const geocodePlaces = async (query: string, limit = 5): Promise<GeocodeResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", trimmed);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "nyc-transit-hub/0.1.0 (transit guidance)"
    },
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as any[];
  return data
    .map((item) => ({
      label: item.display_name as string,
      address: item.display_name as string,
      lat: Number(item.lat),
      lon: Number(item.lon),
      source: "nominatim"
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
};

export type { GeocodeResult };
