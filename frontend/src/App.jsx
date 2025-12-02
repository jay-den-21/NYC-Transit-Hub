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
import PreferencesPage from "./components/PreferencesPage.jsx";
import {
  fetchFeedList,
  fetchFeedSnapshot,
  fetchAccessibility,
  fetchRouteShapes,
  fetchRouteStops
} from "./api/mtaApi.js";
import { mockData } from "./data/mockData.js";
import "./styles/app.css";

const normalizeRoute = (pathValue) => {
  if (pathValue.startsWith("/guidance")) return "guidance";
  if (pathValue.startsWith("/preferences")) return "preferences";
  return "home";
};

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
  const [activeRoute, setActiveRoute] = useState(
    normalizeRoute(window.location.pathname || "/")
  );
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [displayedRoutes, setDisplayedRoutes] = useState(mockData.routes);
  const [routeShapes, setRouteShapes] = useState({});
  const [routeStopsMap, setRouteStopsMap] = useState({});
  const [stopRoutesMap, setStopRoutesMap] = useState({});
  const emptyAccessibility = useMemo(
    () => ({ currentOutages: [], upcomingOutages: [], equipments: [] }),
    []
  );
  const [accessibilityState, setAccessibilityState] = useState({
    data: emptyAccessibility,
    loading: false,
    error: ""
  });
  const [guidanceOutages, setGuidanceOutages] = useState({
    start: [],
    end: [],
    loading: false,
    error: ""
  });

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

  const stationTranslations = useMemo(() => {
    const map = new Map();
    mockData.stationNames.forEach((entry) => {
      const key = `${entry.stationId}:${entry.languageCode}`;
      map.set(key, entry.localizedName);
    });
    return map;
  }, []);

  const activeAlerts = mockData.alerts
    .filter((alert) => alert.routeId === selectedRoute)
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

  const serviceSummary = mockData.serviceStatus.filter(
    (status) => status.routeId === selectedRoute
  );

  useEffect(() => {
    const handlePopState = () => {
      setActiveRoute(normalizeRoute(window.location.pathname || "/"));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  useEffect(() => {
    fetchRouteShapes()
      .then((shapes) => setRouteShapes(shapes))
      .catch(() => setRouteShapes({}));
    fetchRouteStops()
      .then(({ routeStops, stopRoutes }) => {
        setRouteStopsMap(routeStops);
        setStopRoutesMap(stopRoutes);
      })
      .catch(() => {
        setRouteStopsMap({});
        setStopRoutesMap({});
      });
  }, []);

  useEffect(() => {
    const stationId = selectedStation?.stationId;
    if (!stationId) {
      setAccessibilityState({ data: emptyAccessibility, loading: false, error: "" });
      return;
    }
    setAccessibilityState((prev) => ({ ...prev, loading: true, error: "" }));
    fetchAccessibility(stationId)
      .then((data) => setAccessibilityState({ data, loading: false, error: "" }))
      .catch((error) =>
        setAccessibilityState({
          data: emptyAccessibility,
          loading: false,
          error: error.message || "Unable to load accessibility data"
        })
      );
  }, [selectedStation, emptyAccessibility]);

  useEffect(() => {
    const startId = plannedRoute?.start?.id;
    const endId = plannedRoute?.end?.id;
    if (!startId && !endId) {
      setGuidanceOutages({ start: [], end: [], loading: false, error: "" });
      return;
    }
    setGuidanceOutages((prev) => ({ ...prev, loading: true, error: "" }));
    Promise.all([
      startId ? fetchAccessibility(startId) : Promise.resolve(emptyAccessibility),
      endId ? fetchAccessibility(endId) : Promise.resolve(emptyAccessibility)
    ])
      .then(([startData, endData]) => {
        setGuidanceOutages({
          start: startData.currentOutages || [],
          end: endData.currentOutages || [],
          loading: false,
          error: ""
        });
      })
      .catch((error) =>
        setGuidanceOutages({
          start: [],
          end: [],
          loading: false,
          error: error.message || "Unable to check accessibility for your route"
        })
      );
  }, [plannedRoute, emptyAccessibility]);

  useEffect(() => {
    if (feedSnapshot?.routes?.length) {
      const incoming = feedSnapshot.routes.map((routeId) => {
        const preset = mockData.routes.find((r) => r.routeId === routeId);
        const geometry = routeShapes[routeId] || preset?.geometry || [];
        const stationIds = routeStopsMap[routeId] || preset?.stationIds || [];
        return (
          preset || {
            routeId,
            shortName: `${routeId} Line`,
            longName: `${routeId} Line`,
            geometry,
            stationIds
          }
        );
      });
      setDisplayedRoutes(incoming);
      if (!incoming.find((r) => r.routeId === selectedRoute)) {
        setSelectedRoute(incoming[0]?.routeId || "");
      }
    } else {
      const routesWithShapes = mockData.routes.map((r) => ({
        ...r,
        geometry: r.geometry && r.geometry.length ? r.geometry : routeShapes[r.routeId] || [],
        stationIds: r.stationIds && r.stationIds.length ? r.stationIds : routeStopsMap[r.routeId] || []
      }));
      setDisplayedRoutes(routesWithShapes);
      if (!mockData.routes.find((r) => r.routeId === selectedRoute)) {
        setSelectedRoute(mockData.routes[0]?.routeId || "");
      }
    }
  }, [feedSnapshot, selectedRoute, routeShapes, routeStopsMap]);

  const navigateTo = useCallback((routeKey) => {
    const path =
      routeKey === "guidance"
        ? "/guidance"
        : routeKey === "preferences"
          ? "/preferences"
          : "/";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      setActiveRoute(normalizeRoute(path));
    } else {
      setActiveRoute(normalizeRoute(path));
    }
  }, []);

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

  const navTabs = (
    <div className="nav-tabs">
      <button
        type="button"
        className={`nav-tab ${activeRoute === "home" ? "active" : ""}`}
        onClick={() => navigateTo("home")}
      >
        Map
      </button>
      <button
        type="button"
        className={`nav-tab ${activeRoute === "guidance" ? "active" : ""}`}
        onClick={() => navigateTo("guidance")}
      >
        Guidance
      </button>
      <button
        type="button"
        className={`nav-tab ${activeRoute === "preferences" ? "active" : ""}`}
        onClick={() => navigateTo("preferences")}
      >
        Preferences
      </button>
    </div>
  );

  if (activeRoute === "guidance") {
    return (
      <div className="app-shell">
        <Header />
        {navTabs}
        <main className="app-main guidance-main">
          <section className="map-card guidance-card">
            <RouteGuidePanel
              selectedStationId={selectedStation?.stationId ?? ""}
              onSelectStation={setSelectedStation}
              onPlanRoute={setPlannedRoute}
              guidanceStatus={guidanceOutages}
            />
          </section>
        </main>
      </div>
    );
  }

  if (activeRoute === "preferences") {
    return (
      <div className="app-shell">
        <Header />
        {navTabs}
        <main className="app-main guidance-main">
          <section className="map-card guidance-card">
            <PreferencesPage
              languages={mockData.supportedLanguages}
              homeStations={localizedStations}
              initialLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      {navTabs}

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
              routes={displayedRoutes}
              vehicles={mapVehicles}
              selectedRoute={selectedRoute}
              selectedStation={station}
              plannedRoute={plannedRoute}
              selectedLanguage={selectedLanguage}
              stopRoutesMap={stopRoutesMap}
              stationTranslations={stationTranslations}
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
            station={station}
            accessibilityState={accessibilityState}
            guidance={
              plannedRoute
                ? {
                    start: plannedRoute.start,
                    end: plannedRoute.end,
                    startOutages: guidanceOutages.start,
                    endOutages: guidanceOutages.end,
                    loading: guidanceOutages.loading,
                    error: guidanceOutages.error
                  }
                : null
            }
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
