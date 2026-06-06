import { ApiError } from './errors';

/**
 * Base URL for API requests. Empty by default so requests are same-origin and
 * forwarded to the backend by the Vite dev proxy (no CORS needed). Can be set
 * to an absolute origin via the `VITE_API_BASE_URL` environment variable.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	/** JSON-serialisable request body. */
	body?: unknown;
	/** Query-string parameters; `undefined`/`null` values are skipped. */
	query?: Query;
	signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
	const url = `${API_BASE_URL}${path}`;

	if (!query) return url;

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null) {
			params.append(key, String(value));
		}
	}

	const queryString = params.toString();
	return queryString ? `${url}?${queryString}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
	if (response.status === 204) return null;

	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		return response.json();
	}

	const text = await response.text();
	return text.length > 0 ? text : null;
}

/**
 * Performs an authenticated JSON request against the backend API. The session
 * cookie is sent automatically via `credentials: 'include'`. Throws `ApiError`
 * on non-2xx responses.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', body, query, signal } = options;

	const headers: Record<string, string> = {};
	const init: RequestInit = {
		method,
		credentials: 'include',
		headers,
		signal
	};

	if (body !== undefined) {
		headers['Content-Type'] = 'application/json';
		init.body = JSON.stringify(body);
	}

	const response = await fetch(buildUrl(path, query), init);
	const parsed = await parseBody(response);

	if (!response.ok) {
		throw new ApiError(response.status, response.statusText, parsed);
	}

	return parsed as T;
}

/** Absolute URL helper for endpoints consumed outside `fetch` (e.g. SSE). */
export function apiUrl(path: string): string {
	return `${API_BASE_URL}${path}`;
}
