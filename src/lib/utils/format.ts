const LOCALE = 'cs-CZ';
const TIME_ZONE = 'Europe/Prague';

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: TIME_ZONE
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
	dateStyle: 'medium',
	timeZone: TIME_ZONE
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
	hour: '2-digit',
	minute: '2-digit',
	timeZone: TIME_ZONE
});

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

function toDate(value: string | number | Date | null | undefined): Date | null {
	if (value === null || value === undefined) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a timestamp as a localized date and time (Europe/Prague). */
export function formatDateTime(value: string | number | Date | null | undefined): string {
	const date = toDate(value);
	return date ? dateTimeFormatter.format(date) : '—';
}

/** Formats a timestamp as a localized date (Europe/Prague). */
export function formatDate(value: string | number | Date | null | undefined): string {
	const date = toDate(value);
	return date ? dateFormatter.format(date) : '—';
}

/** Formats a timestamp as a localized time of day (Europe/Prague). */
export function formatTime(value: string | number | Date | null | undefined): string {
	const date = toDate(value);
	return date ? timeFormatter.format(date) : '—';
}

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
	{ amount: 60, unit: 'second' },
	{ amount: 60, unit: 'minute' },
	{ amount: 24, unit: 'hour' },
	{ amount: 7, unit: 'day' },
	{ amount: 4.34524, unit: 'week' },
	{ amount: 12, unit: 'month' },
	{ amount: Number.POSITIVE_INFINITY, unit: 'year' }
];

/** Formats a timestamp relative to now (e.g. "před 5 minutami"). */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
	const date = toDate(value);
	if (!date) return '—';

	let duration = (date.getTime() - Date.now()) / 1000;

	for (const division of RELATIVE_DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			return relativeFormatter.format(Math.round(duration), division.unit);
		}
		duration /= division.amount;
	}

	return dateFormatter.format(date);
}

/** Formats a number with a fixed number of decimals, or a dash when missing. */
export function formatNumber(
	value: number | string | null | undefined,
	options: { decimals?: number; unit?: string } = {}
): string {
	// The backend occasionally serializes numeric columns as strings, so coerce.
	const numeric = typeof value === 'string' ? Number(value) : value;
	if (numeric === null || numeric === undefined || Number.isNaN(numeric)) return '—';

	const { decimals = 1, unit } = options;
	const formatted = new Intl.NumberFormat(LOCALE, {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(numeric);

	return unit ? `${formatted} ${unit}` : formatted;
}

/** Coordinates display helper. */
export function formatCoordinates(
	latitude: number | null | undefined,
	longitude: number | null | undefined
): string {
	if (
		latitude === null ||
		latitude === undefined ||
		longitude === null ||
		longitude === undefined
	) {
		return '—';
	}
	return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** Returns up-to-two uppercase initials derived from a name. */
export function initials(name: string | null | undefined): string {
	if (!name) return '?';
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
