import PropTypes from "prop-types";

function UserPreferencesPanel({ preferences, selectedStation }) {
  const stationLabel = selectedStation
    ? selectedStation.localizedName
    : "Select a station";

  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>User Preferences</h3>
        <span>{preferences.units}</span>
      </div>

      <div className="preferences">
        <div className="preferences-row">
          <span className="preferences-label">Default Language</span>
          <span>{preferences.defaultLanguageName}</span>
        </div>
        <div className="preferences-row">
          <span className="preferences-label">Time Format</span>
          <span>{preferences.timeFormat}</span>
        </div>
        <div className="preferences-row">
          <span className="preferences-label">Home Station</span>
          <span>{stationLabel}</span>
        </div>
      </div>
    </section>
  );
}

UserPreferencesPanel.propTypes = {
  preferences: PropTypes.shape({
    defaultLanguageName: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    units: PropTypes.string.isRequired
  }).isRequired,
  selectedStation: PropTypes.shape({
    localizedName: PropTypes.string.isRequired
  })
};

UserPreferencesPanel.defaultProps = {
  selectedStation: null
};

export default UserPreferencesPanel;
