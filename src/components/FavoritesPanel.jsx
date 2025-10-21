import PropTypes from "prop-types";

function FavoritesPanel({ favorites }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <h3>Favorites & Alerts</h3>
        <span>{favorites.length} saved</span>
      </div>

      <div className="favorite-list">
        {favorites.length === 0 ? (
          <p>No saved alerts for this route yet.</p>
        ) : (
          favorites.map((favorite) => (
            <div key={favorite.favoriteId} className="favorite-card">
              <div className="favorite-meta">
                <span>{favorite.routeId}</span>
                <span>{favorite.alertType}</span>
              </div>
              <h4>{favorite.stationName}</h4>
              <div className="favorite-meta">
                <span>Push: {favorite.pushEnabled ? "On" : "Off"}</span>
                <span>Email: {favorite.emailEnabled ? "On" : "Off"}</span>
              </div>
              <time dateTime={favorite.createdAtIso}>
                Added {favorite.createdAtRelative}
              </time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

FavoritesPanel.propTypes = {
  favorites: PropTypes.arrayOf(
    PropTypes.shape({
      favoriteId: PropTypes.string.isRequired,
      routeId: PropTypes.string.isRequired,
      stationName: PropTypes.string.isRequired,
      alertType: PropTypes.string.isRequired,
      pushEnabled: PropTypes.bool.isRequired,
      emailEnabled: PropTypes.bool.isRequired,
      createdAtIso: PropTypes.string.isRequired,
      createdAtRelative: PropTypes.string.isRequired
    })
  ).isRequired
};

export default FavoritesPanel;
