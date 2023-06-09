import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import externals from "rollup-plugin-node-externals";


const productionMode = process.env.NODE_ENV === "production";

const sourceMapEnabled = !productionMode;

export default {
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
}