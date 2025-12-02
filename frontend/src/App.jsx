import { useEffect, useMemo, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import MapView from "./components/MapView.jsx";
import ServiceStatusPanel from "./components/ServiceStatusPanel.jsx";
import FavoritesPanel from "./components/FavoritesPanel.jsx";
import AlertsPanel from "./components/AlertsPanel.jsx";
import AccessibilityPanel from "./components/AccessibilityPanel.jsx";
import RealtimeFeedPanel from "./components/RealtimeFeedPanel.jsx";
import UserPreferencesPanel from "./components/UserPreferencesPanel.jsx";
import TransitMetrics from "./components/TransitMetrics.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import RouteGuidePanel from "./components/RouteGuidePanel.jsx";
import { fetchFeedList, fetchFeedSnapshot } from "./api/mtaApi.js";
import { mockData } from "./data/mockData.js";
import "./styles/app.css";

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState(
    mockData.supportedLanguages[0]
  );
  const [selectedRoute, setSelectedRoute] = useState(
    mockData.routes[0].routeId
  );
  const [selectedStation, setSelectedStation] = useState(
    mockData.stations[0]
  );
  const [feedList, setFeedList] = useState([]);
  const [selectedFeedId, setSelectedFeedId] = useState("ace");
  const [feedSnapshot, setFeedSnapshot] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState("");

  const localizedStations = useMemo(() => {
    return mockData.stations.map((station) => {
      const translatedName =
        mockData.stationNames.find(
          (name) =>
            name.stationId === station.stationId &&
            name.languageCode === selectedLanguage.code
        )?.localizedName ?? station.nameDefault;
      return {
        ...station,
        localizedName: translatedName
      };
    });
  }, [selectedLanguage]);

  const station = localizedStations.find(
    (item) => item.stationId === selectedStation?.stationId
  );

  const routeFavorites = mockData.favorites.filter(
    (fav) => fav.routeId === selectedRoute
  );

  const activeAlerts = mockData.alerts
    .filter((alert) => alert.routeId === selectedRoute)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const serviceSummary = mockData.serviceStatus.filter(
    (status) => status.routeId === selectedRoute
  );

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const feeds = await fetchFeedList();
        setFeedList(feeds);
        if (!selectedFeedId && feeds.length > 0) {
          setSelectedFeedId(feeds[0].id);
        }
      } catch (error) {
        setFeedError(error.message || "Unable to load feeds");
      }
    };

    loadFeeds();
  }, []); 

  const loadSnapshot = useCallback(
    async (feedId) => {
      if (!feedId) return;

      setFeedLoading(true);
      setFeedError("");
      setFeedSnapshot(null);

      try {
        const snapshot = await fetchFeedSnapshot(feedId);
        setFeedSnapshot(snapshot);
      } catch (error) {
        setFeedError(error.message || "Unable to load realtime data");
      } finally {
        setFeedLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSnapshot(selectedFeedId);
  }, [selectedFeedId, loadSnapshot]);

  const liveVehicles = useMemo(() => {
    if (!feedSnapshot?.vehicles) return [];

    const toNumberOrNull = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    return feedSnapshot.vehicles
      .filter((vehicle) => {
        const lat = Number(vehicle.lat);
        const lon = Number(vehicle.lon);
        // Keep only plausible Northeast US bounds to avoid obviously bad coordinates
        return (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          lat >= 35 &&
          lat <= 45 &&
          lon <= -65 &&
          lon >= -82
        );
      })
      .map((vehicle) => {
        const lat = toNumberOrNull(vehicle.lat);
        const lon = toNumberOrNull(vehicle.lon);
        if (lat === null || lon === null) return null;

        return {
          vehicleId: vehicle.id,
          routeId: vehicle.routeId ?? "N/A",
          lat,
          lon,
          headsign: vehicle.label ?? vehicle.routeId ?? "Train",
          speed: vehicle.speedMph ?? 0,
          lastUpdate: vehicle.timestamp
            ? new Date(vehicle.timestamp).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit"
              })
            : "—",
          isEstimated: vehicle.isEstimatedPosition
        };
      })
      .filter(Boolean)
      // Prefer most recent items first
      .sort((a, b) => (b.lastUpdate || "").localeCompare(a.lastUpdate || ""))
      // Deduplicate by stop and route so we don't stack dozens in one spot
      .reduce((acc, v) => {
        const key = `${v.routeId}-${v.lat.toFixed(4)}-${v.lon.toFixed(4)}`;
        if (!acc.seen.has(key) && acc.items.length < 25) {
          acc.seen.add(key);
          acc.items.push(v);
        }
        return acc;
      }, { seen: new Set(), items: [] }).items;
  }, [feedSnapshot]);

  const mapVehicles =
    liveVehicles.length > 0
      ? liveVehicles
      : mockData.vehicles;
  const liveFeedName = feedSnapshot?.name ?? "";
  const liveUpdatedAt = feedSnapshot?.updatedAt ?? "";
  const liveVehicleCount = feedSnapshot?.vehicles?.length ?? 0;

  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <section className="primary-panel">
          <div className="map-card">
            <div className="card-header">
              <div>
                <h2>Interactive Map</h2>
                <p>Live view of the A, C, and E subway lines</p>
              </div>
              <LanguageSwitcher
                languages={mockData.supportedLanguages}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
              />
            </div>

            <MapView
              routes={mockData.routes}
              vehicles={mapVehicles}
              selectedRoute={selectedRoute}
              selectedStation={station}
              onSelectRoute={setSelectedRoute}
              onSelectStation={setSelectedStation}
              isLive={liveVehicles.length > 0}
              liveFeedName={liveFeedName}
              liveUpdatedAt={liveUpdatedAt}
              liveVehicleCount={liveVehicleCount}
            />
          </div>

          <TransitMetrics metrics={mockData.metrics} />
        </section>

        <aside className="secondary-panel">
          <RouteGuidePanel
            selectedStationId={selectedStation?.stationId ?? ""}
            onSelectStation={setSelectedStation}
          />
          <RealtimeFeedPanel
            feeds={feedList}
            selectedFeed={selectedFeedId}
            snapshot={feedSnapshot}
            loading={feedLoading}
            error={feedError}
            onSelectFeed={setSelectedFeedId}
            onRefresh={() => loadSnapshot(selectedFeedId)}
          />
          <ServiceStatusPanel statuses={serviceSummary} />
          <FavoritesPanel favorites={routeFavorites} />
          <AlertsPanel alerts={activeAlerts} />
          <AccessibilityPanel
            accessibility={mockData.stationAccessibility.filter(
              (item) => item.stationId === selectedStation?.stationId
            )}
          />
          <UserPreferencesPanel
            preferences={mockData.userPreference}
            selectedStation={station}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
