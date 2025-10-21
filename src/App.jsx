import { useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import MapView from "./components/MapView.jsx";
import ServiceStatusPanel from "./components/ServiceStatusPanel.jsx";
import FavoritesPanel from "./components/FavoritesPanel.jsx";
import AlertsPanel from "./components/AlertsPanel.jsx";
import AccessibilityPanel from "./components/AccessibilityPanel.jsx";
import UserPreferencesPanel from "./components/UserPreferencesPanel.jsx";
import TransitMetrics from "./components/TransitMetrics.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import { mockData } from "./data/mockData.js";
import "./styles/app.css";

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState(
    mockData.supportedLanguages[0]
  );
  const [selectedRoute, setSelectedRoute] = useState(
    mockData.routes[0].routeId
  );
  const [selectedStationId, setSelectedStationId] = useState(
    mockData.routes[0].stationIds[0]
  );

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
    (item) => item.stationId === selectedStationId
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
              stations={localizedStations}
              vehicles={mockData.vehicles}
              selectedRoute={selectedRoute}
              selectedStation={station}
              onSelectRoute={setSelectedRoute}
              onSelectStation={setSelectedStationId}
            />
          </div>

          <TransitMetrics metrics={mockData.metrics} />
        </section>

        <aside className="secondary-panel">
          <ServiceStatusPanel statuses={serviceSummary} />
          <FavoritesPanel favorites={routeFavorites} />
          <AlertsPanel alerts={activeAlerts} />
          <AccessibilityPanel
            accessibility={mockData.stationAccessibility.filter(
              (item) => item.stationId === selectedStationId
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
