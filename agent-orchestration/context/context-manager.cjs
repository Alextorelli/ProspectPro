const tsNode = require("ts-node");

tsNode.register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node16" },
});

(async () => {
  const module = await import("./context-manager.ts");
  module.exports = module;
})();