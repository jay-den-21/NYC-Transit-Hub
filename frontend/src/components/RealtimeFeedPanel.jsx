import { useMemo } from "react";
import PropTypes from "prop-types";

const formatTime = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

function RealtimeFeedPanel({
  feeds,
  selectedFeed,
  snapshot,
  loading,
  error,
  onSelectFeed,
  onRefresh
}) {
  const selectedDescriptor = useMemo(
    () => feeds.find((feed) => feed.id === selectedFeed),
    [feeds, selectedFeed]
  );

  const vehiclePreview = snapshot?.vehicles?.slice(0, 4) ?? [];

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <h3>Realtime Feeds</h3>
          <span>Live GTFS data proxied by the backend</span>
        </div>
        <span className="tag">Beta</span>
      </div>

      <div className="feed-selector">
          <select
            className="feed-select"
            value={selectedFeed}
            onChange={(event) => onSelectFeed(event.target.value)}
          >
            <option value="" disabled>
              Choose a feed
            </option>
            {feeds.map((feed) => (
            <option key={feed.id} value={feed.id}>
              {feed.name}
            </option>
          ))}
        </select>

        <button
          className="refresh-button"
          onClick={onRefresh}
          disabled={!selectedFeed || loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="info-banner error">{error}</div>}

      {selectedDescriptor && (
            <div className="feed-meta">
              <div>
                <p className="meta-label">Routes</p>
                <p className="meta-value">{selectedDescriptor.routes.join(" / ")}</p>
              </div>
              <div>
                <p className="meta-label">Entities</p>
                <p className="meta-value">{snapshot?.entityCount ?? "—"}</p>
              </div>
              <div>
                <p className="meta-label">Updated</p>
                <p className="meta-value">{snapshot ? formatTime(snapshot.updatedAt) : "Waiting"}</p>
              </div>
            </div>
      )}

      <div className="vehicle-grid">
        {vehiclePreview.map((vehicle) => (
          <div key={vehicle.id} className="vehicle-card">
            <div className="vehicle-header">
              <span className="badge badge-neutral">{vehicle.routeId ?? "?"}</span>
              <span className="vehicle-status">{vehicle.currentStatus ?? "Unknown"}</span>
            </div>
            <p className="vehicle-stop">
              {vehicle.stopName ?? vehicle.stopId ?? "Unknown stop"}
              {vehicle.stopName && vehicle.stopId ? ` (${vehicle.stopId})` : ""}
            </p>
            {vehicle.isEstimatedPosition && <p className="vehicle-estimated">Position estimated from stop</p>}
            <p className="vehicle-time">Updated {formatTime(vehicle.timestamp)}</p>
          </div>
        ))}

        {!loading && vehiclePreview.length === 0 && (
          <div className="info-banner">No vehicles returned yet for this feed.</div>
        )}
      </div>
    </div>
  );
}

export default RealtimeFeedPanel;

RealtimeFeedPanel.propTypes = {
  feeds: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedFeed: PropTypes.string.isRequired,
  snapshot: PropTypes.shape({
    vehicles: PropTypes.array
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onSelectFeed: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

RealtimeFeedPanel.defaultProps = {
  snapshot: null,
  loading: false,
  error: ""
};
