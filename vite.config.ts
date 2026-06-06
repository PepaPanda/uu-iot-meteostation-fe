import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ProxyOptions } from 'vite';

// The backend API server (Express) listens on this origin in development.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000';

// Shared proxy options that forward traffic to the backend as if it were
// same-origin. The browser's Origin/Referer headers are stripped so the
// backend's CORS policy (which allows requests without an Origin) accepts the
// proxied request no matter which port the Vite dev server happens to use.
const backendProxy: ProxyOptions = {
	target: API_TARGET,
	changeOrigin: true,
	configure(proxy) {
		proxy.on('proxyReq', (proxyReq) => {
			proxyReq.removeHeader('origin');
			proxyReq.removeHeader('referer');
		});
	}
};

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Proxy API and gateway-collection traffic to the backend so the browser
		// talks to a single same-origin host. This removes the need for CORS in
		// development and keeps the session cookie working without any
		// server-side SvelteKit files.
		proxy: {
			'/api': backendProxy,
			'/collect': backendProxy
		}
	}
});
