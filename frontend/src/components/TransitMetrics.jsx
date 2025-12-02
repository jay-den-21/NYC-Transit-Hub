import PropTypes from "prop-types";

function TransitMetrics({ metrics }) {
  return (
    <section className="metric-grid">
      {metrics.map((metric) => (
        <article key={metric.id} className="metric-card">
          <span className="metric-label">{metric.label}</span>
          <span className="metric-value">{metric.value}</span>
          <span className="metric-trend">
            {metric.trend > 0 ? "▲" : "▼"} {Math.abs(metric.trend)}%
          </span>
          <p>{metric.caption}</p>
        </article>
      ))}
    </section>
  );
}

TransitMetrics.propTypes = {
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      trend: PropTypes.number.isRequired,
      caption: PropTypes.string.isRequired
    })
  ).isRequired
};

export default TransitMetrics;
