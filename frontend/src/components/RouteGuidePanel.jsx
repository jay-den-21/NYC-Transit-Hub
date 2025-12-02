import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAllStops, fetchStationVehicles } from "../api/mtaApi.js";

const formatDistance = (distanceInDegrees) => {
  const distanceKm = distanceInDegrees * 111; // Approx conversion for NYC latitudes
  if (!Number.isFinite(distanceKm)) return "—";
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const emptyVehicles = { upcoming: [], past: [] };

function RouteGuidePanel({ onSelectStation, selectedStationId }) {
  const [stops, setStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopsError, setStopsError] = useState("");

  const [fromLat, setFromLat] = useState("");
  const [fromLon, setFromLon] = useState("");
  const [toLat, setToLat] = useState("");
  const [toLon, setToLon] = useState("");
  const [formError, setFormError] = useState("");

  const [routeStops, setRouteStops] = useState({ start: null, end: null });
  const [vehicleState, setVehicleState] = useState({
    loading: false,
    error: "",
    data: emptyVehicles
  });

  useEffect(() => {
    const loadStops = async () => {
      setLoadingStops(true);
      setStopsError("");
      try {
        const fetchedStops = await fetchAllStops();
        setStops(fetchedStops);
      } catch (error) {
        setStopsError(error.message || "Unable to load station catalog");
      } finally {
        setLoadingStops(false);
      }
    };

    loadStops();
  }, []);

  const findNearestStop = (lat, lon) => {
    return stops.reduce(
      (nearest, stop) => {
        const distance = Math.hypot(lat - stop.lat, lon - stop.lon);
        if (distance < nearest.distance) {
          return { stop, distance };
        }
        return nearest;
      },
      { stop: null, distance: Number.POSITIVE_INFINITY }
    );
  };

  const loadStationVehicles = async (stationId) => {
    setVehicleState({ loading: true, error: "", data: emptyVehicles });
    try {
      const data = await fetchStationVehicles(stationId);
      const vehicles = {
        upcoming: Array.isArray(data?.upcoming) ? data.upcoming : [],
        past: Array.isArray(data?.past) ? data.past : []
      };
      setVehicleState({ loading: false, error: "", data: vehicles });
    } catch (error) {
      setVehicleState({
        loading: false,
        error: error.message || "Unable to load trains for this station",
        data: emptyVehicles
      });
    }
  };

  const handlePlanRoute = async (event) => {
    event.preventDefault();
    setFormError("");

    const startLat = Number(fromLat);
    const startLon = Number(fromLon);
    const destLat = Number(toLat);
    const destLon = Number(toLon);

    const coordsAreValid =
      Number.isFinite(startLat) &&
      Number.isFinite(startLon) &&
      Number.isFinite(destLat) &&
      Number.isFinite(destLon);

    if (!coordsAreValid) {
      setFormError("Enter valid numeric latitude/longitude for both points.");
      return;
    }

    if (!stops.length) {
      setFormError("Stops have not loaded yet. Try again in a moment.");
      return;
    }

    const startResult = findNearestStop(startLat, startLon);
    const endResult = findNearestStop(destLat, destLon);

    if (!startResult.stop || !endResult.stop) {
      setFormError("Could not match nearby stations. Check your coordinates.");
      return;
    }

    setRouteStops({ start: startResult, end: endResult });
    onSelectStation({
      stationId: startResult.stop.id,
      localizedName: startResult.stop.name
    });
    await loadStationVehicles(startResult.stop.id);
  };

  const activeStartName = routeStops.start?.stop?.name ?? "Start station";

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <h3>Route Guide</h3>
          <span>Pick nearest stations from typed coordinates</span>
        </div>
        {selectedStationId && <span className="tag">On map</span>}
      </div>

      <form className="route-guide" onSubmit={handlePlanRoute}>
        <div className="route-guide__row">
          <div className="route-guide__field">
            <label htmlFor="from-lat">From latitude</label>
            <input
              id="from-lat"
              name="from-lat"
              type="number"
              step="any"
              placeholder="40.75"
              value={fromLat}
              onChange={(event) => setFromLat(event.target.value)}
            />
          </div>
          <div className="route-guide__field">
            <label htmlFor="from-lon">From longitude</label>
            <input
              id="from-lon"
              name="from-lon"
              type="number"
              step="any"
              placeholder="-73.99"
              value={fromLon}
              onChange={(event) => setFromLon(event.target.value)}
            />
          </div>
        </div>

        <div className="route-guide__row">
          <div className="route-guide__field">
            <label htmlFor="to-lat">To latitude</label>
            <input
              id="to-lat"
              name="to-lat"
              type="number"
              step="any"
              placeholder="40.70"
              value={toLat}
              onChange={(event) => setToLat(event.target.value)}
            />
          </div>
          <div className="route-guide__field">
            <label htmlFor="to-lon">To longitude</label>
            <input
              id="to-lon"
              name="to-lon"
              type="number"
              step="any"
              placeholder="-73.98"
              value={toLon}
              onChange={(event) => setToLon(event.target.value)}
            />
          </div>
        </div>

        {stopsError && <div className="info-banner error">{stopsError}</div>}
        {formError && <div className="info-banner error">{formError}</div>}
        {!formError && !stopsError && loadingStops && (
          <div className="info-banner">Loading station catalog…</div>
        )}

        <div className="route-guide__actions">
          <button type="submit" className="route-guide__submit" disabled={loadingStops}>
            Find nearest stations
          </button>
          <span className="route-guide__hint">
            Uses Euclidean distance on stop coordinates to snap to the closest stations.
          </span>
        </div>
      </form>

      {routeStops.start?.stop && routeStops.end?.stop && (
        <div className="route-guide__results">
          <div className="route-guide__station">
            <div>
              <p className="route-guide__label">Origin</p>
              <p className="route-guide__name">{routeStops.start.stop.name}</p>
              <p className="route-guide__meta">
                {routeStops.start.stop.id} • {formatDistance(routeStops.start.distance)} away
              </p>
            </div>
            <span className="badge badge-route-a">Start</span>
          </div>
          <div className="route-guide__station">
            <div>
              <p className="route-guide__label">Destination</p>
              <p className="route-guide__name">{routeStops.end.stop.name}</p>
              <p className="route-guide__meta">
                {routeStops.end.stop.id} • {formatDistance(routeStops.end.distance)} away
              </p>
            </div>
            <span className="badge badge-route-e">End</span>
          </div>
        </div>
      )}

      <div className="route-guide__vehicles">
        <div className="route-guide__vehicles-header">
          <h4>Subways leaving {activeStartName}</h4>
          {routeStops.start?.stop && (
            <span className="route-guide__meta route-guide__meta--light">
              Showing trains at your origin station
            </span>
          )}
        </div>

        {vehicleState.error && <div className="info-banner error">{vehicleState.error}</div>}
        {vehicleState.loading && <div className="info-banner">Loading station activity…</div>}

        {!vehicleState.loading &&
          !vehicleState.error &&
          routeStops.start?.stop &&
          vehicleState.data.upcoming.length === 0 &&
          vehicleState.data.past.length === 0 && (
            <div className="info-banner">
              No recent vehicles for this station in the last few minutes.
            </div>
          )}

        <div className="route-guide__vehicle-grid">
          {vehicleState.data.upcoming.map((vehicle) => (
            <div key={`${vehicle.label}-${vehicle.route_id}`} className="vehicle-card">
              <div className="vehicle-header">
                <span className="badge badge-neutral">{vehicle.route_id ?? "?"}</span>
                <span className="vehicle-status">{vehicle.current_status ?? "Approaching"}</span>
              </div>
              <p className="vehicle-stop">
                Toward {vehicle.stop_name ?? vehicle.stop_id ?? "Unknown stop"}
              </p>
              <p className="vehicle-time">
                Last seen {formatTime(vehicle.vehicle_timestamp)} • Trip {vehicle.label ?? "?"}
              </p>
            </div>
          ))}
        </div>

        {vehicleState.data.past.length > 0 && (
          <div className="route-guide__past">
            <p className="route-guide__label">Recently departed</p>
            <div className="route-guide__vehicle-grid">
              {vehicleState.data.past.map((vehicle) => (
                <div key={`${vehicle.label}-${vehicle.stop_id}-past`} className="vehicle-card">
                  <div className="vehicle-header">
                    <span className="badge badge-neutral">{vehicle.route_id ?? "?"}</span>
                    <span className="vehicle-status">Departed</span>
                  </div>
                  <p className="vehicle-stop">
                    Toward {vehicle.stop_name ?? vehicle.stop_id ?? "Unknown stop"}
                  </p>
                  <p className="vehicle-time">
                    Last seen {formatTime(vehicle.vehicle_timestamp)} • Trip {vehicle.label ?? "?"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

RouteGuidePanel.propTypes = {
  onSelectStation: PropTypes.func,
  selectedStationId: PropTypes.string
};

RouteGuidePanel.defaultProps = {
  onSelectStation: () => {},
  selectedStationId: ""
};

export default RouteGuidePanel;
