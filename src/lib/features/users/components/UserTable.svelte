<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type { Role } from '$lib/types/common';
	import { formatDate, initials } from '$lib/utils/format';
	import { allRoles, roleLabel } from '$lib/utils/role';
	import type { User } from '../user-types';

	interface Props {
		users: User[];
		currentUserId: number;
		canManage?: boolean;
		busyId?: number | null;
		onChangeRole?: (id: number, role: Role) => void;
		onDelete?: (user: User) => void;
	}

	let {
		users,
		currentUserId,
		canManage = false,
		busyId = null,
		onChangeRole,
		onDelete
	}: Props = $props();

	const roleOptions = allRoles().map((role) => ({ value: role, label: roleLabel(role) }));
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Uživatel</th>
				<th>Role</th>
				<th>Registrace</th>
				{#if canManage}<th class="actions-col">Akce</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each users as user (user.id)}
				<tr>
					<td>
						<div class="user-cell">
							<span class="avatar">{initials(user.nickname)}</span>
							<div class="identity">
								<span class="name">
									{user.nickname}
									{#if user.id === currentUserId}<span class="you">(vy)</span>{/if}
								</span>
								<span class="email">{user.email}</span>
							</div>
						</div>
					</td>
					<td>
						{#if canManage && user.id !== currentUserId}
							<Select
								value={user.role}
								options={roleOptions}
								disabled={busyId === user.id}
								onchange={(event) =>
									onChangeRole?.(user.id, (event.currentTarget as HTMLSelectElement).value as Role)}
							/>
						{:else}
							<Badge variant="neutral">{roleLabel(user.role)}</Badge>
						{/if}
					</td>
					<td class="muted">{formatDate(user.registeredAt)}</td>
					{#if canManage}
						<td class="actions-col">
							{#if user.id !== currentUserId}
								<Button
									variant="ghost"
									size="sm"
									loading={busyId === user.id}
									onclick={() => onDelete?.(user)}
									aria-label={`Smazat uživatele ${user.nickname}`}
								>
									{#snippet icon()}<Icon name="trash" size={16} />{/snippet}
									Smazat
								</Button>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	th {
		text-align: left;
		padding: 0.65rem var(--space-4);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-full);
		background-color: var(--color-primary-soft);
		color: var(--color-primary-soft-text);
		font-size: var(--text-xs);
		font-weight: 700;
		flex-shrink: 0;
	}

	.identity {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		font-weight: 600;
		color: var(--color-text);
	}

	.you {
		font-weight: 400;
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.email {
		color: var(--color-text-muted);
		font-size: var(--text-xs);
	}

	.muted {
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.actions-col {
		text-align: right;
		white-space: nowrap;
	}
</style>
