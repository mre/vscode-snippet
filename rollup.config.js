const productionMode = process.env.NODE_ENV === "production";

const sourceMapEnabled = !productionMode;

module.exports = (async () => ({
  input: "src/extension.ts",
  output: {
    dir: "out",
    format: "cjs",
    sourcemap: sourceMapEnabled,
  },
  external: ["vscode"],
  plugins: [
    (await import("@rollup/plugin-commonjs")).default(),
    (await import("@rollup/plugin-json")).default(),
    (await import("@rollup/plugin-typescript")).default({
      compilerOptions: {
        module: "esnext",
        sourceMap: sourceMapEnabled,
      },
    }),
    !productionMode && (await import("rollup-plugin-node-externals")).default(),
    productionMode && (await import("@rollup/plugin-node-resolve")).default(),
    productionMode && (await import("@rollup/plugin-terser")).default(),
  ],
}))();
