const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

const upstreamResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@/")) {
    const rel = moduleName.slice(2);
    const base = path.resolve(projectRoot, rel);
    try {
      if (fs.existsSync(base) && fs.statSync(base).isFile()) {
        return { filePath: base, type: "sourceFile" };
      }
    } catch {
      // fall through
    }
    const candidates = [
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.jsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ];
    for (const filePath of candidates) {
      try {
        if (fs.existsSync(filePath)) {
          return { filePath, type: "sourceFile" };
        }
      } catch {
        // continue
      }
    }
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
