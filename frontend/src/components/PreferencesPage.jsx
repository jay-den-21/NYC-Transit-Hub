import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAllStops } from "../api/mtaApi.js";

function PreferencesPage({ languages, homeStations, initialLanguage, onLanguageChange }) {
  const [unit, setUnit] = useState("imperial");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [language, setLanguage] = useState(initialLanguage);
  const [homeStation, setHomeStation] = useState(homeStations[0]);
  const [alerts, setAlerts] = useState({
    service: true,
    accessibility: true,
    crowding: false
  });
  const [stops, setStops] = useState(homeStations);

  useEffect(() => {
    fetchAllStops()
      .then((data) => setStops(data))
      .catch(() => setStops(homeStations));
  }, [homeStations]);

  const handleLanguageChange = (code) => {
    const found = languages.find((l) => l.code === code);
    if (found) {
      setLanguage(found);
      onLanguageChange(found);
    }
  };

  return (
    <div className="preferences-page">
      <header className="preferences-header">
        <div>
          <h3>User Preferences</h3>
          <p>Set your defaults for measurements, language, and alerts.</p>
        </div>
      </header>

      <div className="preferences-grid">
        <div className="panel-card">
          <h4>Units &amp; Time</h4>
          <div className="preferences-row">
            <span className="preferences-label">Units</span>
            <div className="toggle-group">
              <button
                type="button"
                className={unit === "imperial" ? "toggle active" : "toggle"}
                onClick={() => setUnit("imperial")}
              >
                Imperial
              </button>
              <button
                type="button"
                className={unit === "metric" ? "toggle active" : "toggle"}
                onClick={() => setUnit("metric")}
              >
                Metric
              </button>
            </div>
          </div>
          <div className="preferences-row">
            <span className="preferences-label">Time format</span>
            <div className="toggle-group">
              <button
                type="button"
                className={timeFormat === "12h" ? "toggle active" : "toggle"}
                onClick={() => setTimeFormat("12h")}
              >
                12-hour (AM/PM)
              </button>
              <button
                type="button"
                className={timeFormat === "24h" ? "toggle active" : "toggle"}
                onClick={() => setTimeFormat("24h")}
              >
                24-hour
              </button>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h4>Language</h4>
          <div className="preferences-row">
            <span className="preferences-label">Default language</span>
            <select
              className="preferences-select"
              value={language.code}
              onChange={(event) => handleLanguageChange(event.target.value)}
            >
              {languages.map((lng) => (
                <option key={lng.code} value={lng.code}>
                  {lng.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel-card">
          <h4>Home station</h4>
          <p className="preferences-hint">Used for quick arrivals, alerts, and routing.</p>
          <select
            className="preferences-select"
            value={homeStation?.id || ""}
            onChange={(event) => {
              const next = stops.find((s) => s.id === event.target.value);
              setHomeStation(next || homeStations[0]);
            }}
          >
            {stops.map((stop) => (
              <option key={stop.id} value={stop.id}>
                {stop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-card">
          <h4>Alerts</h4>
          <p className="preferences-hint">Choose what notifications you care about.</p>
          <div className="preferences-toggle-list">
            <label className="preferences-toggle">
              <input
                type="checkbox"
                checked={alerts.service}
                onChange={() => setAlerts((prev) => ({ ...prev, service: !prev.service }))}
              />
              Service changes
            </label>
            <label className="preferences-toggle">
              <input
                type="checkbox"
                checked={alerts.accessibility}
                onChange={() =>
                  setAlerts((prev) => ({ ...prev, accessibility: !prev.accessibility }))
                }
              />
              Accessibility outages
            </label>
            <label className="preferences-toggle">
              <input
                type="checkbox"
                checked={alerts.crowding}
                onChange={() => setAlerts((prev) => ({ ...prev, crowding: !prev.crowding }))}
              />
              Crowding updates
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

PreferencesPage.propTypes = {
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  homeStations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  initialLanguage: PropTypes.shape({
    code: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onLanguageChange: PropTypes.func.isRequired
};

export default PreferencesPage;
