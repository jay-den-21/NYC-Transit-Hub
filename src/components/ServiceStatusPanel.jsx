import PropTypes from "prop-types";

function ServiceStatusPanel({ statuses }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Service Status</h3>
        <span>Updated moments ago</span>
      </div>

      <div className="status-list">
        {statuses.map((status) => (
          <div
            key={status.statusId}
            className={`status-item ${status.condition}`}
            role="listitem"
          >
            <div>
              <div className={`badge badge-route-${status.routeId.toLowerCase()}`}>
                {status.routeId}
              </div>
              <h4>{status.header}</h4>
              <p>{status.description}</p>
            </div>
            <span
              className={`status-indicator indicator-${status.condition}`}
              aria-label={`Status ${status.condition}`}
            >
              {status.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

ServiceStatusPanel.propTypes = {
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      statusId: PropTypes.string.isRequired,
      routeId: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      condition: PropTypes.oneOf(["good", "delay", "issue"]).isRequired
    })
  ).isRequired
};

export default ServiceStatusPanel;
