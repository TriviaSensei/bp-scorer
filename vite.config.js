import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// https://vite.dev/config/
export default defineConfig({
	test: {
		browser: {
			provider: playwright(),
			enabled: true,
			instances: [{ browser: 'chromium' }],
		},
	},
	plugins: [react()],
});
