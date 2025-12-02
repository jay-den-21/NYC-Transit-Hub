import PropTypes from "prop-types";

function LanguageSwitcher({ languages, value, onChange }) {
  return (
    <label className="language-switcher">
      Language
      <select
        value={value.code}
        onChange={(event) => {
          const selected = languages.find(
            (language) => language.code === event.target.value
          );
          if (selected) {
            onChange(selected);
          }
        }}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  );
}

LanguageSwitcher.propTypes = {
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  value: PropTypes.shape({
    code: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default LanguageSwitcher;
