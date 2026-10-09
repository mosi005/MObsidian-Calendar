import esbuild from "esbuild";
import process from "process";
import { builtinModules } from "node:module";

const isProduction = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  // Obsidian provides these at runtime; they must not be bundled.
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtinModules,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: isProduction ? false : "inline",
  minify: isProduction,
  treeShaking: true,
  outfile: "main.js",
});

if (isProduction) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
