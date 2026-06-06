<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';
	import ChangePasswordForm from '$lib/features/users/components/ChangePasswordForm.svelte';
	import InviteUserForm from '$lib/features/users/components/InviteUserForm.svelte';
	import UserTable from '$lib/features/users/components/UserTable.svelte';
	import { deleteUser, listUsers, updateUserRole } from '$lib/features/users/users-api';
	import type { User } from '$lib/features/users/user-types';
	import type { Role } from '$lib/types/common';
	import { onMount } from 'svelte';

	let users = $state<User[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let forbidden = $state(false);
	let busyId = $state<number | null>(null);

	let showInvite = $state(false);
	let userToDelete = $state<User | null>(null);

	const currentUserId = $derived(authState.user?.id ?? -1);
	const canManage = $derived(authState.can('administrator'));

	async function load() {
		loading = true;
		error = null;
		forbidden = false;
		try {
			const result = await listUsers({ pageSize: 100 });
			users = result.users;
		} catch (err) {
			if (err instanceof ApiError && err.isForbidden) {
				forbidden = true;
			} else {
				error = 'Seznam uživatelů se nepodařilo načíst.';
			}
		} finally {
			loading = false;
		}
	}

	async function handleChangeRole(id: number, role: Role) {
		busyId = id;
		try {
			const result = await updateUserRole(id, role);
			users = users.map((u) => (u.id === id ? { ...u, role: result.role } : u));
		} catch {
			error = 'Roli se nepodařilo změnit.';
		} finally {
			busyId = null;
		}
	}

	async function confirmDelete() {
		if (!userToDelete) return;
		const id = userToDelete.id;
		busyId = id;
		try {
			await deleteUser(id);
			users = users.filter((u) => u.id !== id);
			userToDelete = null;
		} catch {
			error = 'Uživatele se nepodařilo smazat.';
		} finally {
			busyId = null;
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Uživatelé · MeteoTrack</title>
</svelte:head>

<PageHeader title="Uživatelé" subtitle="Správa účtů a oprávnění">
	{#snippet actions()}
		{#if canManage}
			<Button onclick={() => (showInvite = true)}>
				{#snippet icon()}<Icon name="plus" size={16} />{/snippet}
				Pozvat uživatele
			</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if loading}
	<div class="state"><Spinner size="lg" /></div>
{:else if forbidden}
	<EmptyState
		title="Nedostatečná oprávnění"
		description="Pro zobrazení uživatelů potřebujete vyšší roli."
	>
		{#snippet icon()}<Icon name="users" size={28} />{/snippet}
	</EmptyState>
{:else if error}
	<EmptyState title="Chyba načítání" description={error}>
		{#snippet actions()}
			<Button variant="secondary" onclick={load}>Zkusit znovu</Button>
		{/snippet}
	</EmptyState>
{:else}
	<div class="stack">
		<Card padded={false}>
			<UserTable
				{users}
				{currentUserId}
				{canManage}
				{busyId}
				onChangeRole={handleChangeRole}
				onDelete={(user) => (userToDelete = user)}
			/>
		</Card>

		<Card title="Můj účet" subtitle="Změna přihlašovacího hesla">
			<div class="account">
				<ChangePasswordForm />
			</div>
		</Card>
	</div>
{/if}

<Modal bind:open={showInvite} title="Pozvat uživatele">
	<InviteUserForm onInvited={load} />
</Modal>

<Modal open={userToDelete !== null} title="Smazat uživatele" onClose={() => (userToDelete = null)}>
	<p class="confirm">
		Opravdu chcete smazat uživatele <strong>{userToDelete?.nickname}</strong>? Tuto akci nelze
		vrátit zpět.
	</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (userToDelete = null)}>Zrušit</Button>
		<Button variant="danger" loading={busyId === userToDelete?.id} onclick={confirmDelete}>
			Smazat
		</Button>
	{/snippet}
</Modal>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.account {
		max-width: 26rem;
	}

	.confirm {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.6;
	}

	.state {
		display: flex;
		justify-content: center;
		padding: var(--space-12);
	}
</style>
