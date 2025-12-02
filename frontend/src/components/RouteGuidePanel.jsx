import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { fetchAllStops, fetchStationVehicles, geocodePlaces } from "../api/mtaApi.js";
import { useMemo } from "react";

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

function RouteGuidePanel({ onSelectStation, selectedStationId, onPlanRoute, guidanceStatus }) {
  const [stops, setStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopsError, setStopsError] = useState("");

  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromSelection, setFromSelection] = useState(null);
  const [toSelection, setToSelection] = useState(null);
  const [myLocation, setMyLocation] = useState({
    lat: null,
    lon: null,
    loading: false,
    error: ""
  });
  const [formError, setFormError] = useState("");

  const [routeStops, setRouteStops] = useState({ start: null, end: null });
  const [vehicleState, setVehicleState] = useState({
    loading: false,
    error: "",
    data: emptyVehicles
  });
  const [placeResults, setPlaceResults] = useState([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeError, setPlaceError] = useState("");

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
  useEffect(() => {
    const fetchPlaces = async () => {
      const query = toQuery.trim();
      if (query.length < 3 || toSelection) {
        setPlaceResults([]);
        setPlaceLoading(false);
        return;
      }
      setPlaceLoading(true);
      setPlaceError("");
      try {
        const results = await geocodePlaces(query);
        setPlaceResults(results);
      } catch (error) {
        setPlaceError(error.message || "Unable to search places right now.");
      } finally {
        setPlaceLoading(false);
      }
    };

    fetchPlaces();
    return undefined;
  }, [toQuery, toSelection]);

  const filterStops = (query) => {
    if (!query || query.length < 2) return [];
    const normalized = query.toLowerCase();
    return stops
      .filter(
        (stop) =>
          stop.name.toLowerCase().includes(normalized) ||
          stop.id.toLowerCase().includes(normalized)
      )
      .slice(0, 6);
  };

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

  const setCurrentLocation = () => {
    if (!navigator?.geolocation) {
      setMyLocation((prev) => ({ ...prev, error: "Geolocation not supported in this browser." }));
      return;
    }
    setMyLocation({ lat: null, lon: null, loading: true, error: "" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          loading: false,
          error: ""
        });
        setFromSelection(null);
        setFromQuery("Current location");
      },
      (error) => {
        setMyLocation({ lat: null, lon: null, loading: false, error: error.message });
      }
    );
  };

  const handlePlanRoute = async (event) => {
    event.preventDefault();
    setFormError("");
    setPlaceError("");

    if (!stops.length) {
      setFormError("Stops have not loaded yet. Try again in a moment.");
      return;
    }

    let startResult = null;
    let endResult = null;

    if (fromSelection) {
      startResult = { stop: fromSelection, distance: 0 };
    } else if (Number.isFinite(myLocation.lat) && Number.isFinite(myLocation.lon)) {
      startResult = findNearestStop(myLocation.lat, myLocation.lon);
    } else {
      setFormError("Pick an origin station or use your current location.");
      return;
    }

    if (toSelection) {
      endResult = { stop: toSelection, distance: 0 };
    } else {
      setFormError("Pick a destination station from the list.");
      return;
    }

    if (!startResult?.stop || !endResult?.stop) {
      setFormError("Could not match nearby stations. Try again.");
      return;
    }

    setRouteStops({ start: startResult, end: endResult });
    onSelectStation({
      stationId: startResult.stop.id,
      localizedName: startResult.stop.name
    });
    onPlanRoute?.({
      start: startResult.stop,
      end: endResult.stop
    });
    await loadStationVehicles(startResult.stop.id);
  };

  const activeStartName = routeStops.start?.stop?.name ?? "Start station";
  const hasGuidanceIssues =
    Boolean(guidanceStatus?.start?.length) || Boolean(guidanceStatus?.end?.length);
  const alternateStation = useMemo(() => {
    if (!routeStops.start?.stop || !stops.length) return null;
    const origin = routeStops.start.stop;
    const candidates = stops
      .filter((s) => s.id !== origin.id)
      .map((s) => ({
        ...s,
        distance: Math.hypot(origin.lat - s.lat, origin.lon - s.lon)
      }))
      .sort((a, b) => a.distance - b.distance);
    return candidates[0] || null;
  }, [routeStops.start, stops]);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <h3>Route Guide</h3>
          <span>Search places, snap to nearest stations</span>
        </div>
        {selectedStationId && <span className="tag">On map</span>}
      </div>

      <form className="route-guide" onSubmit={handlePlanRoute}>
        <div className="route-guide__field">
          <label htmlFor="from-search">From (station or place)</label>
          <div className="route-guide__search">
            <input
              id="from-search"
              name="from-search"
              type="text"
              placeholder="Start typing a station…"
              value={fromQuery}
              onChange={(event) => {
                setFromQuery(event.target.value);
                setFromSelection(null);
              }}
            />
            <button
              className="route-guide__pill"
              type="button"
              onClick={setCurrentLocation}
              disabled={myLocation.loading}
            >
              {myLocation.loading ? "Locating…" : "Use my location"}
            </button>
          </div>
          {myLocation.error && <div className="info-banner error">{myLocation.error}</div>}
          {!fromSelection && fromQuery.length >= 2 && (
            <div className="route-guide__suggestions">
              {filterStops(fromQuery).map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  className="route-guide__suggestion"
                  onClick={() => {
                    setFromSelection(stop);
                    setFromQuery(stop.name);
                    setMyLocation((prev) => ({ ...prev, lat: null, lon: null }));
                  }}
                >
                  <span className="route-guide__name">{stop.name}</span>
                  <span className="route-guide__meta">{stop.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="route-guide__field">
          <label htmlFor="to-search">To (station or place)</label>
          <input
            id="to-search"
            name="to-search"
            type="text"
            placeholder="Where are you heading?"
            value={toQuery}
            onChange={(event) => {
              setToQuery(event.target.value);
              setToSelection(null);
              setPlaceResults([]);
            }}
          />
          {placeError && <div className="info-banner error">{placeError}</div>}
          {placeLoading && <div className="info-banner">Searching places…</div>}
          {!toSelection && placeResults.length > 0 && (
            <div className="route-guide__suggestions">
              {placeResults.map((place, index) => {
                const nearest = findNearestStop(place.lat, place.lon);
                if (!nearest.stop) return null;
                return (
                  <button
                    key={`${place.label}-${index}`}
                    type="button"
                    className="route-guide__suggestion"
                    onClick={() => {
                      setToSelection(nearest.stop);
                      setToQuery(place.label);
                    }}
                  >
                    <span className="route-guide__name">{place.label}</span>
                    <span className="route-guide__meta">
                      Nearest station: {nearest.stop.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {!toSelection && placeResults.length === 0 && toQuery.length >= 2 && !placeLoading && (
            <div className="route-guide__suggestions">
              {filterStops(toQuery).map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  className="route-guide__suggestion"
                  onClick={() => {
                    setToSelection(stop);
                    setToQuery(stop.name);
                  }}
                >
                  <span className="route-guide__name">{stop.name}</span>
                  <span className="route-guide__meta">{stop.id}</span>
                </button>
              ))}
            </div>
          )}
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
            Places come from free OpenStreetMap search; we snap to the closest stations.
          </span>
        </div>
      </form>

      {routeStops.start?.stop && routeStops.end?.stop && (
        <div
          className={`info-banner ${!guidanceStatus?.loading && !guidanceStatus?.error && !hasGuidanceIssues ? "success" : ""}`}
          style={{ marginTop: "0.5rem" }}
        >
          <strong>Guidance check</strong>
          {guidanceStatus?.loading && <p>Checking accessibility for your route…</p>}
          {guidanceStatus?.error && <p>{guidanceStatus.error}</p>}
          {!guidanceStatus?.loading && !guidanceStatus?.error && (
            <>
              {hasGuidanceIssues ? (
                <p>Outages detected on your route. Check Accessibility for details.</p>
              ) : (
                <p>NYC Transit Hub has checked for you! All accessibility facilities are in use.</p>
              )}
            </>
          )}
        </div>
      )}

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
              {alternateStation && (
                <p className="accessibility-details" style={{ marginTop: "0.35rem" }}>
                  Try nearby station {alternateStation.name} ({formatDistance(alternateStation.distance)} away) for other lines.
                </p>
              )}
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
  selectedStationId: PropTypes.string,
  onPlanRoute: PropTypes.func,
  guidanceStatus: PropTypes.shape({
    start: PropTypes.array,
    end: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string
  })
};

RouteGuidePanel.defaultProps = {
  onSelectStation: () => {},
  selectedStationId: "",
  onPlanRoute: null,
  guidanceStatus: null
};

export default RouteGuidePanel;
