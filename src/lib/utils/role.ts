import type { Role } from '$lib/types/common';

/** Roles ordered from least to most privileged. */
const ROLE_ORDER: Role[] = ['guest', 'operator', 'supervisor', 'administrator'];

/** Human-readable Czech labels for each role. */
const ROLE_LABELS: Record<Role, string> = {
	guest: 'Host',
	operator: 'Operátor',
	supervisor: 'Supervizor',
	administrator: 'Administrátor'
};

/** Returns the numeric rank of a role (higher means more privileged). */
export function roleRank(role: Role): number {
	return ROLE_ORDER.indexOf(role);
}

/** Returns true when `role` is at least as privileged as `minimum`. */
export function hasRole(role: Role | null | undefined, minimum: Role): boolean {
	if (!role) return false;
	return roleRank(role) >= roleRank(minimum);
}

/** Returns the localized label for a role. */
export function roleLabel(role: Role): string {
	return ROLE_LABELS[role] ?? role;
}

/** All roles, for use in selectors. */
export function allRoles(): Role[] {
	return [...ROLE_ORDER];
}
