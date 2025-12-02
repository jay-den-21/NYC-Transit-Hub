import PropTypes from "prop-types";

const OutageList = ({ title, items }) => {
  if (!items?.length) return null;
  return (
    <div className="accessibility-subsection">
      <p className="accessibility-subtitle">{title}</p>
      <div className="accessibility-list">
        {items.map((item) => (
          <div key={item.id} className="accessibility-card">
            <div className="favorite-meta">
              <span>{item.equipment}</span>
              <span>{item.status}</span>
            </div>
            <p>{item.station}</p>
            {item.details && <p className="accessibility-details">{item.details}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

OutageList.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      equipment: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      station: PropTypes.string,
      details: PropTypes.string
    })
  )
};

OutageList.defaultProps = {
  items: []
};

function AccessibilityPanel({ station, accessibilityState, guidance }) {
  const { data, loading, error } = accessibilityState;
  const startOutages = guidance?.startOutages ?? [];
  const endOutages = guidance?.endOutages ?? [];
  const hasGuidanceIssues = startOutages.length > 0 || endOutages.length > 0;

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Accessibility</h3>
        <span>Elevators &amp; escalators</span>
      </div>

      {guidance?.start || guidance?.end ? (
        <div className={`info-banner ${!hasGuidanceIssues && !guidance?.loading && !guidance?.error ? "success" : ""}`}>
          <strong>Guidance check</strong>
          {guidance?.loading && <p>Checking your origin/destination…</p>}
          {guidance?.error && <p className="accessibility-details">{guidance.error}</p>}
          {!guidance?.loading && !guidance?.error && (
            <>
              {hasGuidanceIssues ? (
                <>
                  {startOutages.length > 0 && (
                    <p>Origin {guidance.start?.name || guidance.start?.id}: outages detected.</p>
                  )}
                  {endOutages.length > 0 && (
                    <p>Destination {guidance.end?.name || guidance.end?.id}: outages detected.</p>
                  )}
                </>
              ) : (
                <p>NYC Transit Hub has checked for you! All accessibility facilities are in use.</p>
              )}
            </>
          )}
        </div>
      ) : null}

      {loading && <div className="info-banner">Loading accessibility data…</div>}
      {error && <div className="info-banner error">{error}</div>}

      {!loading && !error && station && (
        <p className="accessibility-meta">
          Showing elevator/escalator status for {station.localizedName || station.nameDefault}
        </p>
      )}

      {!loading && !error && (
        <>
          <OutageList title="Current outages" items={data.currentOutages} />
          <OutageList title="Upcoming outages" items={data.upcomingOutages} />
          {!data.currentOutages?.length && !data.upcomingOutages?.length && (
            <div className="info-banner success">
              NYC Transit Hub has checked for you! All accessibility facilities are in use.
            </div>
          )}
        </>
      )}
    </section>
  );
}

AccessibilityPanel.propTypes = {
  station: PropTypes.shape({
    stationId: PropTypes.string,
    localizedName: PropTypes.string,
    nameDefault: PropTypes.string
  }),
  accessibilityState: PropTypes.shape({
    data: PropTypes.shape({
      currentOutages: PropTypes.array,
      upcomingOutages: PropTypes.array,
      equipments: PropTypes.array
    }).isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string.isRequired
  }).isRequired,
  guidance: PropTypes.shape({
    start: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }),
    end: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }),
    startOutages: PropTypes.array,
    endOutages: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string
  })
};

AccessibilityPanel.defaultProps = {
  station: null,
  guidance: null
};

export default AccessibilityPanel;
