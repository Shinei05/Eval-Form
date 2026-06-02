import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
	plugins: [vue()],
	server: {
		host: "localhost",
		port: 5173,
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["tests/**/*.test.js"],
	},
});
