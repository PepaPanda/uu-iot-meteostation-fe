import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Pure client-side SPA: the app talks to a separate API server and uses
		// no server-side SvelteKit features. A fallback page enables client-side
		// routing for every path.
		adapter: adapter({
			fallback: 'index.html'
		})
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
