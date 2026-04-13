const expo = require("eslint-config-expo/flat");

module.exports = [
  ...expo,
  {
    ignores: ['dist', 'node_modules', '.expo'],
    languageOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
