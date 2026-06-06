import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Backend origin that receives proxied `/api/*` traffic. Configurable at runtime
 * (e.g. a Railway service variable) so the frontend and backend can run as
 * separate services while the browser still talks to a single same-origin host:
 * no CORS, and the session cookie keeps working. This mirrors the Vite dev proxy
 * in `vite.config.ts`. Defaults to the local backend used by `node build`.
 */
const TARGET = (env.API_PROXY_TARGET ?? 'http://localhost:3000').replace(/\/+$/, '');

// Request headers that must not be forwarded upstream. `origin`/`referer` are
// stripped so the backend (which allows requests without an Origin) is not
// rejected by its CORS policy, exactly like the dev proxy does.
const STRIP_REQUEST_HEADERS = ['host', 'origin', 'referer', 'connection', 'content-length'];

// Response headers that would corrupt the proxied body (fetch has already
// decoded the payload) or that only describe the upstream hop.
const STRIP_RESPONSE_HEADERS = [
	'content-encoding',
	'content-length',
	'transfer-encoding',
	'connection'
];

const proxy: RequestHandler = async ({ request, url }) => {
	const targetUrl = `${TARGET}${url.pathname}${url.search}`;

	const requestHeaders = new Headers(request.headers);
	for (const name of STRIP_REQUEST_HEADERS) requestHeaders.delete(name);

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

	let upstream: Response;
	try {
		upstream = await fetch(targetUrl, {
			method: request.method,
			headers: requestHeaders,
			body: hasBody ? await request.arrayBuffer() : undefined,
			redirect: 'manual',
			signal: request.signal
		});
	} catch {
		return new Response('Backend API je nedostupné.', { status: 502 });
	}

	const responseHeaders = new Headers(upstream.headers);
	for (const name of STRIP_RESPONSE_HEADERS) responseHeaders.delete(name);

	// `Headers` folds multiple Set-Cookie values into one; re-add them split so
	// the browser receives each cookie individually (session auth relies on this).
	responseHeaders.delete('set-cookie');
	for (const cookie of upstream.headers.getSetCookie()) {
		responseHeaders.append('set-cookie', cookie);
	}

	// Stream the body straight through so Server-Sent Events (live telemetry)
	// are forwarded without buffering.
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders
	});
};

// `fallback` handles every HTTP method (GET, POST, PATCH, DELETE, ...).
export const fallback = proxy;
