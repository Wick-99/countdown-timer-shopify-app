import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outfile = path.resolve(
	__dirname,
	"../extensions/countdown-timer/assets/widget.js",
);

const buildOptions = {
	entryPoints: [path.resolve(__dirname, "src/index.jsx")],
	bundle: true,
	minify: true,
	format: "iife",
	target: ["es2020"],
	outfile,
	jsx: "automatic",
	jsxImportSource: "preact",
	loader: { ".js": "jsx", ".jsx": "jsx" },
	logLevel: "info",
	banner: {
		js: "/* Countdown Timer widget — auto-generated, do not edit directly */",
	},
};

const watch = process.argv.includes("--watch");

if (watch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
	console.log(`[widget] watching... output: ${outfile}`);
} else {
	await esbuild.build(buildOptions);
	console.log(`[widget] built → ${outfile}`);
}
