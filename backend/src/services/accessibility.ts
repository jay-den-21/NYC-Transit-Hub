const currentUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json";
const upcomingUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_upcoming.json";
const equipmentUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_equipments.json";

const API_KEY = process.env.MTA_API_KEY;

type AnyRecord = Record<string, any>;

const fetchFeed = async (url: string): Promise<any[]> => {
  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Accessibility feed failed: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const matchesStation = (item: AnyRecord, stationId?: string): boolean => {
  if (!stationId) return true;
  const id = stationId.toLowerCase();
  const fields = [
    "stop_id",
    "stopId",
    "gtfs_stop_id",
    "station_id",
    "stationId",
    "complex_id",
    "complexId"
  ];
  return fields.some((key) => {
    const value = item?.[key];
    if (!value) return false;
    return String(value).toLowerCase().includes(id);
  });
};

const normalize = (item: AnyRecord, index: number) => {
  const station =
    item.station_name ||
    item.station ||
    item.stop_name ||
    item.stopId ||
    item.stop_id ||
    "Unknown station";

  const equipment =
    item.equipment_description ||
    item.equipment ||
    item.unit_name ||
    item.device_type ||
    "Accessibility equipment";

  const status =
    item.status ||
    item.equipment_status ||
    item.outage_status ||
    item.action ||
    "Outage";

  const details =
    item.reason ||
    item.notes ||
    item.description ||
    item.outage_reason ||
    item.comments ||
    "";

  const id =
    item.equipmentno ||
    item.equipment_id ||
    item.unit_id ||
    item.device_id ||
    item.id ||
    `outage-${index}`;

  return {
    id: String(id),
    station: String(station),
    equipment: String(equipment),
    status: String(status),
    details: String(details || "")
  };
};

export const fetchAccessibilityData = async (stationId?: string) => {
  const [current, upcoming, equipment] = await Promise.all([
    fetchFeed(currentUrl),
    fetchFeed(upcomingUrl),
    fetchFeed(equipmentUrl)
  ]);

  const filterAndNormalize = (items: any[]) =>
    items
      .filter((item) => matchesStation(item, stationId))
      .map((item, index) => normalize(item, index));

  return {
    currentOutages: filterAndNormalize(current),
    upcomingOutages: filterAndNormalize(upcoming),
    equipments: filterAndNormalize(equipment)
  };
};
