import {defineConfig} from "vite";
import monkey, {cdn} from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        monkey({
            entry: "src/main.ts",
            userscript: {
                icon: "https://vitejs.dev/logo.svg",
                namespace: "npm/vite-plugin-monkey",
                match: ["*://manga.bilibili.com/mc*/*"],
            },
            build: {
                externalGlobals: {
                    jszip: cdn.jsdelivr("JSZip", "dist/jszip.min.js"),
                },
            },
        }),
    ],
});
