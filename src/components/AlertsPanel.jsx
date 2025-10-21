import PropTypes from "prop-types";

function AlertsPanel({ alerts }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Live Alerts</h3>
        <span>{alerts.length} active</span>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <p>No live alerts for this route right now.</p>
        ) : (
          alerts.map((alert) => (
            <article
              key={alert.alertId}
              className={`alert-card ${alert.severity}`}
              aria-live={alert.severity === "issue" ? "assertive" : "polite"}
            >
              <div className="favorite-meta">
                <span>{alert.stationName}</span>
                <time dateTime={alert.startAtIso}>{alert.startTime}</time>
              </div>
              <h4>{alert.header}</h4>
              <p>{alert.description}</p>
              <div className="alert-meta">
                <span>{alert.direction}</span>
                <span>Last update {alert.lastUpdate}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

AlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      alertId: PropTypes.string.isRequired,
      stationName: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      direction: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      startAtIso: PropTypes.string.isRequired,
      lastUpdate: PropTypes.string.isRequired,
      severity: PropTypes.oneOf(["info", "issue"]).isRequired
    })
  ).isRequired
};

export default AlertsPanel;
