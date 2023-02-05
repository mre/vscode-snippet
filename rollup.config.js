const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const terser = require("@rollup/plugin-terser");
const externals = require("rollup-plugin-node-externals");

const productionMode = process.env.NODE_ENV === "production";

const sourceMapEnabled = !productionMode

module.exports = {
  input: "src/extension.ts",
  output: {
    dir: "out",
    format: "cjs",
    sourcemap: sourceMapEnabled,
  },
  external: ["vscode"],
  plugins: [
    commonjs(),
    json(),
    typescript({
      compilerOptions: { 
        module: "esnext",
        sourceMap: sourceMapEnabled,
      },
    }),
    !productionMode && externals(),
    productionMode && nodeResolve(),
    productionMode && terser(),
  ],
};
