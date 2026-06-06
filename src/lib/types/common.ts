/** User roles, ordered from least to most privileged. */
export type Role = 'guest' | 'operator' | 'supervisor' | 'administrator';

/** Pagination envelope returned by all list endpoints. */
export interface Pagination {
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
}
