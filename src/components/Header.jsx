import PropTypes from "prop-types";
import "../styles/header.css";

function Header({ onOpenSettings }) {
  return (
    <header className="header">
      <div className="header__title">
        <span className="header__badge">NYC Transit Hub</span>
        <h1>Real-Time Transit Intelligence</h1>
        <p>
          Live service status, accessibility insights, and personalized alerts
          for the A, C, and E subway lines.
        </p>
      </div>
      <div className="header__actions">
        <button className="header__button header__button--ghost" type="button">
          Feedback
        </button>
        <button
          className="header__button header__button--primary"
          type="button"
          onClick={onOpenSettings}
        >
          Manage Alerts
        </button>
      </div>
    </header>
  );
}

Header.propTypes = {
  onOpenSettings: PropTypes.func
};

export default Header;
