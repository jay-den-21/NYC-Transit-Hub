import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "../styles/mapView.css";
import { fetchAllStops, fetchStationVehicles } from "../api/mtaApi.js";

const ROUTE_COLORS = {
  ACE: "#2563eb",
  A: "#1d4ed8",
  C: "#0ea5e9",
  E: "#1e3a8a"
};

const getRouteColor = (routeId) =>
  ROUTE_COLORS[routeId] ?? ROUTE_COLORS.ACE ?? "#2563eb";

const simpleTranslateName = (name, lang) => {
  if (!name || lang === "en") return name;
  const zhProper = [
    [/Times Square/gi, "时代广场"],
    [/Bryant Park/gi, "布莱恩特公园"],
    [/Grand Central/gi, "中央车站"],
    [/Port Authority Bus Terminal/gi, "港务局汽车站"],
    [/Penn Station/gi, "宾州车站"],
    [/Columbus Circle/gi, "哥伦布圆环"],
    [/Fulton St/gi, "富尔顿街"],
    [/World Trade Center/gi, "世贸中心"],
    [/Lexington Av/gi, "列克星敦大道"],
    [/Herald Sq/gi, "先驱广场"],
    [/Queens Plaza/gi, "皇后广场"],
    [/Forest Hills/gi, "森林小丘"],
    [/Jamaica/gi, "牙买加"]
  ];
  const esProper = [
    [/Port Authority Bus Terminal/gi, "Terminal de Autobuses Port Authority"],
    [/Penn Station/gi, "Estación Penn"],
    [/Times Square/gi, "Times Square"],
    [/Grand Central/gi, "Grand Central"],
    [/Fulton St/gi, "Calle Fulton"],
    [/World Trade Center/gi, "World Trade Center"],
    [/Queens Plaza/gi, "Queens Plaza"],
    [/Forest Hills/gi, "Forest Hills"],
    [/Jamaica/gi, "Jamaica"],
    [/Herald Sq/gi, "Herald Sq"],
    [/Columbus Circle/gi, "Columbus Circle"],
    [/Bryant Park/gi, "Bryant Park"]
  ];
  let translated = name;
  if (lang === "es") {
    esProper.forEach(([re, rep]) => {
      translated = translated.replace(re, rep);
    });
    translated = translated
      .replace(/St\b/gi, "Calle")
      .replace(/Av\b/gi, "Av.")
      .replace(/Station/gi, "Estación")
      .replace(/Park/gi, "Parque")
      .replace(/Center/gi, "Centro");
  } else if (lang === "zh") {
    zhProper.forEach(([re, rep]) => {
      translated = translated.replace(re, rep);
    });
    translated = translated
      .replace(/Station/gi, "车站")
      .replace(/St\b/gi, "街")
      .replace(/Av\b/gi, "大道")
      .replace(/Park/gi, "公园")
      .replace(/Center/gi, "中心");
  }
  return translated;
};

function MapView({
  routes,
  vehicles,
  selectedRoute,
  selectedStation,
  plannedRoute,
  selectedLanguage,
  stopRoutesMap,
  stationTranslations,
  onSelectRoute,
  onSelectStation,
  isLive,
  liveFeedName,
  liveUpdatedAt,
  liveVehicleCount
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [allStops, setAllStops] = useState([]);
  const [stationVehicles, setStationVehicles] = useState({ upcoming: [], past: [] });
  const overlaysRef = useRef({
    routesLayer: null,
    stationsLayer: null,
    vehiclesLayer: null,
    plannedLayer: null
  });

  useEffect(() => {
    fetchAllStops().then(setAllStops);
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchStationVehicles(selectedStation.stationId).then(setStationVehicles);
    } else {
      setStationVehicles({ upcoming: [], past: [] });
    }
  }, [selectedStation]);

  const filteredVehicles = useMemo(() => {
    if (!selectedRoute) return vehicles;
    return vehicles.filter((vehicle) => vehicle.routeId === selectedRoute);
  }, [vehicles, selectedRoute]);

  const filteredStops = useMemo(() => {
    const selectedRouteMeta = routes.find((route) => route.routeId === selectedRoute);
    const stationIds = selectedRouteMeta?.stationIds ?? [];

    const belongsToRoute = (stopId) => {
      if (stationIds.length) return stationIds.includes(stopId);
      const routesServing = stopRoutesMap?.[stopId] || [];
      return routesServing.includes(selectedRoute);
    };

    return allStops
      .filter((stop) => belongsToRoute(stop.id))
      .map((stop) => {
        const baseStopId = stop.id?.replace(/[NS]$/, "") || stop.id;
        const translationKey = `${baseStopId}:${selectedLanguage?.code || "en"}`;
        const localizedName =
          stationTranslations?.get?.(translationKey) ||
          simpleTranslateName(stop.localizedName || stop.name, selectedLanguage?.code || "en");
        const routesServing = stopRoutesMap?.[stop.id] || stop.routes || [];
        return { ...stop, localizedName, routes: routesServing };
      });
  }, [allStops, routes, selectedRoute, selectedLanguage, stationTranslations, stopRoutesMap]);

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
    overlaysRef.current.plannedLayer = L.layerGroup().addTo(map);

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
    overlays.plannedLayer?.clearLayers();

    const bounds = [];
    const selectedRouteMeta = routes.find(
      (route) => route.routeId === selectedRoute
    );

    routes.forEach((route) => {
      if (route.geometry && route.geometry.length > 0) {
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
      }
    });

    filteredStops.forEach((station) => {
      const isActive = station.id === selectedStation?.stationId;
      const color = getRouteColor(selectedRoute);
      const marker = L.marker([station.lat, station.lon], {
        icon: L.divIcon({
          className: `station-icon ${isActive ? "active" : ""}`,
          html: `<span class="station-icon__glyph" style="background:${color}">🚉</span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      });
      const stationName = station.localizedName || station.name;
      const routeList = station.routes?.length ? `Lines: ${station.routes.join(", ")}` : "";
      marker.bindPopup(
        `<strong>${stationName}</strong><br/>${station.id}${routeList ? `<br/>${routeList}` : ""}`
      );
      marker.on("click", () =>
        onSelectStation({ stationId: station.id, localizedName: stationName })
      );
      marker.addTo(overlays.stationsLayer);
      if (selectedRouteMeta?.stationIds?.includes(station.id)) {
        bounds.push([station.lat, station.lon]);
      }
    });

    filteredVehicles.forEach((vehicle) => {
      if (typeof vehicle.lat !== "number" || typeof vehicle.lon !== "number") return;
      const marker = L.marker([vehicle.lat, vehicle.lon], {
        icon: L.divIcon({
          className: "vehicle-icon",
          html: `<span class="vehicle-icon__glyph" title="${vehicle.routeId || "Train"}">🚆</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      });
      marker.bindPopup(
        `<strong>Train ${vehicle.vehicleId}</strong><br/>Route ${vehicle.routeId}<br/>Updated ${vehicle.lastUpdate}${vehicle.isEstimated ? "<br/><em>Estimated at stop</em>" : ""}`
      );
      marker.addTo(overlays.vehiclesLayer);
      bounds.push([vehicle.lat, vehicle.lon]);
    });

    if (plannedRoute?.start && plannedRoute?.end && overlays.plannedLayer) {
      const startStop = allStops.find((s) => s.id === plannedRoute.start.id);
      const endStop = allStops.find((s) => s.id === plannedRoute.end.id);
      if (startStop && endStop) {
        const line = L.polyline(
          [
            [startStop.lat, startStop.lon],
            [endStop.lat, endStop.lon]
          ],
          {
            color: "#10b981",
            weight: 5,
            opacity: 0.8,
            dashArray: "6 6"
          }
        ).addTo(overlays.plannedLayer);
        const startMarker = L.circleMarker([startStop.lat, startStop.lon], {
          radius: 10,
          color: "#10b981",
          weight: 3,
          fillColor: "#10b981",
          fillOpacity: 0.7
        }).addTo(overlays.plannedLayer);
        startMarker.bindTooltip(`Origin: ${startStop.name}`, { direction: "top" });

        const endMarker = L.circleMarker([endStop.lat, endStop.lon], {
          radius: 10,
          color: "#2563eb",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 0.7
        }).addTo(overlays.plannedLayer);
        endMarker.bindTooltip(`Destination: ${endStop.name}`, { direction: "top" });

        bounds.push([startStop.lat, startStop.lon], [endStop.lat, endStop.lon]);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [
    routes,
    filteredStops,
    filteredVehicles,
    selectedRoute,
    selectedStation,
    plannedRoute,
    onSelectStation,
    isLive
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
          <h3>Live Feed</h3>
          {isLive ? (
            <div className="info-banner">
              <strong>{liveFeedName || selectedRoute}</strong>
              <p>
                {liveVehicleCount} vehicles on map · Updated{" "}
                {liveUpdatedAt
                  ? new Date(liveUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                  : "just now"}
              </p>
              <p className="info-banner__subtle">
                Arrival countdowns need schedule data; currently showing live positions only.
              </p>
            </div>
          ) : selectedStation ? (
            <>
              <p className="map-overlay__station">
                {selectedStation.localizedName}
              </p>
              <div className="map-overlay__arrivals">
                <h4>Upcoming</h4>
                {stationVehicles.upcoming.map((train) => (
                  <div key={train.vehicle_id} className="arrival-row">
                    <span className="arrival-route">{train.route_id}</span>
                    <span className="arrival-destination">{train.stop_name}</span>
                  </div>
                ))}
                <h4>Past</h4>
                {stationVehicles.past.map((train) => (
                  <div key={train.vehicle_id} className="arrival-row">
                    <span className="arrival-route">{train.route_id}</span>
                    <span className="arrival-destination">{train.stop_name}</span>
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
            <span>{isLive ? "live positions" : "demo vehicles"}</span>
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
      ),
      stationIds: PropTypes.arrayOf(PropTypes.string)
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
    localizedName: PropTypes.string.isRequired
  }),
  plannedRoute: PropTypes.shape({
    start: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number
    }),
    end: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number
    })
  }),
  selectedLanguage: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string
  }),
  stopRoutesMap: PropTypes.object,
  stationTranslations: PropTypes.instanceOf(Map),
  onSelectRoute: PropTypes.func.isRequired,
  onSelectStation: PropTypes.func.isRequired,
  isLive: PropTypes.bool,
  liveFeedName: PropTypes.string,
  liveUpdatedAt: PropTypes.string,
  liveVehicleCount: PropTypes.number
};

MapView.defaultProps = {
  selectedStation: null,
  plannedRoute: null,
  selectedLanguage: null,
  stopRoutesMap: {},
  stationTranslations: new Map(),
  isLive: false,
  liveFeedName: "",
  liveUpdatedAt: "",
  liveVehicleCount: 0
};

export default MapView;
