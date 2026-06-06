import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// The app is a client-rendered SPA (see src/routes/+layout.ts: ssr and
		// prerender are disabled). It is served by a small Node server so it can
		// run on Railway via `node build` (honouring the platform's PORT) and so
		// `/api/*` requests can be reverse-proxied to the backend from the same
		// origin (see src/routes/api/[...path]/+server.ts) — no CORS, and the
		// session cookie keeps working.
		adapter: adapter()
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
