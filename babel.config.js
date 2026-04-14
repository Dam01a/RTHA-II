const path = require("path");

module.exports = function (api) {
  api.cache(true);
  const projectRoot = __dirname;
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: [path.resolve(projectRoot)],
          alias: {
            "@": path.resolve(projectRoot),
          },
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
