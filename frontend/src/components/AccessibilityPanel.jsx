import PropTypes from "prop-types";

function AccessibilityPanel({ accessibility }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Accessibility</h3>
        <span>Elevators &amp; escalators</span>
      </div>

      <div className="accessibility-list">
        {accessibility.length === 0 ? (
          <p>No accessibility updates for this station.</p>
        ) : (
          accessibility.map((item) => (
            <div key={item.accessId} className="accessibility-card">
              <div className="favorite-meta">
                <span>{item.feature}</span>
                <span>{item.status}</span>
              </div>
              <p>{item.description}</p>
              <time dateTime={item.lastReportedIso}>
                Updated {item.lastReported}
              </time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

AccessibilityPanel.propTypes = {
  accessibility: PropTypes.arrayOf(
    PropTypes.shape({
      accessId: PropTypes.string.isRequired,
      feature: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      lastReported: PropTypes.string.isRequired,
      lastReportedIso: PropTypes.string.isRequired
    })
  ).isRequired
};

export default AccessibilityPanel;
