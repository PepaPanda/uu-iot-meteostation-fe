/**
 * Error thrown by the API layer when a request fails. Components can inspect
 * `status` to render appropriate UI (e.g. redirect on 401) while keeping the
 * raw response details out of the user interface.
 */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly statusText: string,
		public readonly body: unknown
	) {
		super(ApiError.resolveMessage(status, statusText, body));
		this.name = 'ApiError';
	}

	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	get isForbidden(): boolean {
		return this.status === 403;
	}

	private static resolveMessage(status: number, statusText: string, body: unknown): string {
		if (body && typeof body === 'object') {
			const record = body as Record<string, unknown>;

			if (typeof record.message === 'string') return record.message;
			if (typeof record.error === 'string') return record.error;
		}

		return `Request failed with status ${status} ${statusText}`.trim();
	}
}
