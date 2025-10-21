import { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "../styles/mapView.css";

const ROUTE_COLORS = {
  ACE: "#2563eb",
  A: "#1d4ed8",
  C: "#0ea5e9",
  E: "#1e3a8a"
};

const getRouteColor = (routeId) =>
  ROUTE_COLORS[routeId] ?? ROUTE_COLORS.ACE ?? "#2563eb";

function MapView({
  routes,
  stations,
  vehicles,
  selectedRoute,
  selectedStation,
  onSelectRoute,
  onSelectStation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlaysRef = useRef({
    routesLayer: null,
    stationsLayer: null,
    vehiclesLayer: null
  });

  const filteredVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.routeId === selectedRoute),
    [vehicles, selectedRoute]
  );

  useEffect(() => {
    if (mapInstanceRef.current || !mapContainerRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [40.758, -73.985],
      zoom: 12,
      zoomControl: false
    });

    L.control
      .zoom({
        position: "bottomright"
      })
      .addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    overlaysRef.current.routesLayer = L.layerGroup().addTo(map);
    overlaysRef.current.stationsLayer = L.layerGroup().addTo(map);
    overlaysRef.current.vehiclesLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlays = overlaysRef.current;
    if (!map || !overlays.routesLayer) {
      return;
    }

    overlays.routesLayer.clearLayers();
    overlays.stationsLayer.clearLayers();
    overlays.vehiclesLayer.clearLayers();

    const selectedRouteMeta = routes.find(
      (route) => route.routeId === selectedRoute
    );
    const bounds = [];

    routes.forEach((route) => {
      const polyline = L.polyline(route.geometry, {
        color: getRouteColor(route.routeId),
        weight: route.routeId === selectedRoute ? 6 : 3,
        opacity: route.routeId === selectedRoute ? 0.9 : 0.4,
        dashArray: route.routeId === selectedRoute ? undefined : "6 8"
      });
      polyline.addTo(overlays.routesLayer);
      if (route.routeId === selectedRoute) {
        route.geometry.forEach((point) => bounds.push(point));
      }
    });

    stations.forEach((station) => {
      const isActive = station.stationId === selectedStation?.stationId;
      const marker = L.circleMarker([station.lat, station.lon], {
        radius: isActive ? 10 : 8,
        color: isActive ? "#1d4ed8" : "rgba(15, 23, 42, 0.35)",
        weight: isActive ? 4 : 2,
        fillColor: isActive ? "#3b82f6" : "#f8fafc",
        fillOpacity: isActive ? 0.85 : 0.9
      });
      marker.bindTooltip(station.localizedName, {
        direction: "top",
        offset: [0, -8]
      });
      marker.on("click", () => onSelectStation(station.stationId));
      marker.addTo(overlays.stationsLayer);
      if (selectedRouteMeta?.stationIds?.includes(station.stationId)) {
        bounds.push([station.lat, station.lon]);
      }
    });

    filteredVehicles.forEach((vehicle) => {
      const marker = L.marker([vehicle.lat, vehicle.lon], {
        icon: L.divIcon({
          className: "vehicle-icon",
          html: `<span class="vehicle-icon__label">${vehicle.headsign}</span>`,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        })
      });
      marker.bindPopup(
        `<strong>Train ${vehicle.vehicleId}</strong><br/>Route ${vehicle.routeId}<br/>Speed ${vehicle.speed} mph<br/>Updated ${vehicle.lastUpdate}`
      );
      marker.addTo(overlays.vehiclesLayer);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [
    routes,
    stations,
    filteredVehicles,
    selectedRoute,
    selectedStation,
    onSelectStation
  ]);

  return (
    <div className="map-wrapper">
      <div className="map-toolbar" role="group" aria-label="Route selection">
        {routes.map((route) => (
          <button
            key={route.routeId}
            type="button"
            className={`route-pill ${route.routeId === selectedRoute ? "active" : ""}`}
            onClick={() => onSelectRoute(route.routeId)}
          >
            <span
              className="route-pill__swatch"
              style={{ backgroundColor: getRouteColor(route.routeId) }}
            />
            {route.shortName}
          </button>
        ))}
      </div>

      <div ref={mapContainerRef} className="map-container" />

      <div className="map-overlay">
        <div className="map-overlay__section">
          <h3>Next Arrival</h3>
          {selectedStation ? (
            <>
              <p className="map-overlay__station">
                {selectedStation.localizedName}
              </p>
              <div className="map-overlay__arrivals">
                {selectedStation.upcomingTrains.map((train) => (
                  <div key={train.tripId} className="arrival-row">
                    <span className="arrival-route">{train.routeId}</span>
                    <span className="arrival-destination">{train.destination}</span>
                    <span className="arrival-minutes">{train.arrivalInMinutes} min</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="map-overlay__empty">
              Select a station to view arrival information.
            </p>
          )}
        </div>

        <div className="map-overlay__section">
          <h3>Live Trains</h3>
          <p className="map-overlay__live-count">
            {filteredVehicles.length}
            <span>in service</span>
          </p>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-swatch legend-ace" />
              A / C / E
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-c" />
              Stations
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-e" />
              Vehicles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MapView.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      shortName: PropTypes.string.isRequired,
      geometry: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number.isRequired).isRequired
      ).isRequired
    })
  ).isRequired,
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      stationId: PropTypes.string.isRequired,
      localizedName: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
      upcomingTrains: PropTypes.arrayOf(
        PropTypes.shape({
          tripId: PropTypes.string.isRequired,
          routeId: PropTypes.string.isRequired,
          destination: PropTypes.string.isRequired,
          arrivalInMinutes: PropTypes.number.isRequired
        })
      ).isRequired
    })
  ).isRequired,
  vehicles: PropTypes.arrayOf(
    PropTypes.shape({
      vehicleId: PropTypes.string.isRequired,
      routeId: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
      headsign: PropTypes.string.isRequired,
      speed: PropTypes.number.isRequired,
      lastUpdate: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedRoute: PropTypes.string.isRequired,
  selectedStation: PropTypes.shape({
    stationId: PropTypes.string.isRequired,
    localizedName: PropTypes.string.isRequired,
    upcomingTrains: PropTypes.array.isRequired
  }),
  onSelectRoute: PropTypes.func.isRequired,
  onSelectStation: PropTypes.func.isRequired
};

MapView.defaultProps = {
  selectedStation: null
};

export default MapView;
